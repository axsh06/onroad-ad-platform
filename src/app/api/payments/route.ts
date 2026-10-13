// src/app/api/payments/route.ts
// ─────────────────────────────────────────────────────────────────
// POST /api/payments — инициация оплаты (Kaspi Pay / Card)
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'

// Payment providers are not configured. Never create a fake payment record or QR.
export async function POST() {
  return NextResponse.json(
    { error: 'Online payments are not configured. Submit a campaign request for manual follow-up.' },
    { status: 503 },
  )
}
