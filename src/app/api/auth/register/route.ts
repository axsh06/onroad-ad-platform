import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { emailReady } from "@/lib/email";
import { issueCode, rateLimit } from "@/lib/verification";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const RegisterSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(100),
    phone: z.string().trim().max(32).optional(),
    companyName: z.string().trim().max(120).optional(),
    role: z.enum(["SELLER", "BUYER"]),
    consent: z.literal(true),
    locale: z.enum(["ru", "kk", "en"]).default("ru"),
  })
  .refine(
    (v) => v.role !== "BUYER" || (v.companyName?.trim().length ?? 0) >= 2,
  );

export async function POST(req: NextRequest) {
  try {
    const parsed = RegisterSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: "Проверьте поля формы." },
        { status: 400 },
      );

    if (!emailReady())
      return NextResponse.json(
        { error: "Отправка кодов временно недоступна. Попробуйте позже." },
        { status: 503 },
      );
    const { name, email, password, phone, companyName, role, locale } =
      parsed.data;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (
      !(await rateLimit(`register:${ip}`, 10)) ||
      !(await rateLimit(`verify-send:${email.toLowerCase()}`, 5))
    )
      return NextResponse.json(
        { error: "Слишком много попыток. Попробуйте через час." },
        { status: 429 },
      );
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, ...(phone ? [{ phone }] : [])],
      },
      select: { id: true },
    });
    if (existing)
      return NextResponse.json(
        { error: "Аккаунт с таким email или телефоном уже существует." },
        { status: 409 },
      );

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        locale,
        verificationRequired: true,
        email: email.toLowerCase(),
        phone: phone || null,
        companyName: companyName || null,
        privacyConsentAt: new Date(),
        privacyConsentVersion: "2026-10-13",
        role: role as Role,
        passwordHash,
        ...(role === "SELLER" ? { sellerProfile: { create: {} } } : {}),
      },
      select: { id: true, name: true, email: true, role: true, locale: true },
    });
    try {
      await issueCode(user);
    } catch {
      return NextResponse.json(
        {
          error:
            "Аккаунт создан, но письмо не отправлено. Запросите новый код на странице подтверждения.",
          requiresVerification: true,
          email: user.email,
        },
        { status: 202 },
      );
    }
    return NextResponse.json(
      { success: true, requiresVerification: true, email: user.email },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json(
      {
        error: "Не удалось создать аккаунт. Проверьте подключение базы данных.",
      },
      { status: 500 },
    );
  }
}
