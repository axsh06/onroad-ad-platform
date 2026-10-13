'use client'

// src/components/canvas/LogoConfigurator.tsx
// ─────────────────────────────────────────────────────────────────
// Интерактивный конфигуратор: загрузка логотипа → drag-and-drop →
// масштабирование на слот автомобиля. Powered by Fabric.js.
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react'
import * as fabric from 'fabric'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Upload, RotateCcw, Download, ZoomIn, ZoomOut, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Типы ──────────────────────────────────────────────────────

export type SlotType =
  | 'HOOD'
  | 'FRONT_DOORS'
  | 'REAR_DOORS'
  | 'FENDERS'
  | 'REAR_WINDOW_BUMPER'

interface SlotZone {
  id: SlotType
  label: string
  /** Координаты зоны на базовом изображении авто (px, 800×500 canvas) */
  x: number
  y: number
  width: number
  height: number
  clipPath?: fabric.Rect
}

interface LogoConfiguratorProps {
  /** URL изображения авто (боковой вид) */
  carImageUrl: string
  /** Активный слот */
  selectedSlot: SlotType
  /** Callback с JSON-состоянием канваса + PNG dataURL */
  onChange?: (data: { fabricJson: object; previewUrl: string }) => void
  className?: string
}

// ─── Конфигурация зон для каждого слота ───────────────────────

const SLOT_ZONES: Record<SlotType, SlotZone> = {
  HOOD: {
    id: 'HOOD',
    label: 'Капот',
    x: 480, y: 80, width: 160, height: 80,
  },
  FRONT_DOORS: {
    id: 'FRONT_DOORS',
    label: 'Передние двери',
    x: 300, y: 140, width: 160, height: 120,
  },
  REAR_DOORS: {
    id: 'REAR_DOORS',
    label: 'Задние двери',
    x: 145, y: 140, width: 150, height: 120,
  },
  FENDERS: {
    id: 'FENDERS',
    label: 'Крылья',
    x: 80, y: 120, width: 80, height: 90,
  },
  REAR_WINDOW_BUMPER: {
    id: 'REAR_WINDOW_BUMPER',
    label: 'Заднее стекло / Бампер',
    x: 60, y: 95, width: 100, height: 60,
  },
}

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 450

// ─── Компонент ─────────────────────────────────────────────────

export function LogoConfigurator({
  carImageUrl,
  selectedSlot,
  onChange,
  className,
}: LogoConfiguratorProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const logoRef = useRef<fabric.FabricImage | null>(null)
  const zoneRectRef = useRef<fabric.Rect | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [logoOpacity, setLogoOpacity] = useState(90)
  const [hasLogo, setHasLogo] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  // ─ Инициализация Fabric Canvas ─────────────────────────────

  useEffect(() => {
    if (!canvasElRef.current) return

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#f8f8f8',
      preserveObjectStacking: true,
      selection: true,
    })
    fabricRef.current = canvas

    // Загружаем базовое изображение авто
    fabric.FabricImage.fromURL(
      carImageUrl,
      { crossOrigin: 'anonymous' }
    ).then((img) => {
      img.set({
        left: 0,
        top: 0,
        selectable: false,
        evented: false,
        lockMovementX: true,
        lockMovementY: true,
      })
      img.scaleToWidth(CANVAS_WIDTH)
      canvas.backgroundImage = img
      canvas.renderAll()
    })

    // Слушаем изменения для callback
    canvas.on('object:modified', emitChange)
    canvas.on('object:moving', emitChange)
    canvas.on('object:scaling', emitChange)

    return () => {
      canvas.off('object:modified', emitChange)
      canvas.off('object:moving', emitChange)
      canvas.off('object:scaling', emitChange)
      canvas.dispose()
      fabricRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carImageUrl])

  // ─ Отрисовка зоны при смене слота ─────────────────────────

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    // Удаляем старый прямоугольник зоны
    if (zoneRectRef.current) {
      canvas.remove(zoneRectRef.current)
    }

    const zone = SLOT_ZONES[selectedSlot]

    // Рисуем контур активной зоны
    const zoneRect = new fabric.Rect({
      left: zone.x,
      top: zone.y,
      width: zone.width,
      height: zone.height,
      fill: 'rgba(99, 102, 241, 0.08)',
      stroke: '#6366F1',
      strokeWidth: 2,
      strokeDashArray: [6, 3],
      rx: 6,
      ry: 6,
      selectable: false,
      evented: false,
      data: { type: 'zone-indicator' },
    })

    canvas.add(zoneRect)
    // Fabric renders the canvas background below regular objects. Keep this
    // outline above the photo and below any logo added afterward.

    zoneRectRef.current = zoneRect
    canvas.renderAll()
  }, [selectedSlot])

  // ─ Emit изменений ──────────────────────────────────────────

  const emitChange = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas || !onChange) return

    const fabricJson = canvas.toJSON()
    const previewUrl = canvas.toDataURL({ format: 'png', multiplier: 1 })
    onChange({ fabricJson, previewUrl })
  }, [onChange])

  // ─ Загрузка логотипа ───────────────────────────────────────

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !fabricRef.current) return

      const allowedTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        alert('Поддерживаются форматы: PNG, SVG, JPG, WebP')
        return
      }

      setIsLoading(true)
      setFileName(file.name)

      const reader = new FileReader()
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string
        const canvas = fabricRef.current!
        const zone = SLOT_ZONES[selectedSlot]

        // Удаляем предыдущий логотип
        if (logoRef.current) {
          canvas.remove(logoRef.current)
          logoRef.current = null
        }

        const img = await fabric.FabricImage.fromURL(dataUrl)

        // Масштабируем логотип по ширине зоны (с отступом 10%)
        const maxW = zone.width * 0.8
        const maxH = zone.height * 0.8
        const scaleX = maxW / img.width!
        const scaleY = maxH / img.height!
        const scale = Math.min(scaleX, scaleY)

        img.set({
          left: zone.x + (zone.width - img.width! * scale) / 2,
          top: zone.y + (zone.height - img.height! * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          opacity: logoOpacity / 100,
          cornerColor: '#6366F1',
          cornerSize: 10,
          transparentCorners: false,
          borderColor: '#6366F1',
          data: { type: 'logo' },
        })

        // Ограничиваем перемещение зоной слота
        img.on('moving', () => {
          const obj = img
          const left = obj.left!
          const top = obj.top!
          const w = obj.getScaledWidth()
          const h = obj.getScaledHeight()

          obj.set({
            left: Math.max(zone.x, Math.min(zone.x + zone.width - w, left)),
            top: Math.max(zone.y, Math.min(zone.y + zone.height - h, top)),
          })
        })

        canvas.add(img)
        canvas.setActiveObject(img)
        canvas.renderAll()

        logoRef.current = img
        setHasLogo(true)
        setIsLoading(false)
        emitChange()
      }

      reader.readAsDataURL(file)
      // Сброс input для повторной загрузки того же файла
      e.target.value = ''
    },
    [selectedSlot, logoOpacity, emitChange]
  )

  // ─ Изменение прозрачности ──────────────────────────────────

  const handleOpacityChange = useCallback(
    (value: number[]) => {
      const opacity = value[0]
      setLogoOpacity(opacity)
      if (logoRef.current && fabricRef.current) {
        logoRef.current.set('opacity', opacity / 100)
        fabricRef.current.renderAll()
        emitChange()
      }
    },
    [emitChange]
  )

  // ─ Сброс ───────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    if (logoRef.current) {
      canvas.remove(logoRef.current)
      logoRef.current = null
    }
    setHasLogo(false)
    setFileName(null)
    setLogoOpacity(90)
    canvas.renderAll()
  }, [])

  // ─ Удаление выделенного объекта ───────────────────────────

  const handleDeleteSelected = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (active) {
      canvas.remove(active)
      if (logoRef.current === active) {
        logoRef.current = null
        setHasLogo(false)
        setFileName(null)
      }
      canvas.renderAll()
      emitChange()
    }
  }, [emitChange])

  // ─ Скачать превью ─────────────────────────────────────────

  const handleDownloadPreview = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 })
    const link = document.createElement('a')
    link.download = `brandmycar-mockup-${selectedSlot.toLowerCase()}.png`
    link.href = dataUrl
    link.click()
  }, [selectedSlot])

  // ─ Zoom ───────────────────────────────────────────────────

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    const canvas = fabricRef.current
    const obj = canvas?.getActiveObject()
    if (!obj || !canvas) return
    const factor = direction === 'in' ? 1.1 : 0.9
    obj.scale((obj.scaleX ?? 1) * factor)
    canvas.renderAll()
    emitChange()
  }, [emitChange])

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Upload button */}
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".png,.svg,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button variant="outline" size="sm" asChild>
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {hasLogo ? 'Заменить логотип' : 'Загрузить логотип'}
            </span>
          </Button>
        </label>

        {/* Slot badge */}
        <Badge variant="secondary" className="font-normal">
          Зона: {SLOT_ZONES[selectedSlot].label}
        </Badge>

        {fileName && (
          <span className="text-xs text-muted-foreground truncate max-w-[160px]">
            {fileName}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleZoom('in')}
            disabled={!hasLogo}
            title="Увеличить"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleZoom('out')}
            disabled={!hasLogo}
            title="Уменьшить"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteSelected}
            disabled={!hasLogo}
            title="Удалить выбранный объект"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            disabled={!hasLogo}
            title="Сбросить"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPreview}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Скачать
          </Button>
        </div>
      </div>

      {/* Canvas container */}
      <div className="relative rounded-xl overflow-hidden border border-border shadow-sm bg-gray-50">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-lime-300 border-t-transparent" />
              <span className="text-sm text-muted-foreground">Загрузка…</span>
            </div>
          </div>
        )}
        <canvas
          ref={canvasElRef}
          className="block max-w-full"
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Opacity slider */}
      {hasLogo && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-32 shrink-0">
            Прозрачность: {logoOpacity}%
          </span>
          <Slider
            min={10}
            max={100}
            step={1}
            value={[logoOpacity]}
            onValueChange={handleOpacityChange}
            className="flex-1"
          />
        </div>
      )}

      {/* Hint */}
      {!hasLogo && (
        <p className="text-center text-sm text-muted-foreground">
          Загрузите PNG или SVG логотип — он появится в выделенной зоне.
          <br />
          Перетаскивайте и масштабируйте прямо на авто.
        </p>
      )}
    </div>
  )
}

export default LogoConfigurator
