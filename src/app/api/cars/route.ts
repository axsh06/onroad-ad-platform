// src/app/api/cars/route.ts
// ─────────────────────────────────────────────────────────────────
// GET  /api/cars — каталог одобренных авто с фильтрами
// POST /api/cars — регистрация авто (Seller onboarding)
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { CarClass, SlotType } from '@prisma/client'

// ─── GET /api/cars — Каталог ─────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const city = searchParams.get('city')
    const carClass = searchParams.get('class') as CarClass | null
    const availableSlot = searchParams.get('slot') as SlotType | null
    const minReach = searchParams.get('minReach')
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '12')))
    const skip = (page - 1) * limit

    const whereClause = {
      status: 'APPROVED' as const,
      ...(city ? { city: { contains: city, mode: 'insensitive' as const } } : {}),
      ...(carClass ? { class: carClass } : {}),
      ...(minReach ? { monthlyReach: { gte: Number(minReach) } } : {}),
      ...(availableSlot ? {
        adSlots: {
          some: { slotType: availableSlot, isAvailable: true }
        }
      } : {}),
    }

    const [cars, total] = await Promise.all([
      prisma.car.findMany({
        where: whereClause,
        include: {
          adSlots: {
            select: {
              id: true,
              slotType: true,
              label: true,
              priceWeekly: true,
              priceMonthly: true,
              isAvailable: true,
            }
          },
          owner: {
            select: { name: true, avatarUrl: true }
          }
        },
        orderBy: { monthlyReach: 'desc' },
        skip,
        take: limit,
      }),
      prisma.car.count({ where: whereClause })
    ])

    return NextResponse.json({
      cars: cars.map(car => ({
        ...car,
        // Не показываем гос. номер в каталоге
        plateNumber: undefined,
        documentUrls: undefined,
        moderationNote: undefined,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })

  } catch (error) {
    console.error('[GET /api/cars] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── Validation ──────────────────────────────────────────────────

const CreateCarSchema = z.object({
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(2000).max(new Date().getFullYear()),
  class: z.nativeEnum(CarClass),
  color: z.string().min(1).max(30),
  plateNumber: z.string().min(4).max(10).optional(),
  city: z.string().min(1).max(50),
  districts: z.array(z.string()).min(1).max(10),
  photoUrls: z.array(z.string().url()).min(1).max(10),
  documentUrls: z.array(z.string().url()).max(0).default([]),
  // Цены за 5 слотов
  slotPrices: z.object({
    HOOD: z.object({ weekly: z.number().positive(), monthly: z.number().positive() }).optional(),
    FRONT_DOORS: z.object({ weekly: z.number().positive(), monthly: z.number().positive() }).optional(),
    REAR_DOORS: z.object({ weekly: z.number().positive(), monthly: z.number().positive() }).optional(),
    FENDERS: z.object({ weekly: z.number().positive(), monthly: z.number().positive() }).optional(),
    REAR_WINDOW_BUMPER: z.object({ weekly: z.number().positive(), monthly: z.number().positive() }).optional(),
  }).refine(value => Object.values(value).some(Boolean), 'Выберите хотя бы одну зону'),
})

// ─── POST /api/cars — Регистрация авто ──────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'SELLER') {
      return NextResponse.json({ error: 'Only sellers can register cars' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = CreateCarSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { slotPrices, ...carData } = parsed.data

    const mediaIds = carData.photoUrls.map(url => new URL(url).pathname.match(/^\/api\/media\/([a-f0-9-]{36})$/)?.[1])
    if (mediaIds.some(id => !id) || new Set(mediaIds).size !== mediaIds.length) {
      return NextResponse.json({ error: 'Загрузите фотографии через форму автомобиля.' }, { status: 400 })
    }
    const ids = mediaIds as string[]
    const assets = await prisma.mediaAsset.count({ where: { id: { in: ids }, ownerId: session.user.id, carId: null } })
    if (assets !== ids.length) return NextResponse.json({ error: 'Фотографии недоступны. Загрузите их повторно.' }, { status: 400 })
    const origin = process.env.NEXTAUTH_URL || req.nextUrl.origin
    carData.photoUrls = ids.map(id => new URL(`/api/media/${id}`, origin).toString())

    // Создаём авто + 5 слотов атомарно
    const car = await prisma.$transaction(async (tx) => {
      const newCar = await tx.car.create({
        data: {
          ...carData,
          ownerId: session.user.id,
          status: 'PENDING',
          adSlots: {
            create: (Object.entries(slotPrices) as [keyof typeof slotPrices, NonNullable<(typeof slotPrices)[keyof typeof slotPrices]>][])
              .filter((entry): entry is [keyof typeof slotPrices, NonNullable<typeof entry[1]>] => Boolean(entry[1]))
              .map(([slotType, price]) => ({
                slotType,
                label: {
                  HOOD: 'Капот', FRONT_DOORS: 'Передние двери', REAR_DOORS: 'Задние двери',
                  FENDERS: 'Крылья', REAR_WINDOW_BUMPER: 'Заднее стекло / Бампер',
                }[slotType],
                priceWeekly: price.weekly,
                priceMonthly: price.monthly,
              }))
          }
        },
        include: { adSlots: true }
      })

      const linked = await tx.mediaAsset.updateMany({ where: { id: { in: ids }, ownerId: session.user.id, carId: null }, data: { carId: newCar.id } })
      if (linked.count !== ids.length) throw new Error('PHOTO_ALREADY_LINKED')

      // Создаём SellerProfile если не существует
      await tx.sellerProfile.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id },
        update: {},
      })

      return newCar
    })

    return NextResponse.json({ success: true, car }, { status: 201 })

  } catch (error) {
    console.error('[POST /api/cars] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
