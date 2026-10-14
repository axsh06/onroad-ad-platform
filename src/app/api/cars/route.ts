// src/app/api/cars/route.ts
// ─────────────────────────────────────────────────────────────────
// GET  /api/cars — каталог одобренных авто с фильтрами
// POST /api/cars — регистрация авто (Seller onboarding)
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { CarClass, SlotType, Prisma } from "@prisma/client";

// ─── GET /api/cars — Каталог ─────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const city = "Астана";
    const carClass = searchParams.get("class") as CarClass | null;
    const availableSlot = searchParams.get("slot") as SlotType | null;
    const minReach = searchParams.get("minReach");
    if (
      (carClass && !Object.values(CarClass).includes(carClass)) ||
      (availableSlot && !Object.values(SlotType).includes(availableSlot)) ||
      (minReach && (!Number.isFinite(Number(minReach)) || Number(minReach) < 0))
    )
      return NextResponse.json(
        { error: "Некорректный фильтр." },
        { status: 400 },
      );
    const search = (searchParams.get("q") || "").trim().slice(0, 100);
    const pageNumber = Number(searchParams.get("page"));
    const page =
      Number.isSafeInteger(pageNumber) && pageNumber > 0 && pageNumber <= 100000
        ? pageNumber
        : 1;
    const limit = Math.min(
      50,
      Math.max(1, Math.floor(Number(searchParams.get("limit")) || 12)),
    );
    const skip = (page - 1) * limit;

    const whereClause: Prisma.CarWhereInput = {
      status: "APPROVED" as const,
      ...(city
        ? { city: { contains: city, mode: "insensitive" as const } }
        : {}),
      ...(carClass ? { class: carClass } : {}),
      ...(search
        ? {
            AND: search.split(/\s+/).map((term) => ({
              OR: [
                { make: { contains: term, mode: "insensitive" as const } },
                { model: { contains: term, mode: "insensitive" as const } },
              ],
            })),
          }
        : {}),
      ...(minReach ? { monthlyReach: { gte: Number(minReach) } } : {}),
      ...(availableSlot
        ? {
            adSlots: {
              some: {
                slotType: availableSlot,
                isAvailable: true,
                bookings: {
                  none: {
                    status: { in: ["CONFIRMED", "APPROVED", "ACTIVE"] },
                    endDate: { gt: new Date() },
                  },
                },
              },
            },
          }
        : {}),
    };

    const [cars, total] = await Promise.all([
      prisma.car.findMany({
        where: whereClause,
        include: {
          adSlots: {
            select: {
              id: true,
              slotType: true,
              label: true,
              priceWeekly: true,
              priceMonthly: true,
              isAvailable: true,
              bookings: {
                where: {
                  status: { in: ["CONFIRMED", "APPROVED", "ACTIVE"] },
                  endDate: { gt: new Date() },
                },
                select: { id: true },
                take: 1,
              },
            },
          },
          owner: {
            select: { name: true, avatarUrl: true },
          },
        },
        orderBy: [{ monthlyReach: "desc" }, { id: "asc" }],
        skip,
        take: limit,
      }),
      prisma.car.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      cars: cars.map((car) => ({
        ...car,
        adSlots: car.adSlots.map(({ bookings, ...slot }) => ({
          ...slot,
          isAvailable: slot.isAvailable && bookings.length === 0,
        })),
        // Не показываем гос. номер в каталоге
        plateNumber: undefined,
        documentUrls: undefined,
        moderationNote: undefined,
        modelAssetId: undefined,
        modelUrl: car.modelAssetId ? `/api/media/${car.modelAssetId}` : null,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/cars] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── Validation ──────────────────────────────────────────────────

const CreateCarSchema = z.object({
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(2000).max(new Date().getFullYear()),
  class: z.nativeEnum(CarClass),
  color: z.string().min(1).max(30),
  plateNumber: z.string().min(4).max(10).optional(),
  city: z.literal("Астана"),
  districts: z.array(z.string()).min(1).max(10),
  photoUrls: z.array(z.string().url()).min(1).max(10),
  documentUrls: z.array(z.string().url()).max(0).default([]),
  // Placement zones for new cars
  slotPrices: z
    .object({
      HOOD: z
        .object({
          weekly: z.number().positive().max(1000000),
          monthly: z.number().positive().max(1000000),
        })
        .optional(),
      LEFT_DOOR: z
        .object({
          weekly: z.number().positive().max(1000000),
          monthly: z.number().positive().max(1000000),
        })
        .optional(),
      RIGHT_DOOR: z
        .object({
          weekly: z.number().positive().max(1000000),
          monthly: z.number().positive().max(1000000),
        })
        .optional(),
      REAR_BODY: z
        .object({
          weekly: z.number().positive().max(1000000),
          monthly: z.number().positive().max(1000000),
        })
        .optional(),
    })
    .refine(
      (value) => Object.values(value).some(Boolean),
      "Выберите хотя бы одну зону",
    ),
});

// ─── POST /api/cars — Регистрация авто ──────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "SELLER") {
      return NextResponse.json(
        { error: "Only sellers can register cars" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = CreateCarSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { slotPrices, ...carData } = parsed.data;

    const mediaIds = carData.photoUrls.map(
      (url) =>
        new URL(url).pathname.match(/^\/api\/media\/([a-f0-9-]{36})$/)?.[1],
    );
    if (
      mediaIds.some((id) => !id) ||
      new Set(mediaIds).size !== mediaIds.length
    ) {
      return NextResponse.json(
        { error: "Загрузите фотографии через форму автомобиля." },
        { status: 400 },
      );
    }
    const ids = mediaIds as string[];
    const assets = await prisma.mediaAsset.count({
      where: {
        id: { in: ids },
        ownerId: session.user.id,
        carId: null,
        kind: "PHOTO",
      },
    });
    if (assets !== ids.length)
      return NextResponse.json(
        { error: "Фотографии недоступны. Загрузите их повторно." },
        { status: 400 },
      );
    const origin = process.env.NEXTAUTH_URL || req.nextUrl.origin;
    carData.photoUrls = ids.map((id) =>
      new URL(`/api/media/${id}`, origin).toString(),
    );

    // Создаём автомобиль и выбранные зоны атомарно
    const car = await prisma.$transaction(async (tx) => {
      const newCar = await tx.car.create({
        data: {
          ...carData,
          ownerId: session.user.id,
          status: "PENDING",
          adSlots: {
            create: (
              Object.entries(slotPrices) as [
                keyof typeof slotPrices,
                NonNullable<(typeof slotPrices)[keyof typeof slotPrices]>,
              ][]
            )
              .filter(
                (
                  entry,
                ): entry is [
                  keyof typeof slotPrices,
                  NonNullable<(typeof entry)[1]>,
                ] => Boolean(entry[1]),
              )
              .map(([slotType, price]) => ({
                slotType,
                label: {
                  HOOD: "Капот",
                  LEFT_DOOR: "Левая дверь",
                  RIGHT_DOOR: "Правая дверь",
                  REAR_BODY: "Задняя часть кузова",
                }[slotType],
                priceWeekly: price.weekly,
                priceMonthly: price.monthly,
              })),
          },
        },
        include: { adSlots: true },
      });

      const linked = await tx.mediaAsset.updateMany({
        where: {
          id: { in: ids },
          ownerId: session.user.id,
          carId: null,
          kind: "PHOTO",
        },
        data: { carId: newCar.id },
      });
      if (linked.count !== ids.length) throw new Error("PHOTO_ALREADY_LINKED");

      // Создаём SellerProfile если не существует
      await tx.sellerProfile.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id },
        update: {},
      });

      return newCar;
    });

    return NextResponse.json({ success: true, car }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/cars] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
