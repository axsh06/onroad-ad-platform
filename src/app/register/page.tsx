import Image from 'next/image'
import Link from 'next/link'
import { Car, Megaphone } from 'lucide-react'

const roles = [
  { href: '/seller/register', title: 'У меня есть автомобиль', text: 'Предложите машину для проверки и участия в подходящих кампаниях.', icon: Car },
  { href: '/buyer/register', title: 'Я представляю компанию', text: 'Создайте запрос на рекламу и подберите автомобиль под свою задачу.', icon: Megaphone },
]
export default function RegisterPage() {
  return <main className="grid min-h-screen place-items-center bg-[#080a07] px-5 py-12 text-white"><div className="w-full max-w-3xl"><Link href="/index.html" className="mb-10 flex justify-center"><Image src="/onroad-logo.svg" alt="ONROAD" width={190} height={42} /></Link><div className="text-center"><p className="text-xs font-semibold uppercase tracking-[.2em] text-lime-300">Начать работу</p><h1 className="mt-3 text-3xl font-bold">Выберите свою роль</h1><p className="mt-3 text-sm text-zinc-400">В пилотной версии заявки проверяет команда ONROAD.</p></div><div className="mt-8 grid gap-4 sm:grid-cols-2">{roles.map(({ href, title, text, icon: Icon }) => <Link key={href} href={href} className="rounded-2xl border border-white/10 bg-white/[.03] p-6 transition hover:border-lime-300/40 hover:bg-white/[.05]"><Icon className="mb-5 text-lime-300" size={26} /><h2 className="text-xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p><span className="mt-6 inline-block text-sm font-semibold text-lime-200">Продолжить →</span></Link>)}</div><p className="mt-6 text-center text-sm text-zinc-500">Уже есть аккаунт? <Link href="/login" className="text-lime-300">Войти</Link></p></div></main>
}
