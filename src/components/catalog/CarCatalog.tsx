'use client'

// src/components/catalog/CarCatalog.tsx
// ─────────────────────────────────────────────────────────────────
// Каталог авто для рекламодателей с фильтрами
// ─────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { MapPin, Users, Star, Search, SlidersHorizontal } from 'lucide-react'

// ─── Типы ─────────────────────────────────────────────────────

type CarClass = 'SPORT' | 'PREMIUM' | 'LUXURY' | 'SUV' | 'SUPERCAR'
type SlotType = 'HOOD' | 'FRONT_DOORS' | 'REAR_DOORS' | 'FENDERS' | 'REAR_WINDOW_BUMPER'

interface AdSlot {
  id: string
  slotType: SlotType
  label: string
  priceWeekly: number
  priceMonthly: number
  isAvailable: boolean
}

interface CarListing {
  id: string
  make: string
  model: string
  year: number
  class: CarClass
  color: string
  city: string
  districts: string[]
  photoUrls: string[]
  monthlyReach: number
  weeklyKm: number
  adSlots: AdSlot[]
  owner: { name: string; avatarUrl?: string }
}

// ─── Конфигурация ─────────────────────────────────────────────

const CAR_CLASS_LABELS: Record<CarClass, string> = {
  SPORT: '🏎 Спорт',
  PREMIUM: '⭐ Премиум',
  LUXURY: '💎 Люкс',
  SUV: '🚙 Внедорожник',
  SUPERCAR: '🚀 Суперкар',
}

const SLOT_LABELS: Record<SlotType, string> = {
  HOOD: 'Капот',
  FRONT_DOORS: 'Пер. двери',
  REAR_DOORS: 'Зад. двери',
  FENDERS: 'Крылья',
  REAR_WINDOW_BUMPER: 'Стекло/Бампер',
}

const CITIES = ['Алматы', 'Астана', 'Шымкент', 'Актобе', 'Атырау']

function formatKZT(amount: number) {
  return new Intl.NumberFormat('ru-KZ', {
    style: 'currency', currency: 'KZT', maximumFractionDigits: 0
  }).format(amount)
}

function formatReach(reach: number) {
  return reach >= 1000 ? `${(reach / 1000).toFixed(0)}K` : String(reach)
}

// ─── Карточка авто ────────────────────────────────────────────

function CarCard({ car }: { car: CarListing }) {
  const router = useRouter()
  const availableSlots = car.adSlots.filter(s => s.isAvailable)
  const minWeeklyPrice = Math.min(...availableSlots.map(s => s.priceWeekly))

  return (
    <Card
      className="catalog-vehicle-card group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-border/60"
      onClick={() => router.push(`/catalog/${car.id}`)}
    >
      {/* Фото */}
      <div className="relative aspect-[16/9] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {car.photoUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={car.photoUrls[0]}
            alt={`${car.make} ${car.model}`}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-4xl">🚗</div>
        )}
        {/* Класс авто */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-black/70 text-white border-0 backdrop-blur-sm text-xs">
            {CAR_CLASS_LABELS[car.class]}
          </Badge>
        </div>
        {/* Доступных слотов */}
        <div className="absolute top-3 right-3">
          <Badge variant={availableSlots.length > 0 ? 'default' : 'secondary'} className="text-xs">
            {availableSlots.length} слот{availableSlots.length !== 1 ? 'ов' : ''} свободно
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Название */}
        <div>
          <h3 className="font-bold text-lg leading-tight">
            {car.make} {car.model}
          </h3>
          <p className="text-sm text-muted-foreground">{car.year} · {car.color}</p>
        </div>

        {/* Статистика */}
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {car.city}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {formatReach(car.monthlyReach)}/мес
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Star className="h-3.5 w-3.5" />
            {car.weeklyKm} км/нед
          </span>
        </div>

        {/* Слоты */}
        <div className="flex flex-wrap gap-1">
          {car.adSlots.map(slot => (
            <span
              key={slot.id}
              className={`text-xs px-2 py-0.5 rounded-full border ${
                slot.isAvailable
                  ? 'border-lime-200 bg-lime-50 text-lime-400'
                  : 'border-gray-200 bg-gray-50 text-gray-400 line-through'
              }`}
            >
              {SLOT_LABELS[slot.slotType]}
            </span>
          ))}
        </div>

        {/* Цена + CTA */}
        <div className="flex items-center justify-between pt-1">
          <div>
            {availableSlots.length > 0 ? (
              <>
                <span className="text-xs text-muted-foreground">от </span>
                <span className="font-bold text-lime-300">{formatKZT(minWeeklyPrice)}</span>
                <span className="text-xs text-muted-foreground">/нед</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Все слоты заняты</span>
            )}
          </div>
          <Button
            size="sm"
            disabled={availableSlots.length === 0}
            onClick={e => { e.stopPropagation(); router.push(`/catalog/${car.id}`) }}
            className="bg-lime-300 hover:bg-lime-400"
          >
            Разместить
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Фильтры ──────────────────────────────────────────────────

interface Filters {
  city: string
  carClass: string
  slot: string
  search: string
}

// ─── Главный компонент каталога ───────────────────────────────

export function CarCatalog() {
  const [cars, setCars] = useState<CarListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Filters>({
    city: '', carClass: '', slot: '', search: ''
  })

  const fetchCars = useCallback(async (f: Filters, p: number) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '12' })
      if (f.city) params.set('city', f.city)
      if (f.carClass) params.set('class', f.carClass)
      if (f.slot) params.set('slot', f.slot)

      const res = await fetch(`/api/cars?${params}`)
      if (res.ok) {
        const data = await res.json()
        // Клиентский поиск по марке/модели
        const filtered = f.search
          ? data.cars.filter((c: CarListing) =>
              `${c.make} ${c.model}`.toLowerCase().includes(f.search.toLowerCase())
            )
          : data.cars
        setCars(filtered)
        setTotal(data.pagination.total)
      }
    } catch (e) {
      console.error('Failed to fetch cars:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCars(filters, page)
  }, [filters, page, fetchCars])

  function handleFilterChange(key: keyof Filters, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const unfilteredEmpty = total === 0 && !Object.values(filters).some(Boolean)

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="catalog-intro">
        <div>
          <span className="catalog-eyebrow"><i /> ПОДБОР МАШИН ДЛЯ КАМПАНИИ</span>
          <h1>Автомобили<br /><em>в движении.</em></h1>
          <p>Выберите город, класс машины и зону размещения. Условия кампании согласуем до запуска.</p>
        </div>
        <div className="catalog-intro-note">
          <span>ONROAD / 01</span>
          <strong>Пять зон<br />для вашего бренда</strong>
          <Link href="/campaign.html">Рассчитать кампанию <span aria-hidden="true">↗</span></Link>
        </div>
      </div>

      {/* Фильтры */}
      <div className="catalog-filters flex flex-wrap gap-3 p-4">
        <div className="flex items-center gap-2 catalog-filter-label">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Подбор</span>
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск марки / модели…"
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Select value={filters.city || 'all'} onValueChange={v => handleFilterChange('city', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Город" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все города</SelectItem>
            {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.carClass || 'all'} onValueChange={v => handleFilterChange('carClass', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Класс авто" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все классы</SelectItem>
            {Object.entries(CAR_CLASS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.slot || 'all'} onValueChange={v => handleFilterChange('slot', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[170px] h-9">
            <SelectValue placeholder="Слот" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все слоты</SelectItem>
            {Object.entries(SLOT_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Счётчик */}
      {!isLoading && (
        <div className="catalog-count"><span>В каталоге</span><strong>{total}</strong><span>автомобилей</span></div>
      )}

      {/* Грид */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : cars.length === 0 ? (
        <div className={`catalog-empty ${unfilteredEmpty ? 'catalog-empty-first' : ''}`}>
          {unfilteredEmpty && <div className="catalog-empty-image">
            <Image src="/hero-silver.jpg" alt="Пример автомобиля для размещения рекламы" fill priority sizes="(max-width: 760px) 100vw, 50vw" />
            <span>ПРИМЕР ФОРМАТА · НЕ АКТИВНОЕ ОБЪЯВЛЕНИЕ</span>
          </div>}
          <div className="catalog-empty-copy">
            <span className="catalog-eyebrow"><i /> {unfilteredEmpty ? 'КАТАЛОГ НАПОЛНЯЕТСЯ' : 'ПО ВАШЕМУ ЗАПРОСУ'}</span>
            <h3>{unfilteredEmpty ? 'Первые автомобили скоро появятся.' : 'Подходящих автомобилей пока нет.'}</h3>
            <p>{unfilteredEmpty ? 'Каждая машина появится в каталоге после проверки заявки. Пока можно предложить свой автомобиль или рассчитать примерный бюджет размещения.' : 'Попробуйте изменить город, класс автомобиля или зону размещения.'}</p>
            {unfilteredEmpty ? <div className="catalog-empty-actions"><Link href="/seller/register" className="catalog-action-primary">Предложить автомобиль <span aria-hidden="true">↗</span></Link><Link href="/campaign.html" className="catalog-action-secondary">Рассчитать кампанию <span aria-hidden="true">↗</span></Link></div> : <button className="catalog-action-secondary" onClick={() => setFilters({ city: '', carClass: '', slot: '', search: '' })}>Сбросить фильтры</button>}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map(car => <CarCard key={car.id} car={car} />)}
          </div>

          {/* Пагинация */}
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              ← Назад
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Страница {page} из {Math.ceil(total / 12)}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / 12) || isLoading}
            >
              Вперёд →
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default CarCatalog
