'use client'

import { FormEvent, Suspense, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'

const inputClass = 'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-lime-300/50'
function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    setBusy(false)
    if (result?.error) { setError('Email или пароль не подходят.'); return }
    router.replace(params.get('callbackUrl') || '/dashboard')
  }

  return <main className="grid min-h-screen place-items-center bg-[#080a07] px-5 py-10 text-white">
    <div className="w-full max-w-md">
      <Link href="/index.html" className="mb-8 flex justify-center"><Image src="/onroad-logo.svg" alt="ONROAD" width={170} height={38} /></Link>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-7">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-lime-300">Кабинет ONROAD</p>
        <h1 className="text-2xl font-bold">Войти</h1>
        <label className="block"><span className="mb-2 block text-xs text-zinc-400">Email</span><input className={inputClass} required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label className="block"><span className="mb-2 block text-xs text-zinc-400">Пароль</span><input className={inputClass} required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        {error && <p role="alert" className="rounded-lg bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-lime-300 py-3.5 font-bold text-black disabled:opacity-50">{busy ? <><Loader2 size={17} className="animate-spin" /> Входим…</> : 'Войти'}</button>
      </form>
      <p className="mt-5 text-center text-sm text-zinc-500">Нет аккаунта? <Link href="/register" className="text-lime-300">Зарегистрироваться</Link></p>
    </div>
  </main>
}

export default function LoginPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#080a07] text-zinc-400">Загружаем вход…</main>}><LoginForm /></Suspense>
}
