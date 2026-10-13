import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const car = await prisma.car.findFirst({
      where: { id, status: 'APPROVED' },
      select: {
        id: true, make: true, model: true, year: true, class: true, color: true, city: true,
        districts: true, photoUrls: true, monthlyReach: true, weeklyKm: true,
        adSlots: { where: { isAvailable: true }, select: { id: true, slotType: true, label: true, priceWeekly: true, priceMonthly: true, isAvailable: true } },
      },
    })
    if (!car) return NextResponse.json({ error: 'Автомобиль не найден или ещё не прошёл проверку.' }, { status: 404 })
    return NextResponse.json({ car })
  } catch (error) {
    console.error('[GET /api/cars/[id]]', error)
    return NextResponse.json({ error: 'Не удалось загрузить автомобиль.' }, { status: 500 })
  }
}
