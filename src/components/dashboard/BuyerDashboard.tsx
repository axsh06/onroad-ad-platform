'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type Booking = { id: string; status: string; startDate: string; endDate: string; totalAmount: string | number; slot: { label: string; car: { make: string; model: string; city: string } }; campaign?: { brandName: string } | null }
const statusLabels: Record<string, string> = { PENDING: 'На рассмотрении', CONFIRMED: 'Подтверждено', APPROVED: 'Макет согласован', ACTIVE: 'Активно', COMPLETED: 'Завершено', CANCELLED: 'Отменено' }

export function BuyerDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/bookings?limit=50').then(async response => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Не удалось загрузить кампании.')
      setBookings(data.bookings || [])
    }).catch(err => setError(err instanceof Error ? err.message : 'Ошибка загрузки.')).finally(() => setLoading(false))
  }, [])
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-bold">Кабинет рекламодателя</h1><p className="mt-1 text-sm text-zinc-400">Запросы и бронирования автомобилей</p></div><Link href="/catalog" className="rounded-lg bg-lime-300 px-4 py-2.5 text-sm font-semibold text-black">Выбрать авто</Link></div>
    {loading && <p className="text-sm text-zinc-400">Загружаем…</p>}{error && <p role="alert" className="rounded-lg bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
    {!loading && !error && bookings.length === 0 && <Card><CardContent className="py-12 text-center"><p className="font-semibold">Пока нет кампаний</p><p className="mt-2 text-sm text-zinc-400">Выберите автомобиль в каталоге и отправьте запрос.</p></CardContent></Card>}
    <div className="space-y-3">{bookings.map(booking => <Card key={booking.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div><div className="flex items-center gap-2"><strong>{booking.campaign?.brandName || 'Рекламная кампания'}</strong><Badge variant={booking.status === 'ACTIVE' ? 'default' : 'secondary'}>{statusLabels[booking.status] || booking.status}</Badge></div><p className="mt-1 text-sm text-zinc-400">{booking.slot.car.make} {booking.slot.car.model} · {booking.slot.label} · {booking.slot.car.city}</p><p className="mt-1 text-xs text-zinc-500">{new Date(booking.startDate).toLocaleDateString('ru-KZ')} — {new Date(booking.endDate).toLocaleDateString('ru-KZ')}</p></div><strong className="text-lime-200">{Number(booking.totalAmount).toLocaleString('ru-KZ')} ₸</strong></CardContent></Card>)}</div>
  </div>
}
