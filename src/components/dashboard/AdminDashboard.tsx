'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'

type CarRequest = { id: string; make: string; model: string; year: number; city: string; color: string; photoUrls: string[]; owner: { name: string; email: string; phone: string | null }; adSlots: { label: string; priceWeekly: string | number }[] }
type BookingRequest = { id: string; startDate: string; endDate: string; duration: string; totalAmount: string | number; slot: { label: string; car: { make: string; model: string; year: number; city: string; owner: { name: string; email: string; phone: string | null } } }; buyer: { name: string; email: string; companyName: string | null; phone: string | null } }

export function AdminDashboard() {
  const [cars, setCars] = useState<CarRequest[]>([])
  const [bookings, setBookings] = useState<BookingRequest[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [carResponse, bookingResponse] = await Promise.all([fetch('/api/admin/cars'), fetch('/api/admin/bookings')])
      const [carData, bookingData] = await Promise.all([carResponse.json(), bookingResponse.json()])
      if (!carResponse.ok || !bookingResponse.ok) throw new Error(carData.error || bookingData.error || 'Не удалось загрузить очередь.')
      setCars(carData.cars || []); setBookings(bookingData.bookings || []); setError('')
    } catch (err) { setError(err instanceof Error ? err.message : 'Ошибка загрузки.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  async function update(path: string, body: object) {
    const response = await fetch(path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await response.json()
    if (!response.ok) { setError(data.error || 'Не удалось обновить статус.'); return }
    await load()
  }

  return <div className="space-y-10">
    <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-lime-300">Администратор</p><h1 className="text-2xl font-bold">Очередь ONROAD</h1><p className="mt-1 text-sm text-zinc-400">Проверка автомобилей и запросов на размещение</p></div>
    {loading && <p className="text-sm text-zinc-400">Загружаем…</p>}{error && <p role="alert" className="rounded-lg bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
    <section className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Автомобили на проверке <span className="text-sm text-zinc-500">({cars.length})</span></h2></div>
      {!loading && cars.length === 0 && <Card><CardContent className="py-8 text-center text-sm text-zinc-400">Новых заявок на автомобиль нет.</CardContent></Card>}
      {cars.map(car => <Card key={car.id}><CardContent className="grid gap-5 pt-6 md:grid-cols-[220px_1fr]"><div className="grid grid-cols-2 gap-2">{car.photoUrls.slice(0,4).map(url => <img key={url} src={url} alt={`${car.make} ${car.model}`} className="aspect-square w-full rounded-lg object-cover" />)}</div><div><h3 className="text-lg font-semibold">{car.make} {car.model} · {car.year}</h3><p className="mt-1 text-sm text-zinc-400">{car.color} · {car.city}</p><p className="mt-3 text-sm">{car.owner.name} · <a className="text-lime-200" href={`mailto:${car.owner.email}`}>{car.owner.email}</a> · {car.owner.phone}</p><div className="mt-3 flex flex-wrap gap-2">{car.adSlots.map(slot => <span key={slot.label} className="rounded-full border border-white/10 px-3 py-1 text-xs">{slot.label} · {Number(slot.priceWeekly).toLocaleString('ru-KZ')} ₸/нед</span>)}</div><div className="mt-5 flex gap-3"><button onClick={() => void update(`/api/admin/cars/${car.id}/moderate`, { status: 'APPROVED' })} className="rounded-lg bg-lime-300 px-4 py-2 text-sm font-semibold text-black">Одобрить</button><button onClick={() => void update(`/api/admin/cars/${car.id}/moderate`, { status: 'REJECTED', note: window.prompt('Причина отказа (необязательно):') || '' })} className="rounded-lg border border-red-300/30 px-4 py-2 text-sm font-semibold text-red-200">Отклонить</button></div></div></CardContent></Card>)}
    </section>
    <section className="space-y-4"><h2 className="text-xl font-semibold">Запросы на кампанию <span className="text-sm text-zinc-500">({bookings.length})</span></h2>
      {!loading && bookings.length === 0 && <Card><CardContent className="py-8 text-center text-sm text-zinc-400">Новых запросов на кампанию нет.</CardContent></Card>}
      {bookings.map(booking => <Card key={booking.id}><CardContent className="flex flex-wrap items-start justify-between gap-5 pt-6"><div><h3 className="font-semibold">{booking.buyer.companyName || booking.buyer.name}</h3><p className="mt-1 text-sm text-zinc-400">{booking.buyer.email} · {booking.buyer.phone}</p><p className="mt-3 text-sm">{booking.slot.car.make} {booking.slot.car.model} · {booking.slot.label} · {booking.slot.car.city}</p><p className="mt-1 text-xs text-zinc-500">{new Date(booking.startDate).toLocaleDateString('ru-KZ')} — {new Date(booking.endDate).toLocaleDateString('ru-KZ')} · {booking.duration === 'ONE_WEEK' ? '1 неделя' : '1 месяц'}</p><p className="mt-2 text-sm text-lime-200">Предварительная сумма: {Number(booking.totalAmount).toLocaleString('ru-KZ')} ₸</p><p className="mt-2 max-w-xl text-xs leading-5 text-amber-100/70">Подтверждайте запрос только после согласования договора и проверки фактической оплаты. Статус не выполняет банковский перевод.</p></div><div className="flex gap-2"><button onClick={() => void update(`/api/admin/bookings/${booking.id}`, { status: 'CONFIRMED' })} className="rounded-lg bg-lime-300 px-4 py-2 text-sm font-semibold text-black">Подтвердить вручную</button><button onClick={() => void update(`/api/admin/bookings/${booking.id}`, { status: 'CANCELLED', note: 'Отклонено администратором' })} className="rounded-lg border border-red-300/30 px-4 py-2 text-sm text-red-200">Отклонить</button></div></CardContent></Card>)}
    </section>
  </div>
}
