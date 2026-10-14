import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  if (session.user.role !== "SELLER")
    return NextResponse.json({ error: "Нет доступа." }, { status: 403 });

  try {
    const [profile, activeBookings, completedBookings] = await Promise.all([
      prisma.sellerProfile.findUnique({ where: { userId: session.user.id } }),
      prisma.booking.count({
        where: {
          slot: { car: { ownerId: session.user.id } },
          status: { in: ["PENDING", "CONFIRMED", "APPROVED", "ACTIVE"] },
          endDate: { gt: new Date() },
        },
      }),
      prisma.booking.count({
        where: {
          slot: { car: { ownerId: session.user.id } },
          status: "COMPLETED",
        },
      }),
    ]);
    return NextResponse.json({
      totalEarnings: Number(profile?.totalEarnings ?? 0),
      pendingPayout: Number(profile?.pendingPayout ?? 0),
      completedPayout: Number(profile?.completedPayout ?? 0),
      activeBookings,
      completedBookings,
    });
  } catch (error) {
    console.error("[GET /api/seller/stats]", error);
    return NextResponse.json(
      { error: "Не удалось загрузить данные кабинета." },
      { status: 500 },
    );
  }
}
