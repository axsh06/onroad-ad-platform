import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getServerSession(authOptions);
  if (s?.user.role !== "BUYER")
    return NextResponse.json(
      { error: "Войдите как компания." },
      { status: 403 },
    );
  const { id } = await params;
  const data = await req.json().catch(() => ({}));
  if (data.consent !== true)
    return NextResponse.json(
      { error: "Подтвердите показ компании владельцу." },
      { status: 400 },
    );
  const car = await prisma.car.findFirst({
    where: { id, status: "APPROVED", city: "Астана" },
  });
  if (!car)
    return NextResponse.json(
      { error: "Автомобиль не найден." },
      { status: 404 },
    );
  await prisma.carView.upsert({
    where: { carId_buyerId: { carId: id, buyerId: s.user.id } },
    create: { carId: id, buyerId: s.user.id },
    update: { viewedAt: new Date() },
  });
  return NextResponse.json({ success: true });
}
