import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Нет доступа.' }, { status: 403 })
  try {
    const cars = await prisma.car.findMany({
      where: { status: 'PENDING' },
      include: { owner: { select: { name: true, email: true, phone: true } }, adSlots: true },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ cars: cars.map(({ plateNumber: _plate, documentUrls: _docs, ...car }) => car) })
  } catch (error) {
    console.error('[GET /api/admin/cars]', error)
    return NextResponse.json({ error: 'Не удалось загрузить заявки.' }, { status: 500 })
  }
}
