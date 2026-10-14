import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { z } from "zod";
const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "NEEDS_INFO"]),
  note: z.string().trim().min(10).max(2000),
});
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN")
    return NextResponse.json({ error: "Нет доступа." }, { status: 403 });
  try {
    const { id } = await params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: "Добавьте комментарий: от 10 до 2000 символов." },
        { status: 400 },
      );
    const car = await prisma.car.findUnique({
      where: { id },
      include: { owner: true },
    });
    if (!car)
      return NextResponse.json(
        { error: "Автомобиль не найден." },
        { status: 404 },
      );
    if (parsed.data.status === "APPROVED" && car.city !== "Астана")
      return NextResponse.json(
        { error: "Сейчас доступна только Астана." },
        { status: 400 },
      );
    const message = await prisma.$transaction(async (tx) => {
      await tx.car.update({
        where: { id },
        data: { status: parsed.data.status, moderationNote: parsed.data.note },
      });
      return tx.moderationMessage.create({
        data: { carId: id, status: parsed.data.status, body: parsed.data.note },
      });
    });
    let emailStatus = "SENT";
    try {
      await sendEmail(
        car.owner.email,
        `ONROAD · ${car.make} ${car.model}`,
        `${car.owner.name},\n\n${parsed.data.note}\n\n${process.env.NEXTAUTH_URL}/dashboard\n\nONROAD · ASTANA, KZ`,
        `moderation-${message.id}`,
      );
    } catch {
      emailStatus = "FAILED";
    }
    await prisma.moderationMessage.update({
      where: { id: message.id },
      data: { emailStatus },
    });
    return NextResponse.json({ success: true, emailStatus });
  } catch {
    return NextResponse.json(
      { error: "Не удалось сохранить решение." },
      { status: 503 },
    );
  }
}
