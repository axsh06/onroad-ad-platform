import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { photoStorageDriver, savePhoto, deletePhoto } from '@/lib/photo-storage'

export const runtime = 'nodejs'
const MAX_BYTES = 3 * 1024 * 1024
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'SELLER') {
    return NextResponse.json({ error: 'Войдите как владелец автомобиля.' }, { status: 401 })
  }
  try {
    if (Number(req.headers.get('content-length') || 0) > MAX_BYTES + 65536) {
      return NextResponse.json({ error: 'Файл слишком большой. Допустимо до 3 МБ после сжатия.' }, { status: 413 })
    }
    const data = await req.formData()
    const file = data.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'Файл не найден.' }, { status: 400 })
    if (!file.size || file.size > MAX_BYTES) return NextResponse.json({ error: 'Допустимо до 3 МБ после сжатия.' }, { status: 413 })
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return NextResponse.json({ error: 'Поддерживаются JPG, PNG и WebP.' }, { status: 415 })
    // Bound unused uploads per account; this also prevents repeated failed submissions filling the bucket.
    const pending = await prisma.mediaAsset.count({ where: { ownerId: session.user.id, carId: null } })
    if (pending >= 40) return NextResponse.json({ error: 'Лимит незавершённых загрузок достигнут. Обратитесь к администратору.' }, { status: 429 })
    let bytes: Buffer
    try {
      const source = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40000000, animated: false })
      const metadata = await source.metadata()
      if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? '')) throw new Error('INVALID_IMAGE')
      // Re-encoding validates image content and removes metadata such as GPS coordinates.
      bytes = await source.rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).flatten({ background: '#fff' }).jpeg({ quality: 85 }).toBuffer()
    } catch {
      return NextResponse.json({ error: 'Не удалось прочитать изображение. Выберите другую фотографию.' }, { status: 415 })
    }
    const id = randomUUID()
    const storageKey = `car-photos/${id}.jpg`
    const driver = photoStorageDriver()
    await savePhoto(storageKey, bytes, driver)
    try {
      await prisma.mediaAsset.create({ data: { id, ownerId: session.user.id, storageKey, storageDriver: driver, sizeBytes: bytes.length } })
    } catch (error) {
      await deletePhoto(storageKey, driver).catch(() => {})
      throw error
    }
    const origin = process.env.NEXTAUTH_URL || req.nextUrl.origin
    return NextResponse.json({ url: new URL(`/api/media/${id}`, origin).toString() }, { status: 201 })
  } catch (error) {
    console.error('[uploads] Failed:', error instanceof Error ? error.name : 'UnknownError')
    return NextResponse.json({ error: 'Не удалось сохранить фотографию. Попробуйте позже.' }, { status: 503 })
  }
}
