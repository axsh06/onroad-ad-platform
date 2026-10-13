'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Duration = 'ONE_WEEK' | 'ONE_MONTH'
interface CheckoutFormProps {
  slotId: string
  slotLabel: string
  carName: string
  priceWeekly: number
  priceMonthly: number
  mockupData?: object
  mockupUrl?: string
  campaignId?: string
}

function formatKZT(amount: number) {
  return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(amount)
}

export function CheckoutForm({ slotId, slotLabel, carName, priceWeekly, priceMonthly, mockupData, mockupUrl, campaignId }: CheckoutFormProps) {
  const router = useRouter()
  const [duration, setDuration] = useState<Duration>('ONE_MONTH')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const totalAmount = duration === 'ONE_WEEK' ? priceWeekly : priceMonthly

  async function submitRequest() {
    setIsLoading(true)
    setError('')
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 7)
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, campaignId, duration, startDate: startDate.toISOString(), mockupData, mockupUrl }),
      })
      const data = await response.json()
      if (!response.ok) {
        if (response.status === 401) { router.push('/login?callbackUrl=/catalog'); return }
        throw new Error(data.error || 'Не удалось отправить запрос.')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить запрос.')
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) return <section className="rounded-2xl border border-lime-300/20 bg-lime-300/[.04] p-6">
    <div className="flex items-center gap-3"><CheckCircle2 className="text-lime-300" /><h2 className="text-lg font-semibold">Запрос отправлен</h2></div>
    <p className="mt-3 text-sm leading-6 text-zinc-300">ONROAD проверит доступность места и свяжется с вами, чтобы согласовать макет, точную стоимость, оплату и сроки. Списание денег сейчас не производится.</p>
    <Button className="mt-5" onClick={() => router.push('/dashboard')}>Открыть кабинет</Button>
  </section>

  return <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
    <h2 className="text-lg font-semibold">Запросить размещение</h2>
    <p className="mt-1 text-sm text-zinc-400">{carName} · {slotLabel}</p>
    <div className="mt-5 grid grid-cols-2 gap-3">
      {([{ value: 'ONE_WEEK', label: '1 неделя', price: priceWeekly }, { value: 'ONE_MONTH', label: '1 месяц', price: priceMonthly }] as const).map(option => <button key={option.value} type="button" onClick={() => setDuration(option.value)} className={`rounded-xl border p-4 text-left transition ${duration === option.value ? 'border-lime-300/50 bg-lime-300/5' : 'border-white/10 hover:border-white/20'}`}><span className="block text-sm text-zinc-300">{option.label}</span><strong className="mt-2 block text-lg text-lime-200">{formatKZT(option.price)}</strong><small className="text-xs text-zinc-500">черновой ориентир</small></button>)}
    </div>
    <div className="mt-5 rounded-xl border border-amber-200/10 bg-amber-200/[.04] p-4 text-xs leading-5 text-amber-100/80">Показанная сумма — пример из карточки автомобиля, не публичная оферта. Итоговые цена, выплата владельцу и график подтверждаются ONROAD до начала кампании.</div>
    {error && <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-red-400/10 p-3 text-sm text-red-200"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</p>}
    <Button className="mt-5 w-full" onClick={submitRequest} disabled={isLoading}>{isLoading ? <><Loader2 size={16} className="mr-2 animate-spin" /> Отправляем…</> : `Отправить запрос · ${formatKZT(totalAmount)}`}</Button>
    <p className="mt-3 text-center text-xs text-zinc-500">Это запрос на согласование, оплата на этом шаге не выполняется.</p>
  </section>
}

export default CheckoutForm
