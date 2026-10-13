// src/app/api/bookings/route.ts
// ─────────────────────────────────────────────────────────────────
// POST /api/bookings — создание бронирования с расчётом комиссии
// GET  /api/bookings — список бронирований текущего пользователя
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateCommission, getSlotPrice, calculateEndDate } from '@/lib/commission'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// ─── Validation Schema ───────────────────────────────────────────

const CreateBookingSchema = z.object({
  slotId: z.string().cuid(),
  campaignId: z.string().cuid().optional(),
  duration: z.enum(['ONE_WEEK', 'ONE_MONTH']),
  startDate: z.string().datetime(),
  mockupData: z.record(z.unknown()).optional(), // Fabric.js JSON
  mockupUrl: z.string().url().optional(),
})

// ─── POST /api/bookings ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. Аутентификация
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'BUYER') {
      return NextResponse.json({ error: 'Only buyers can create bookings' }, { status: 403 })
    }

    // 2. Валидация тела запроса
    const body = await req.json()
    const parsed = CreateBookingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { slotId, campaignId, duration, startDate, mockupData, mockupUrl } = parsed.data
    if (campaignId) {
      const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, buyerId: session.user.id }, select: { id: true } })
      if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // 3. Получение слота и проверка доступности
    const slot = await prisma.adSlot.findUnique({
      where: { id: slotId },
      include: {
        car: {
          select: { status: true, ownerId: true }
        }
      }
    })

    if (!slot) {
      return NextResponse.json({ error: 'Ad slot not found' }, { status: 404 })
    }
    if (!slot.isAvailable) {
      return NextResponse.json({ error: 'This slot is currently unavailable' }, { status: 409 })
    }
    if (slot.car.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Car is not approved for advertising' }, { status: 409 })
    }

    // 4. Проверка пересечений дат (нет активных букингов на этот слот)
    const startDateObj = new Date(startDate)
    const endDateObj = calculateEndDate(startDateObj, duration)

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        slotId,
        status: { in: ['CONFIRMED', 'APPROVED', 'ACTIVE'] },
        AND: [
          { startDate: { lt: endDateObj } },
          { endDate: { gt: startDateObj } },
        ]
      }
    })

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'Slot is already booked for the selected dates' },
        { status: 409 }
      )
    }

    // 5. Расчёт стоимости и комиссии
    const totalAmount = Number(
      getSlotPrice(Number(slot.priceWeekly), Number(slot.priceMonthly), duration)
    )
    const { sellerAmount, platformFee } = calculateCommission(totalAmount)

    // 6. Создание бронирования в транзакции
    const booking = await prisma.$transaction(async (tx) => {
      // Создаём бронирование
      const newBooking = await tx.booking.create({
        data: {
          buyerId: session.user.id,
          slotId,
          campaignId: campaignId ?? null,
          duration,
          startDate: startDateObj,
          endDate: endDateObj,
          mockupData: mockupData ? (mockupData as object) : undefined,
          mockupUrl: mockupUrl ?? null,
          totalAmount,
          sellerAmount,
          platformFee,
          status: 'PENDING',
        },
        include: {
          slot: {
            include: {
              car: {
                select: { make: true, model: true, year: true, city: true }
              }
            }
          },
          campaign: { select: { name: true, brandName: true } }
        }
      })

      // PENDING is a request for manual review, not a confirmed reservation.
      // The administrator marks the slot occupied only after confirming terms/payment.
      return newBooking
    })

    // 7. Формируем ответ с деталями для frontend
    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        duration: booking.duration,
        startDate: booking.startDate,
        endDate: booking.endDate,
        car: booking.slot.car,
        slot: {
          id: booking.slot.id,
          slotType: booking.slot.slotType,
          label: booking.slot.label,
        },
        campaign: booking.campaign,
        pricing: {
          totalAmount,
          sellerAmount,
          platformFee,
          currency: 'KZT',
          commissionRate: '40%',
        },
        mockupUrl: booking.mockupUrl,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('[POST /api/bookings] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── GET /api/bookings ───────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '10')))
    const skip = (page - 1) * limit

    // Для Seller — получаем бронирования своих авто
    // Для Buyer — получаем свои бронирования
    const whereClause = session.user.role === 'SELLER'
      ? {
          slot: { car: { ownerId: session.user.id } },
          ...(status ? { status: status as never } : {})
        }
      : {
          buyerId: session.user.id,
          ...(status ? { status: status as never } : {})
        }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        include: {
          slot: {
            include: {
              car: {
                select: { make: true, model: true, year: true, city: true, photoUrls: true }
              }
            }
          },
          campaign: { select: { name: true, brandName: true, logoUrl: true } },
          payment: { select: { status: true, method: true, paidAt: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where: whereClause })
    ])

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('[GET /api/bookings] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
