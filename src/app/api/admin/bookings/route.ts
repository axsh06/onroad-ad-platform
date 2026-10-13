import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Нет доступа.' }, { status: 403 })
  try {
    const bookings = await prisma.booking.findMany({
      where: { status: 'PENDING' },
      include: {
        buyer: { select: { name: true, email: true, companyName: true, phone: true } },
        slot: { include: { car: { select: { make: true, model: true, year: true, city: true, owner: { select: { name: true, email: true, phone: true } } } } } },
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('[GET /api/admin/bookings]', error)
    return NextResponse.json({ error: 'Не удалось загрузить запросы.' }, { status: 500 })
  }
}
