import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({ status: z.enum(['CONFIRMED', 'CANCELLED']), note: z.string().max(500).optional() })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Нет доступа.' }, { status: 403 })
  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Некорректный статус.' }, { status: 400 })
  try {
    const result = await prisma.$transaction(async tx => {
      const booking = await tx.booking.findUnique({ where: { id }, include: { slot: true } })
      if (!booking) throw new Error('NOT_FOUND')
      if (booking.status !== 'PENDING') throw new Error('INVALID_STATE')
      if (parsed.data.status === 'CONFIRMED') {
        const conflict = await tx.booking.findFirst({ where: { id: { not: booking.id }, slotId: booking.slotId, status: { in: ['CONFIRMED', 'APPROVED', 'ACTIVE'] }, startDate: { lt: booking.endDate }, endDate: { gt: booking.startDate } } })
        if (conflict) throw new Error('SLOT_CONFLICT')
        await tx.adSlot.update({ where: { id: booking.slotId }, data: { isAvailable: false } })
      }
      return tx.booking.update({ where: { id: booking.id }, data: { status: parsed.data.status, adminNote: parsed.data.note ?? null } })
    }, { isolationLevel: 'Serializable' })
    return NextResponse.json({ success: true, booking: result })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2034') {
      return NextResponse.json({ error: 'Другая заявка изменилась одновременно. Обновите список и повторите.' }, { status: 409 })
    }
    const message = error instanceof Error ? error.message : ''
    if (message === 'NOT_FOUND') return NextResponse.json({ error: 'Запрос не найден.' }, { status: 404 })
    if (message === 'INVALID_STATE') return NextResponse.json({ error: 'Статус уже был изменён.' }, { status: 409 })
    if (message === 'SLOT_CONFLICT') return NextResponse.json({ error: 'На эти даты место уже занято.' }, { status: 409 })
    console.error('[PATCH /api/admin/bookings/[id]]', error)
    return NextResponse.json({ error: 'Не удалось изменить статус.' }, { status: 500 })
  }
}
