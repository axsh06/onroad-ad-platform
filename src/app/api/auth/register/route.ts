import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const RegisterSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(100),
  phone: z.string().trim().max(32).optional(),
  companyName: z.string().trim().max(120).optional(),
  role: z.enum(['SELLER', 'BUYER']),
  consent: z.literal(true),
})

export async function POST(req: NextRequest) {
  try {
    const parsed = RegisterSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Проверьте поля формы.' }, { status: 400 })

    const { name, email, password, phone, companyName, role } = parsed.data
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, ...(phone ? [{ phone }] : [])] },
      select: { id: true },
    })
    if (existing) return NextResponse.json({ error: 'Аккаунт с таким email или телефоном уже существует.' }, { status: 409 })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        companyName: companyName || null,
        privacyConsentAt: new Date(),
        privacyConsentVersion: '2026-10-13',
        role: role as Role,
        passwordHash,
        ...(role === 'SELLER' ? { sellerProfile: { create: {} } } : {}),
      },
      select: { id: true, name: true, email: true, role: true },
    })
    return NextResponse.json({ success: true, user }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/auth/register]', error)
    return NextResponse.json({ error: 'Не удалось создать аккаунт. Проверьте подключение базы данных.' }, { status: 500 })
  }
}
