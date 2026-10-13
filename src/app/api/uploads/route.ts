import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { authOptions } from '@/lib/auth'

const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'SELLER') {
    return NextResponse.json({ error: 'Войдите как владелец автомобиля.' }, { status: 401 })
  }
  try {
    const data = await req.formData()
    const file = data.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'Файл не найден.' }, { status: 400 })
    const ext = TYPES[file.type]
    if (!ext) return NextResponse.json({ error: 'Поддерживаются JPG, PNG и WebP.' }, { status: 415 })
    if (file.size < 1 || file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Размер фотографии должен быть до 8 МБ.' }, { status: 413 })

    const filename = `${randomUUID()}.${ext}`
    const directory = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(directory, { recursive: true })
    await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()), { flag: 'wx' })
    return NextResponse.json({ url: new URL(`/uploads/${filename}`, req.nextUrl.origin).toString() }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/uploads]', error)
    return NextResponse.json({ error: 'Не удалось сохранить фотографию на сервере.' }, { status: 500 })
  }
}
