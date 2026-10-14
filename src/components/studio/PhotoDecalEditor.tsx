"use client";

import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { useLocale } from "@/components/platform/Locale";

type Point = { x: number; y: number };
export type PhotoPreset = {
  center: Point;
  width: number;
  polygon: Point[];
};
type Layer = { id: string; name: string; image: fabric.FabricImage };
type Props = { image: string; name: string; zone: string; preset?: PhotoPreset };

function keepCenterInPanel(image: fabric.FabricImage, points: Point[], center: Point) {
  const point = image.getCenterPoint();
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i], b = points[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  if (inside) return;
  let distance = Infinity;
  let closest = center;
  points.forEach((a, index) => {
    const b = points[(index + 1) % points.length];
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)));
    const next = { x: a.x + t * dx, y: a.y + t * dy };
    const d = Math.hypot(next.x - point.x, next.y - point.y);
    if (d < distance) { distance = d; closest = next; }
  });
  image.set({ left: closest.x * 0.98 + center.x * 0.02, top: closest.y * 0.98 + center.y * 0.02 });
}

export default function PhotoDecalEditor({ image, name, zone, preset }: Props) {
  const { t } = useLocale();
  const node = useRef<HTMLCanvasElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const layersRef = useRef<Layer[]>([]);
  const selectedRef = useRef<fabric.FabricImage | null>(null);
  const guideRef = useRef<fabric.Polygon | null>(null);
  const placement = useRef<{ center: Point; width: number; polygon: Point[] }>({ center: { x: 400, y: 280 }, width: 140, polygon: [] });
  const pending = useRef(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [settings, setSettings] = useState({ size: 140, angle: 0, opacity: 100 });
  const [showGuide, setShowGuide] = useState(true);
  const [error, setError] = useState("");
  const [download, setDownload] = useState("");
  const [retry, setRetry] = useState(0);
  const locale = useRef(t);
  locale.current = t;

  function syncSelection(object?: fabric.FabricObject) {
    const layer = layersRef.current.find(item => item.image === object);
    selectedRef.current = layer?.image || null;
    setSelected(layer?.id || null);
    if (layer) setSettings({ size: Math.round(layer.image.getScaledWidth()), angle: Math.round(layer.image.angle), opacity: Math.round(layer.image.opacity * 100) });
  }

  useEffect(() => {
    if (!node.current || !holder.current) return;
    let alive = true;
    setReady(false);
    setError("");
    setLayers([]);
    setSelected(null);
    setDownload("");
    layersRef.current = [];
    selectedRef.current = null;
    guideRef.current = null;
    const canvas = new fabric.Canvas(node.current, {
      width: 800, height: 500, backgroundColor: "#eef0ea", preserveObjectStacking: true, selection: false,
    });
    canvasRef.current = canvas;
    const resize = () => {
      const width = Math.max(1, holder.current?.clientWidth || 800);
      canvas.setDimensions({ width: `${width}px`, height: `${width * 500 / 800}px` }, { cssOnly: true });
      canvas.calcOffset();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(holder.current);
    resize();
    fabric.FabricImage.fromURL(image, { crossOrigin: "anonymous" }).then(background => {
      if (!alive) { background.dispose(); return; }
      const scale = Math.min((preset ? 720 : 800) / background.width, (preset ? 430 : 500) / background.height);
      const w = background.width * scale, h = background.height * scale;
      const left = (800 - w) / 2, top = (500 - h) / 2;
      background.set({ originX: "left", originY: "top", left, top, scaleX: scale, scaleY: scale, selectable: false, evented: false });
      canvas.backgroundImage = background;
      placement.current = preset ? {
        center: { x: left + preset.center.x * w, y: top + preset.center.y * h },
        width: preset.width * w,
        polygon: preset.polygon.map(p => ({ x: left + p.x * w, y: top + p.y * h })),
      } : { center: { x: 400, y: 280 }, width: 140, polygon: [] };
      if (preset) {
        const guide = new fabric.Polygon(placement.current.polygon, {
          fill: "rgba(166,190,139,0.12)", stroke: "#718960", strokeWidth: 1,
          strokeDashArray: [5, 5], selectable: false, evented: false, excludeFromExport: true,
        });
        guideRef.current = guide;
        canvas.add(guide);
      }
      canvas.requestRenderAll();
      setReady(true);
    }).catch(() => {
      if (alive) setError(locale.current("Фото не загрузилось. Повторите загрузку.", "Фото жүктелмеді. Қайта жүктеңіз.", "Photo could not load. Please retry."));
    });
    canvas.on("selection:created", () => syncSelection(canvas.getActiveObject()));
    canvas.on("selection:updated", () => syncSelection(canvas.getActiveObject()));
    canvas.on("selection:cleared", () => syncSelection());
    canvas.on("object:moving", ({ target }) => {
      if (target instanceof fabric.FabricImage && placement.current.polygon.length) keepCenterInPanel(target, placement.current.polygon, placement.current.center);
    });
    canvas.on("object:modified", ({ target }) => syncSelection(target));
    return () => {
      alive = false;
      observer.disconnect();
      if (canvasRef.current === canvas) canvasRef.current = null;
      void canvas.dispose();
    };
  }, [image, preset, retry]);
  useEffect(() => { if (guideRef.current) { guideRef.current.visible = showGuide; canvasRef.current?.requestRenderAll(); } }, [showGuide, ready]);
  useEffect(() => () => { if (download) URL.revokeObjectURL(download); }, [download]);

  async function add(source: string, label: string) {
    const canvas = canvasRef.current;
    if (!canvas || !ready || pending.current) return;
    if (layersRef.current.length >= 12) { setError(t("Можно добавить до 12 наклеек на один ракурс.", "Бір көрініске 12 жапсырмаға дейін қосуға болады.", "Add up to 12 decals per view.")); return; }
    pending.current = true;
    setBusy(true);
    setError("");
    let loaded: fabric.FabricImage | undefined;
    try {
      loaded = await fabric.FabricImage.fromURL(source, { crossOrigin: "anonymous" });
      if (!loaded.width || !loaded.height || loaded.width > 8192 || loaded.height > 8192) throw Error("DIMENSIONS");
      const bitmap = document.createElement("canvas");
      const ratio = Math.min(1, 1536 / Math.max(loaded.width, loaded.height));
      bitmap.width = Math.max(1, Math.round(loaded.width * ratio));
      bitmap.height = Math.max(1, Math.round(loaded.height * ratio));
      const context = bitmap.getContext("2d");
      if (!context) throw Error("CANVAS");
      context.drawImage(loaded.getElement(), 0, 0, bitmap.width, bitmap.height);
      const sticker = await fabric.FabricImage.fromURL(bitmap.toDataURL("image/png"));
      if (canvasRef.current !== canvas) { sticker.dispose(); return; }
      const area = placement.current;
      let width = area.width;
      if (area.polygon.length) {
        const height = Math.max(...area.polygon.map(p => p.y)) - Math.min(...area.polygon.map(p => p.y));
        width = Math.min(width, height * 0.72 * sticker.width / sticker.height);
        sticker.clipPath = new fabric.Polygon(area.polygon, { absolutePositioned: true, fill: "#000", strokeWidth: 0 });
      }
      sticker.scaleToWidth(width);
      sticker.set({ originX: "center", originY: "center", left: area.center.x, top: area.center.y, opacity: 1,
        cornerColor: "#263323", borderColor: "#263323", cornerSize: 8, touchCornerSize: 28, transparentCorners: false, lockScalingFlip: true });
      const layer = { id: crypto.randomUUID(), name: label, image: sticker };
      layersRef.current = [...layersRef.current, layer];
      setLayers(layersRef.current);
      canvas.add(sticker);
      canvas.setActiveObject(sticker);
      syncSelection(sticker);
      canvas.requestRenderAll();
    } catch {
      if (canvasRef.current === canvas) setError(t("Изображение не открылось. Попробуйте PNG, JPG, WebP или простой SVG до 8 МБ и 8192 px.", "Сурет ашылмады. 8 МБ және 8192 px дейінгі PNG, JPG, WebP немесе қарапайым SVG қолданыңыз.", "Could not open this image. Try PNG, JPG, WebP or a simple SVG up to 8 MB and 8192 px."));
    } finally {
      loaded?.dispose();
      pending.current = false;
      if (canvasRef.current === canvas) setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setError(t("Выберите PNG, JPG, WebP или SVG до 8 МБ.", "8 МБ дейінгі PNG, JPG, WebP немесе SVG таңдаңыз.", "Choose PNG, JPG, WebP or SVG up to 8 MB.")); return;
    }
    if (file.type === "image/svg+xml") {
      const svg = await file.text();
      if (/<script|<foreignObject|<!DOCTYPE|<!ENTITY|\bon\w+\s*=|(?:href|src)\s*=\s*["']\s*(?!#)|url\(\s*["']?\s*(?!#)/i.test(svg)) {
        setError(t("Используйте SVG без скриптов и внешних изображений либо сохраните его в PNG.", "Скриптсіз және сыртқы суретсіз SVG қолданыңыз немесе PNG ретінде сақтаңыз.", "Use an SVG without scripts or external images, or save it as PNG.")); return;
      }
    }
    const url = URL.createObjectURL(file);
    try { await add(url, file.name); } finally { URL.revokeObjectURL(url); }
  }
  function change(key: "size" | "angle" | "opacity", value: number) {
    const sticker = selectedRef.current;
    if (!sticker) return;
    if (key === "size") sticker.scaleToWidth(value);
    else sticker.set(key, key === "opacity" ? value / 100 : value);
    sticker.setCoords();
    setSettings(s => ({ ...s, [key]: value }));
    canvasRef.current?.requestRenderAll();
  }
  function remove(id: string) {
    const layer = layersRef.current.find(item => item.id === id);
    if (!layer) return;
    if (selected === id) canvasRef.current?.discardActiveObject();
    canvasRef.current?.remove(layer.image);
    layer.image.dispose();
    layersRef.current = layersRef.current.filter(item => item.id !== id);
    setLayers(layersRef.current);
    canvasRef.current?.requestRenderAll();
  }
  function save() {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    setError("");
    canvas.discardActiveObject();
    canvas.renderAll();
    try {
      canvas.toCanvasElement(2, { filter: object => object !== guideRef.current }).toBlob(blob => {
        if (canvasRef.current !== canvas) return;
        if (!blob) { setError(t("Не удалось создать PNG.", "PNG жасалмады.", "Could not create PNG.")); return; }
        const url = URL.createObjectURL(blob);
        setDownload(url);
        const link = document.createElement("a");
        link.href = url;
        link.download = `onroad-porsche-${name}.png`;
        link.click();
      }, "image/png");
    } catch { setError(t("Не удалось сохранить макет. Попробуйте ещё раз.", "Макет сақталмады. Қайта көріңіз.", "Could not export. Please try again.")); }
  }

  return <div className="photo-decal-editor">
    <div className="photo-editor-toolbar">
      <label className={`outline-button ${!ready || busy ? "is-disabled" : ""}`}>
        {t("Загрузить наклейку", "Жапсырма жүктеу", "Upload decal")}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={!ready || busy} aria-label={t("Загрузить наклейку", "Жапсырма жүктеу", "Upload decal")} onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; void upload(file); }} />
      </label>
      <button className="outline-button" disabled={!ready || busy} onClick={() => void add(name === "rear" ? "/brand/onroad-light.png" : "/onroad-logo-dark.svg", "ONROAD")}>{t("Пример ONROAD", "ONROAD үлгісі", "Try ONROAD")}</button>
      <button className="solid-button" disabled={!ready || busy} onClick={save}>{t("Скачать PNG", "PNG жүктеу", "Download PNG")}</button>
    </div>
    <div className="photo-editor-heading"><span>ONROAD / 2D STUDIO</span><span>{zone}</span></div>
    <div className="photo-editor-frame">
      <div className="photo-editor-canvas" ref={holder} aria-label={t("2D-редактор наклеек", "2D жапсырма редакторы", "2D decal editor")}><canvas ref={node} /></div>
      {!ready && <div className="photo-editor-loading" role="status">{error || t("Подготавливаем фотографию…", "Фото дайындалуда…", "Preparing your photo…")}{error && <button className="outline-button" onClick={() => setRetry(n => n + 1)}>{t("Повторить", "Қайталау", "Retry")}</button>}</div>}
      {preset && ready && <button className="photo-guide-toggle" aria-pressed={showGuide} onClick={() => setShowGuide(value => !value)}>{showGuide ? t("Скрыть зону", "Аймақты жасыру", "Hide placement") : t("Показать зону", "Аймақты көрсету", "Show placement")}</button>}
    </div>
    <p className="photo-editor-hint">{preset ? t("Наклейка остаётся в границах выбранной поверхности. Перетаскивайте её и меняйте размер за угловые маркеры.", "Жапсырма таңдалған беттің шекарасында қалады. Оны жылжытып, бұрыштық белгілермен өлшемін өзгертіңіз.", "Decals stay within the selected surface. Drag to position and use corner handles to resize.") : t("Перетаскивайте наклейку мышью или пальцем. Угловые маркеры меняют размер.", "Жапсырманы тышқанмен немесе саусақпен жылжытыңыз. Бұрыштарымен өлшемін өзгертіңіз.", "Drag with a mouse or finger. Use corner handles to resize.")}</p>
    {busy && <p role="status" className="fine-print">{t("Обрабатываем изображение…", "Сурет өңделуде…", "Processing image…")}</p>}
    {ready && error && <p role="alert" className="form-error">{error}</p>}
    {download && <a className="decal-download" href={download} download={`onroad-porsche-${name}.png`}>{t("PNG готов — скачать макет", "PNG дайын — макетті жүктеу", "PNG ready — download design")}</a>}
    <div className="photo-editor-bottom">
      <div className="decal-layer-panel">
        <div className="decal-step-heading">{t("НАКЛЕЙКИ", "ЖАПСЫРМАЛАР", "DECALS")}<span>{layers.length} / 12</span></div>
        {layers.length ? <div className="decal-layer-list">{layers.map(layer => <div key={layer.id} className={selected === layer.id ? "is-selected" : ""}>
          <button aria-pressed={selected === layer.id} onClick={() => { canvasRef.current?.setActiveObject(layer.image); syncSelection(layer.image); canvasRef.current?.requestRenderAll(); }}><span><strong>{layer.name}</strong><small>{zone}</small></span></button>
          <button className="decal-remove" aria-label={`${t("Удалить", "Жою", "Remove")} ${layer.name}`} onClick={() => remove(layer.id)}>×</button>
        </div>)}</div> : <p className="decal-note">{t("Загрузите свой дизайн или попробуйте логотип ONROAD.", "Дизайныңызды жүктеңіз немесе ONROAD логотипін сынаңыз.", "Upload your artwork or try the ONROAD logo.")}</p>}
      </div>
      <div className="decal-adjustments">
        <div className="decal-step-heading">{t("НАСТРОЙКА НАКЛЕЙКИ", "ЖАПСЫРМАНЫ БАПТАУ", "DECAL SETTINGS")}</div>
        {selected ? <>
          {([["size", t("Размер", "Өлшем", "Size"), 15, 600, "px"], ["angle", t("Поворот", "Бұрылу", "Rotation"), -180, 180, "°"], ["opacity", t("Непрозрачность", "Мөлдір еместік", "Opacity"), 10, 100, "%"]] as const).map(([key, label, min, max, unit]) => <label key={key}><span>{label}<output>{settings[key]}{unit}</output></span><input type="range" min={min} max={Math.max(max, settings[key])} value={settings[key]} onChange={e => change(key, Number(e.target.value))} /></label>)}
          <button className="text-button" onClick={() => { const object = selectedRef.current; if (object) { object.set({ left: placement.current.center.x, top: placement.current.center.y }); object.setCoords(); canvasRef.current?.requestRenderAll(); } }}>{t("В центр зоны", "Аймақ ортасына", "Center in placement")}</button>
        </> : <p className="decal-note">{t("Выберите наклейку на фото или в списке.", "Фотодағы немесе тізімдегі жапсырманы таңдаңыз.", "Select a decal on the photo or in the list.")}</p>}
      </div>
    </div>
  </div>;
}
