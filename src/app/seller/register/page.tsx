'use client'

import { FormEvent, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { preparePhoto } from '@/lib/client/prepare-photo'
import { ArrowLeft, ArrowRight, Car, CheckCircle2, ImagePlus, Loader2 } from 'lucide-react'

const SLOT_OPTIONS = [
  { id: 'HOOD', label: 'Капот', weekly: 45000 },
  { id: 'FRONT_DOORS', label: 'Передние двери', weekly: 35000 },
  { id: 'REAR_DOORS', label: 'Задние двери', weekly: 30000 },
  { id: 'FENDERS', label: 'Крылья', weekly: 25000 },
  { id: 'REAR_WINDOW_BUMPER', label: 'Заднее стекло / бампер', weekly: 20000 },
] as const
const inputClass = 'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-lime-300/50'
const labelClass = 'mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-400'

export default function SellerRegisterPage() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [slots, setSlots] = useState<string[]>(['FRONT_DOORS', 'REAR_DOORS'])
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', make: '', model: '', year: '', class: 'PREMIUM', color: '', city: 'Алматы', districts: '' })
  const set = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (!files.length) throw new Error('Добавьте хотя бы одну фотографию.')
      const preparedPhotos = []
      for (const file of files) preparedPhotos.push(await preparePhoto(file))
      const registration = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, phone: form.phone, role: 'SELLER', consent: true }),
      })
      if (!registration.ok && registration.status !== 409) {
        const data = await registration.json().catch(() => ({}))
        throw new Error(data.error || 'Не удалось создать аккаунт.')
      }
      const login = await signIn('credentials', { email: form.email, password: form.password, redirect: false })
      if (login?.error) throw new Error('Аккаунт создан, но войти не получилось. Войдите через страницу входа и повторите отправку автомобиля.')

      const photoUrls: string[] = []
      for (const file of preparedPhotos) {
        const data = new FormData()
        data.append('file', file, 'car.jpg')
        const response = await fetch('/api/uploads', { method: 'POST', body: data })
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.error || 'Не удалось загрузить фотографию.')
        photoUrls.push(result.url)
      }

      const slotPrices = Object.fromEntries(SLOT_OPTIONS.filter(slot => slots.includes(slot.id)).map(slot => [slot.id, { weekly: slot.weekly, monthly: slot.weekly * 4 }]))
      const response = await fetch('/api/cars', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: form.make, model: form.model, year: Number(form.year), class: form.class,
          color: form.color, city: form.city, districts: form.districts.split(',').map(value => value.trim()).filter(Boolean),
          photoUrls, documentUrls: [], slotPrices,
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Не удалось отправить автомобиль на проверку.')
      router.push('/dashboard?submitted=1')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка. Попробуйте ещё раз.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="auth-page min-h-screen bg-[#080a07] px-5 py-8 text-white sm:px-8">
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <Link href="/index.html" aria-label="На главную"><Image src="/onroad-logo.svg" alt="ONROAD" width={170} height={33} /></Link>
        <Link href="/index.html" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft size={16} /> На главную</Link>
      </header>
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-lime-300">Для владельцев авто</p>
        <h1 className="text-3xl font-bold sm:text-4xl">Предложить автомобиль</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Расскажите о машине и доступных местах размещения. После проверки мы свяжемся с вами и обсудим подходящие кампании. Отправка заявки не гарантирует участие или конкретный доход.</p>
      </div>
      <form onSubmit={submit} className="space-y-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-lime-300/10 text-lime-300">01</span><h2 className="text-lg font-semibold">Контакт для обратной связи</h2></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Имя"><input className={inputClass} autoComplete="name" required minLength={2} value={form.name} onChange={e => set('name', e.target.value)} /></Field>
            <Field label="Телефон"><input className={inputClass} autoComplete="tel" type="tel" required value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+7 …" /></Field>
            <Field label="Email"><input className={inputClass} autoComplete="email" type="email" required value={form.email} onChange={e => set('email', e.target.value)} /></Field>
            <Field label="Пароль (от 8 символов)"><input className={inputClass} autoComplete="new-password" type="password" required minLength={8} value={form.password} onChange={e => set('password', e.target.value)} /></Field>
          </div>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-lime-300/10 text-lime-300">02</span><h2 className="text-lg font-semibold">Данные автомобиля</h2></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Марка"><input className={inputClass} required maxLength={50} value={form.make} onChange={e => set('make', e.target.value)} placeholder="BMW" /></Field>
            <Field label="Модель"><input className={inputClass} required maxLength={50} value={form.model} onChange={e => set('model', e.target.value)} placeholder="5 Series" /></Field>
            <Field label="Год"><input className={inputClass} required type="number" min="2000" max={new Date().getFullYear()} value={form.year} onChange={e => set('year', e.target.value)} placeholder="2022" /></Field>
            <Field label="Цвет"><input className={inputClass} required maxLength={30} value={form.color} onChange={e => set('color', e.target.value)} placeholder="Чёрный" /></Field>
            <Field label="Класс автомобиля"><select className={inputClass} value={form.class} onChange={e => set('class', e.target.value)}><option value="SPORT">Спорт</option><option value="PREMIUM">Премиум</option><option value="LUXURY">Люкс</option><option value="SUV">Кроссовер / внедорожник</option><option value="SUPERCAR">Суперкар</option></select></Field>
            <Field label="Город"><select className={inputClass} value={form.city} onChange={e => set('city', e.target.value)}>{['Алматы', 'Астана', 'Шымкент', 'Актобе', 'Атырау'].map(city => <option key={city}>{city}</option>)}</select></Field>
            <Field label="Районы обычных поездок (через запятую)"><input className={inputClass} value={form.districts} onChange={e => set('districts', e.target.value)} placeholder="Медеуский, Бостандыкский" /></Field>
          </div>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-lime-300/10 text-lime-300">03</span><h2 className="text-lg font-semibold">Фотографии и места</h2></div>
          <label className="mb-5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 p-4 text-sm text-zinc-300 hover:border-lime-300/50">
            <ImagePlus className="text-lime-300" size={20} /><span>{files.length ? `Выбрано файлов: ${files.length}` : 'Добавьте 1–8 фотографий автомобиля (JPG, PNG или WebP, до 8 МБ каждая)'}</span>
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple required onChange={e => setFiles(Array.from(e.target.files ?? []).slice(0, 8))} />
          </label>
          <p className="mb-3 text-sm text-zinc-400">Отметьте зоны, которые готовы рассмотреть. Каждую зону ONROAD подтвердит отдельно.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {SLOT_OPTIONS.map(slot => <label key={slot.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 p-3 text-sm"><input type="checkbox" checked={slots.includes(slot.id)} onChange={() => setSlots(current => current.includes(slot.id) ? current.filter(id => id !== slot.id) : [...current, slot.id])} className="accent-lime-300" />{slot.label}</label>)}
          </div>
          <p className="mt-4 text-xs leading-5 text-zinc-500">Тарифы и выплата согласуются до начала конкретной кампании. На этом этапе выбранные зоны и цены являются только заявкой.</p>
        </section>
        <label className="flex items-start gap-3 text-xs leading-5 text-zinc-400"><input className="mt-1 accent-lime-300" type="checkbox" required /><span>Я согласен на обработку данных для рассмотрения заявки и связи со мной, согласно <Link href="/privacy" className="text-lime-300 underline">политике конфиденциальности</Link>.</span></label>
        {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        <button disabled={busy || slots.length === 0 || files.length === 0} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 py-4 font-bold text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
          {busy ? <><Loader2 size={18} className="animate-spin" /> Отправляем…</> : <>Отправить заявку <ArrowRight size={18} /> </>}
        </button>
      </form>
      <p className="mt-8 text-xs text-zinc-600">Уже зарегистрированы? <Link href="/login" className="text-lime-300">Войти</Link></p>
    </div>
  </main>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className={labelClass}>{label}</span>{children}</label>
}
