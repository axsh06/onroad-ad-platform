import { NextResponse } from 'next/server'

// Webhook handling becomes available after a real payment provider is configured.
export async function POST() {
  return NextResponse.json({ error: 'Payment provider is not configured.' }, { status: 503 })
}
