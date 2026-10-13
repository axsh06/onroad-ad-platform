// Resize before sending: Vercel functions have a 4.5 MB request limit.
export async function preparePhoto(file: File): Promise<Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Выберите JPG, PNG или WebP.')
  if (!file.size || file.size > 8 * 1024 * 1024) throw new Error('Каждая фотография должна быть не больше 8 МБ.')
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Не удалось обработать фотографию.')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Не удалось обработать фотографию.')), 'image/jpeg', 0.85))
    if (blob.size > 3 * 1024 * 1024) throw new Error('Фотография слишком большая. Выберите изображение меньшего размера.')
    return blob
  } finally {
    bitmap.close()
  }
}
