import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { codeHash, rateLimit } from "@/lib/verification";
const schema = z.object({
  email: z.string().email().max(254),
  code: z.string().regex(/^\d{6}$/),
});
export async function POST(req: Request) {
  try {
    const data = schema.safeParse(await req.json());
    if (!data.success)
      return NextResponse.json(
        { error: "Введите email и шестизначный код." },
        { status: 400 },
      );
    const email = data.data.email.trim().toLowerCase();
    if (!(await rateLimit(`verify-attempt:${email}`, 15)))
      return NextResponse.json(
        { error: "Лимит попыток. Повторите через час." },
        { status: 429 },
      );
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json(
        { error: "Код неверен или истёк." },
        { status: 400 },
      );
    const valid = await prisma.$transaction(async (tx) => {
      const challenge = await tx.emailChallenge.findUnique({
        where: { userId: user.id },
      });
      if (
        !challenge ||
        challenge.expiresAt <= new Date() ||
        challenge.attempts >= 5
      )
        return false;
      const claimed = await tx.emailChallenge.updateMany({
        where: {
          userId: user.id,
          codeHash: challenge.codeHash,
          attempts: { lt: 5 },
          expiresAt: { gt: new Date() },
        },
        data: { attempts: { increment: 1 } },
      });
      if (
        !claimed.count ||
        challenge.codeHash !== codeHash(user.id, data.data.code)
      )
        return false;
      await tx.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
      await tx.emailChallenge.deleteMany({
        where: { userId: user.id, codeHash: challenge.codeHash },
      });
      return true;
    });
    return valid
      ? NextResponse.json({ success: true })
      : NextResponse.json(
          { error: "Код неверен или истёк. Запросите новый." },
          { status: 400 },
        );
  } catch {
    return NextResponse.json(
      { error: "Не удалось подтвердить почту." },
      { status: 503 },
    );
  }
}
