'use client'

// src/components/dashboard/SellerDashboard.tsx
// ─────────────────────────────────────────────────────────────────
// Дашборд продавца: доходы, активные кампании, история выплат
// ─────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp, Wallet, Clock, CheckCircle2, Car, BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Типы ─────────────────────────────────────────────────────

interface BookingSummary {
  id: string
  status: string
  duration: 'ONE_WEEK' | 'ONE_MONTH'
  startDate: string
  endDate: string
  sellerAmount: number
  totalAmount: number
  slot: { label: string; slotType: string }
  campaign?: { brandName: string; logoUrl?: string }
  car: { make: string; model: string }
}

interface SellerStats {
  totalEarnings: number
  pendingPayout: number
  completedPayout: number
  activeBookings: number
  completedBookings: number
}

// ─── Статусные бейджи ─────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING:   { label: 'На рассмотрении', variant: 'secondary' },
  CONFIRMED: { label: 'Оплачено',       variant: 'outline' },
  APPROVED:  { label: 'Макет OK',       variant: 'default' },
  ACTIVE:    { label: 'Активно',        variant: 'default' },
  COMPLETED: { label: 'Завершено',      variant: 'secondary' },
  CANCELLED: { label: 'Отменено',       variant: 'destructive' },
}

// ─── Метрика-карточка ─────────────────────────────────────────

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  className?: string
}) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Форматирование ───────────────────────────────────────────

function formatKZT(amount: number) {
  return new Intl.NumberFormat('ru-KZ', {
    style: 'currency',
    currency: 'KZT',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Главный компонент ────────────────────────────────────────

export function SellerDashboard() {
  const [stats, setStats] = useState<SellerStats | null>(null)
  const [bookings, setBookings] = useState<BookingSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [statsRes, bookingsRes] = await Promise.all([
          fetch('/api/seller/stats'),
          fetch('/api/bookings?limit=20'),
        ])
        if (statsRes.ok) setStats(await statsRes.json())
        if (bookingsRes.ok) {
          const data = await bookingsRes.json()
          setBookings((data.bookings ?? []).map((booking: BookingSummary & { slot: BookingSummary['slot'] & { car: BookingSummary['car'] } }) => ({ ...booking, car: booking.slot.car })))
        }
      } catch (e) {
        console.error('Failed to fetch seller data:', e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const activeBookings = bookings.filter(b => ['PENDING', 'CONFIRMED', 'APPROVED', 'ACTIVE'].includes(b.status))
  const historyBookings = bookings.filter(b => ['COMPLETED', 'CANCELLED'].includes(b.status))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-lime-300 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Мой дашборд</h1>
        <p className="text-muted-foreground">Управление вашими рекламными размещениями</p>
      </div>

      {/* Метрики */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Общий доход"
          value={formatKZT(stats?.totalEarnings ?? 0)}
          subtitle="За всё время"
          icon={TrendingUp}
          className="border-lime-100"
        />
        <MetricCard
          title="К выплате"
          value={formatKZT(stats?.pendingPayout ?? 0)}
          subtitle="Ожидает перевода"
          icon={Wallet}
        />
        <MetricCard
          title="Активные кампании"
          value={String(stats?.activeBookings ?? 0)}
          icon={BarChart3}
        />
        <MetricCard
          title="Завершено"
          value={String(stats?.completedBookings ?? 0)}
          icon={CheckCircle2}
        />
      </div>

      {/* Табы */}
      <div className="flex gap-1 border-b">
        {(['active', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab
                ? 'border-lime-300 text-lime-300'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === 'active' ? `Активные (${activeBookings.length})` : `История (${historyBookings.length})`}
          </button>
        ))}
      </div>

      {/* Список бронирований */}
      <div className="space-y-3">
        {(activeTab === 'active' ? activeBookings : historyBookings).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Car className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">
                {activeTab === 'active' ? 'Нет активных кампаний' : 'История пуста'}
              </p>
            </CardContent>
          </Card>
        ) : (
          (activeTab === 'active' ? activeBookings : historyBookings).map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Карточка бронирования ───────────────────────────────────

function BookingCard({ booking }: { booking: BookingSummary }) {
  const statusCfg = STATUS_CONFIG[booking.status] ?? { label: booking.status, variant: 'secondary' as const }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="flex items-start gap-4 pt-4">
        {/* Логотип бренда */}
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
          {booking.campaign?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={booking.campaign.logoUrl} alt={booking.campaign.brandName} className="object-contain w-full h-full p-1" />
          ) : (
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Детали */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold truncate">
              {booking.campaign?.brandName ?? 'Без названия'}
            </span>
            <Badge variant={statusCfg.variant} className="text-xs">
              {statusCfg.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {booking.car.make} {booking.car.model} · {booking.slot.label}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(booking.startDate)} — {formatDate(booking.endDate)}
            </span>
            <span>
              {booking.duration === 'ONE_WEEK' ? '1 неделя' : '1 месяц'}
            </span>
          </div>
        </div>

        {/* Сумма */}
        <div className="text-right shrink-0">
          <div className="font-bold text-lime-300">{formatKZT(booking.sellerAmount)}</div>
          <div className="text-xs text-muted-foreground">предварительная оценка</div>
          <div className="text-xs text-muted-foreground">из {formatKZT(booking.totalAmount)}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SellerDashboard
