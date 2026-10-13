import Link from 'next/link'
import Image from 'next/image'
import { CarCatalog } from '@/components/catalog/CarCatalog'

export default function CatalogPage() {
  return <main className="min-h-screen bg-[#080a07] px-5 py-6 text-white sm:px-8">
    <header className="mx-auto mb-8 flex max-w-7xl items-center justify-between border-b border-white/10 pb-5">
      <Link href="/index.html"><Image src="/onroad-logo.svg" alt="ONROAD" width={170} height={38} /></Link>
      <nav className="flex items-center gap-5 text-sm text-zinc-400"><Link href="/campaign.html" className="hover:text-white">Калькулятор</Link><Link href="/dashboard" className="hover:text-white">Кабинет</Link><Link href="/seller/register" className="rounded-lg bg-lime-300 px-4 py-2 font-semibold text-black">Добавить авто</Link></nav>
    </header>
    <div className="mx-auto max-w-7xl"><CarCatalog /></div>
  </main>
}
