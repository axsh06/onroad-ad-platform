import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const car = await prisma.car.findFirst({
      where: { id, status: "APPROVED", city: "Астана" },
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        class: true,
        color: true,
        city: true,
        modelAssetId: true,
        modelHotspots: true,
        districts: true,
        photoUrls: true,
        monthlyReach: true,
        weeklyKm: true,
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
      },
    });
    if (!car)
      return NextResponse.json(
        { error: "Автомобиль не найден или ещё не прошёл проверку." },
        { status: 404 },
      );
    return NextResponse.json({
      car: {
        ...car,
        adSlots: car.adSlots.map(({ bookings, ...slot }) => ({
          ...slot,
          isAvailable: slot.isAvailable && bookings.length === 0,
        })),
        modelAssetId: undefined,
        modelUrl: car.modelAssetId ? `/api/media/${car.modelAssetId}` : null,
      },
    });
  } catch (error) {
    console.error("[GET /api/cars/[id]]", error);
    return NextResponse.json(
      { error: "Не удалось загрузить автомобиль." },
      { status: 500 },
    );
  }
}
