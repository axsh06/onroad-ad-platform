import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readPhoto } from '@/lib/photo-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[a-f0-9-]{36}$/.test(id)) return new NextResponse(null, { status: 404 })
  try {
    const asset = await prisma.mediaAsset.findUnique({ where: { id }, include: { car: { select: { status: true } } } })
    if (!asset) return new NextResponse(null, { status: 404 })
    if (asset.car?.status !== 'APPROVED') {
      const session = await getServerSession(authOptions)
      if (session?.user?.id !== asset.ownerId && session?.user?.role !== 'ADMIN') return new NextResponse(null, { status: 404 })
    }
    const bytes = await readPhoto(asset.storageKey, asset.storageDriver)
    return new NextResponse(new Uint8Array(bytes), { headers: {
      'Content-Type': 'image/jpeg', 'Content-Length': String(bytes.byteLength),
      'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store',
    } })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}
