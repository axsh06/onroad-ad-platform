import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { emailReady } from "@/lib/email";
import { issueCode, rateLimit } from "@/lib/verification";
const schema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(100),
});
export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: "Проверьте email и пароль." },
        { status: 400 },
      );
    if (!emailReady())
      return NextResponse.json(
        { error: "Отправка кодов временно недоступна." },
        { status: 503 },
      );
    const email = parsed.data.email.toLowerCase().trim();
    if (
      !(await rateLimit(`verify-send:${email}`, 5)) ||
      !(await rateLimit(`verify-minute:${email}`, 1, 60))
    )
      return NextResponse.json(
        { error: "Подождите перед повторной отправкой." },
        { status: 429 },
      );
    const user = await prisma.user.findUnique({ where: { email } });
    if (
      user?.passwordHash &&
      !user.emailVerified &&
      (await bcrypt.compare(parsed.data.password, user.passwordHash))
    )
      await issueCode(user);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Письмо не отправлено. Попробуйте позже." },
      { status: 503 },
    );
  }
}
