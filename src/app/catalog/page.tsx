import Link from 'next/link'
import Image from 'next/image'
import { CarCatalog } from '@/components/catalog/CarCatalog'

export default function CatalogPage() {
  return <main className="catalog-page min-h-screen px-5 py-6 text-white sm:px-8">
    <header className="catalog-page-header mx-auto mb-9 flex max-w-7xl items-center justify-between">
      <Link href="/index.html" aria-label="ONROAD — главная"><Image src="/onroad-logo.svg" alt="ONROAD" width={170} height={38} /></Link>
      <nav aria-label="Основная навигация" className="flex items-center gap-5 text-sm text-zinc-300"><Link href="/campaign.html">Калькулятор</Link><Link href="/dashboard">Кабинет</Link><Link href="/seller/register" className="catalog-header-cta">Добавить автомобиль <span aria-hidden="true">↗</span></Link></nav>
    </header>
    <div className="mx-auto max-w-7xl"><CarCatalog /></div>
  </main>
}
