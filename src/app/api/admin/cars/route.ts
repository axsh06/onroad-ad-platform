import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CarStatus } from "@prisma/client";
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN")
    return NextResponse.json({ error: "Нет доступа." }, { status: 403 });
  try {
    const params = new URL(req.url).searchParams;
    const status = params.get("status") || "PENDING";
    const page = Math.max(1, Math.floor(Number(params.get("page")) || 1));
    const limit = 20;
    if (!Object.values(CarStatus).includes(status as CarStatus))
      return NextResponse.json(
        { error: "Некорректный статус." },
        { status: 400 },
      );
    const [cars, groups] = await Promise.all([
      prisma.car.findMany({
        where: { status: status as CarStatus },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          owner: { select: { name: true, email: true, phone: true } },
          adSlots: true,
          moderationHistory: { orderBy: { createdAt: "desc" }, take: 20 },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.car.groupBy({ by: ["status"], _count: true }),
    ]);
    const counts = Object.fromEntries(groups.map((g) => [g.status, g._count]));
    return NextResponse.json({
      cars: cars.map(({ plateNumber: _p, documentUrls: _d, ...car }) => car),
      counts,
      page,
      pages: Math.ceil((counts[status] || 0) / limit),
    });
  } catch {
    return NextResponse.json(
      { error: "Не удалось загрузить заявки." },
      { status: 503 },
    );
  }
}
