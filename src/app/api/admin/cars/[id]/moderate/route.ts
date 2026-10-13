// src/app/api/admin/cars/[id]/moderate/route.ts
// ─────────────────────────────────────────────────────────────────
// PATCH /api/admin/cars/[id]/moderate — модерация авто
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const ModerateCarSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().max(500).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = ModerateCarSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const car = await prisma.car.update({
      where: { id },
      data: {
        status: parsed.data.status,
        moderationNote: parsed.data.note ?? null,
      }
    })

    return NextResponse.json({ success: true, car })
  } catch (error) {
    console.error('[PATCH /admin/cars/moderate] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
