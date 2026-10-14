// src/lib/commission.ts
// ─────────────────────────────────────────────────────────────────
// Расчёт комиссии платформы и выплаты продавцу
// ─────────────────────────────────────────────────────────────────

export const COMMISSION_CONFIG = {
  /** Доля платформы (40%) */
  PLATFORM_RATE: 0.4,
  /** Доля продавца (60%) */
  SELLER_RATE: 0.6,
  /** Минимальная сумма бронирования (KZT) */
  MIN_BOOKING_AMOUNT: 5000,
} as const;

export interface CommissionBreakdown {
  totalAmount: number;
  sellerAmount: number;
  platformFee: number;
  platformRate: number;
  sellerRate: number;
}

/**
 * Рассчитывает разбивку комиссии для бронирования.
 * @param totalAmount — полная стоимость размещения в KZT
 * @param platformRate — переопределение ставки платформы (опционально)
 */
export function calculateCommission(
  totalAmount: number,
  platformRate: number = COMMISSION_CONFIG.PLATFORM_RATE,
): CommissionBreakdown {
  if (totalAmount <= 0) throw new Error("totalAmount must be positive");
  if (platformRate < 0 || platformRate > 1)
    throw new Error("platformRate must be between 0 and 1");

  const sellerRate = 1 - platformRate;
  const platformFee = Math.round(totalAmount * platformRate * 100) / 100;
  const sellerAmount = Math.round((totalAmount - platformFee) * 100) / 100;

  return {
    totalAmount,
    sellerAmount,
    platformFee,
    platformRate,
    sellerRate,
  };
}

/**
 * Возвращает цену слота в зависимости от длительности.
 */
export function getSlotPrice(
  priceWeekly: number,
  priceMonthly: number,
  duration: "ONE_WEEK" | "ONE_MONTH",
): number {
  return duration === "ONE_WEEK" ? priceWeekly : priceMonthly;
}

/**
 * Рассчитывает дату окончания кампании.
 */
export function calculateEndDate(
  startDate: Date,
  duration: "ONE_WEEK" | "ONE_MONTH",
): Date {
  const end = new Date(startDate);
  if (duration === "ONE_WEEK") {
    end.setUTCDate(end.getUTCDate() + 7);
  } else {
    // A calendar month ends on the same day, or the target month's last day.
    const day = end.getUTCDate();
    end.setUTCDate(1);
    end.setUTCMonth(end.getUTCMonth() + 1);
    const lastDay = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0),
    ).getUTCDate();
    end.setUTCDate(Math.min(day, lastDay));
  }
  return end;
}
