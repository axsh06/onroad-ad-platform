import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const s = await getServerSession(authOptions);
  if (s?.user.role !== "SELLER")
    return NextResponse.json({ error: "Нет доступа." }, { status: 403 });
  const cars = await prisma.car.findMany({
    where: { ownerId: s.user.id },
    include: {
      adSlots: {
        include: {
          bookings: {
            where: {
              status: { in: ["CONFIRMED", "APPROVED", "ACTIVE"] },
              endDate: { gt: new Date() },
            },
            select: {
              id: true,
              status: true,
              startDate: true,
              endDate: true,
              buyer: { select: { companyName: true, name: true } },
            },
          },
        },
      },
      moderationHistory: { orderBy: { createdAt: "desc" }, take: 20 },
      views: {
        orderBy: { viewedAt: "desc" },
        take: 30,
        select: {
          viewedAt: true,
          buyerId: true,
          buyer: { select: { companyName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    cars: cars.map((car) => ({
      ...car,
      adSlots: car.adSlots.map((slot) => ({
        ...slot,
        isAvailable: slot.isAvailable && slot.bookings.length === 0,
      })),
      modelUrl: car.modelAssetId ? `/api/media/${car.modelAssetId}` : null,
    })),
  });
}
