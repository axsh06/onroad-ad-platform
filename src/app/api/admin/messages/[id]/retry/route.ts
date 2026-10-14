import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getServerSession(authOptions);
  if (s?.user.role !== "ADMIN")
    return NextResponse.json({ error: "Нет доступа." }, { status: 403 });
  const { id } = await params;
  const m = await prisma.moderationMessage.findUnique({
    where: { id },
    include: { car: { include: { owner: true } } },
  });
  if (!m || m.emailStatus !== "FAILED")
    return NextResponse.json(
      { error: "Повторная отправка недоступна." },
      { status: 400 },
    );
  try {
    await sendEmail(
      m.car.owner.email,
      "ONROAD · Проверка автомобиля",
      `${m.car.owner.name},\n\n${m.body}\n\n${process.env.NEXTAUTH_URL}/dashboard`,
      `moderation-${m.id}`,
    );
    await prisma.moderationMessage.update({
      where: { id },
      data: { emailStatus: "SENT" },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Письмо не отправлено. Проверьте настройки почты." },
      { status: 503 },
    );
  }
}
