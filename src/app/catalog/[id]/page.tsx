'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { ArrowLeft, MapPin } from 'lucide-react'
import { LogoConfigurator, type SlotType } from '@/components/canvas/LogoConfigurator'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'

type Slot = { id: string; slotType: SlotType; label: string; priceWeekly: number; priceMonthly: number; isAvailable: boolean }
type Car = { id: string; make: string; model: string; year: number; color: string; city: string; photoUrls: string[]; monthlyReach: number; weeklyKm: number; adSlots: Slot[] }

export default function CarDetailPage() {
  const params = useParams<{ id: string }>()
  const [car, setCar] = useState<Car | null>(null)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [mockup, setMockup] = useState<{ fabricJson: object; previewUrl: string } | null>(null)

  useEffect(() => {
    fetch(`/api/cars/${params.id}`).then(async response => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Не удалось загрузить авто.')
      setCar(data.car)
      setSlot(data.car.adSlots[0] ?? null)
    }).catch(error => setMessage(error instanceof Error ? error.message : 'Ошибка загрузки.')).finally(() => setLoading(false))
  }, [params.id])

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#080a07] text-zinc-300">Загружаем автомобиль…</main>
  if (!car) return <main className="grid min-h-screen place-items-center bg-[#080a07] px-6 text-center text-zinc-300"><div><p>{message || 'Автомобиль не найден.'}</p><Link href="/catalog" className="mt-4 inline-block text-lime-300">Вернуться в каталог</Link></div></main>

  return <main className="min-h-screen bg-[#080a07] px-5 py-6 text-white sm:px-8">
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 flex items-center justify-between border-b border-white/10 pb-5"><Link href="/index.html"><Image src="/onroad-logo.svg" alt="ONROAD" width={160} height={36} /></Link><Link href="/catalog" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft size={16} /> К каталогу</Link></header>
      <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr]">
        <section>
          <div className="mb-6"><p className="mb-2 text-xs uppercase tracking-[.2em] text-lime-300">Карточка автомобиля</p><h1 className="text-3xl font-bold sm:text-4xl">{car.make} {car.model}</h1><p className="mt-2 flex items-center gap-2 text-sm text-zinc-400">{car.year} · {car.color} <span>·</span><MapPin size={14} />{car.city}</p></div>
          <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]">
            {car.photoUrls[0] && <img src={car.photoUrls[0]} alt={`${car.make} ${car.model}`} className="aspect-[16/9] w-full object-cover" />}
          </div>
          <h2 className="mb-3 text-lg font-semibold">Предварительный макет</h2>
          {slot && <LogoConfigurator carImageUrl={car.photoUrls[0] || '/public/car-sedan.jpg'} selectedSlot={slot.slotType} onChange={setMockup} />}
          <p className="mt-3 text-xs leading-5 text-zinc-500">Это только визуальный черновик. Перед производством размер и расположение подтверждаются владельцем автомобиля и ONROAD.</p>
        </section>
        <section>
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[.025] p-5">
            <h2 className="mb-4 text-lg font-semibold">Доступные места</h2>
            <div className="space-y-2">{car.adSlots.map(item => <button key={item.id} onClick={() => { setSlot(item); setMockup(null) }} className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${slot?.id === item.id ? 'border-lime-300/50 bg-lime-300/5' : 'border-white/10 hover:border-white/20'}`}><span><span className="block font-medium">{item.label}</span><span className="mt-1 block text-xs text-zinc-500">Можно отправить запрос на это место</span></span><span className="text-right text-sm font-semibold text-lime-200">{Number(item.priceMonthly).toLocaleString('ru-KZ')} ₸<small className="block text-xs font-normal text-zinc-500">ориентир / месяц</small></span></button>)}</div>
            {car.adSlots.length === 0 && <p className="text-sm text-zinc-400">Свободных мест сейчас нет.</p>}
          </div>
          {slot && <CheckoutForm slotId={slot.id} slotLabel={slot.label} carName={`${car.make} ${car.model}`} priceWeekly={Number(slot.priceWeekly)} priceMonthly={Number(slot.priceMonthly)} mockupData={mockup?.fabricJson} mockupUrl={mockup?.previewUrl} />}
        </section>
      </div>
    </div>
  </main>
}
