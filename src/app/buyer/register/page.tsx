'use client'

import { FormEvent, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { ArrowRight, Loader2 } from 'lucide-react'

const inputClass = 'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-lime-300/50'

export default function BuyerRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', companyName: '', email: '', password: '', phone: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'BUYER', consent: true }),
      })
      if (!response.ok && response.status !== 409) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Не удалось создать аккаунт.')
      }
      const login = await signIn('credentials', { email: form.email, password: form.password, redirect: false })
      if (login?.error) throw new Error('Аккаунт создан. Теперь войдите с указанным email и паролем.')
      router.push('/catalog')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выполнить запрос.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="min-h-screen bg-[#080a07] px-5 py-10 text-white">
    <div className="mx-auto max-w-md">
      <Link href="/index.html" className="mb-8 flex justify-center"><Image src="/onroad-logo.svg" alt="ONROAD" width={170} height={38} /></Link>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-lime-300">Для компаний</p>
        <h1 className="text-2xl font-bold">Создать аккаунт</h1>
        <p className="mb-6 mt-2 text-sm text-zinc-400">Отправляйте запросы и подбирайте автомобили для рекламных кампаний.</p>
        <form className="space-y-4" onSubmit={submit}>
          <Field label="Имя контактного лица"><input className={inputClass} required minLength={2} autoComplete="name" value={form.name} onChange={e => set('name', e.target.value)} /></Field>
          <Field label="Компания"><input className={inputClass} required value={form.companyName} onChange={e => set('companyName', e.target.value)} /></Field>
          <Field label="Телефон"><input className={inputClass} required type="tel" autoComplete="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+7 …" /></Field>
          <Field label="Email"><input className={inputClass} required type="email" autoComplete="email" value={form.email} onChange={e => set('email', e.target.value)} /></Field>
          <Field label="Пароль (от 8 символов)"><input className={inputClass} required type="password" minLength={8} autoComplete="new-password" value={form.password} onChange={e => set('password', e.target.value)} /></Field>
          <label className="flex items-start gap-3 text-xs leading-5 text-zinc-400"><input type="checkbox" required className="mt-1 accent-lime-300" /><span>Согласен на обработку данных для создания аккаунта и связи со мной. <Link href="/privacy" className="text-lime-300 underline">Политика конфиденциальности</Link>.</span></label>
          {error && <p role="alert" className="rounded-lg bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-lime-300 py-3.5 font-bold text-black disabled:opacity-50">{busy ? <><Loader2 size={17} className="animate-spin" /> Создаём…</> : <>Создать аккаунт <ArrowRight size={17} /></>}</button>
        </form>
      </div>
      <p className="mt-5 text-center text-sm text-zinc-500">Уже есть аккаунт? <Link href="/login" className="text-lime-300">Войти</Link></p>
      <Link href="/register" className="mt-3 block text-center text-xs text-zinc-600">← Выбрать другую роль</Link>
    </div>
  </main>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</span>{children}</label> }
