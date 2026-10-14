"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/platform/Locale";
import { SLOT_NAMES } from "@/lib/slots";
import { PorscheEditor, PORSCHE_ZONES, type PorscheZone, type Sticker } from "@/lib/porsche-studio";

async function readSticker(file: Blob): Promise<{ image: string; aspect: number }> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) throw Error("FORMAT");
  const bitmap = await createImageBitmap(file);
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width > 8192 || bitmap.height > 8192) throw Error("DIMENSIONS");
    const scale = Math.min(1, 1536 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw Error("IMAGE");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return { image: canvas.toDataURL("image/png"), aspect: bitmap.width / bitmap.height };
  } finally { bitmap.close(); }
}

export default function PorscheStudio() {
  const { t } = useLocale();
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<PorscheEditor | null>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [zone, setZone] = useState<PorscheZone>("LEFT_DOOR");
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const current = useRef<Sticker[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [showZones, setShowZones] = useState(true);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [download, setDownload] = useState("");
  const [history, setHistory] = useState<{ past: Sticker[][]; future: Sticker[][] }>({ past: [], future: [] });
  const adjustment = useRef<Sticker[] | null>(null);
  const live = useRef(true);
  const pendingImage = useRef(false);
  const activeSticker = stickers.find(s => s.id === selected);

  const assign = (next: Sticker[]) => { current.current = next; setStickers(next); };
  const commit = (next: Sticker[]) => {
    const before = adjustment.current || current.current;
    adjustment.current = null;
    setHistory(h => ({ past: [...h.past, before].slice(-30), future: [] }));
    assign(next);
    setNotice("");
  };
  const chooseZone = (next: PorscheZone) => {
    setZone(next);
    setSelected(current.current.filter(s => s.zone === next).at(-1)?.id || null);
    setMoving(false);
    setNotice("");
    engine.current?.focus(next);
  };
  const chooseSticker = (id: string) => {
    const sticker = current.current.find(s => s.id === id);
    if (!sticker) return;
    setSelected(id);
    setZone(sticker.zone);
    setMoving(false);
    engine.current?.focus(sticker.zone);
  };
  // Stable renderer callbacks always use the current React state and locale.
  const handlers = useRef({ chooseZone, chooseSticker, commit, t });
  handlers.current = { chooseZone, chooseSticker, commit, t };
  useEffect(() => {
    live.current = true;
    if (!host.current) return;
    setReady(false);
    setFailed(false);
    setProgress(0);
    try {
      engine.current = new PorscheEditor(host.current, {
        ready: () => { setReady(true); setFailed(false); },
        progress: setProgress,
        error: () => { setFailed(true); setReady(false); },
        zone: key => handlers.current.chooseZone(key),
        select: id => handlers.current.chooseSticker(id),
        move: (id, point) => handlers.current.commit(current.current.map(s => s.id === id ? { ...s, ...point } : s)),
        outside: () => setNotice(handlers.current.t(
          "Нажмите на выбранную дверь, капот или стекло. Наклейка должна оставаться в этой зоне.",
          "Таңдалған есікке, капотқа немесе әйнекке басыңыз. Жапсырма осы аймақта қалуы керек.",
          "Click the selected panel. Keep the decal inside this placement area.",
        )),
      });
    } catch { setFailed(true); }
    return () => { live.current = false; engine.current?.dispose(); engine.current = null; };
  }, [attempt]);
  useEffect(() => {
    engine.current?.setState({ stickers, selected, zone, moving: moving && !!activeSticker, showZones });
    engine.current?.setLabels(Object.fromEntries(PORSCHE_ZONES.map(key => [key, t(...SLOT_NAMES[key])])) as Record<PorscheZone, string>);
  }, [stickers, selected, zone, moving, showZones, ready, activeSticker, t]);
  useEffect(() => () => { if (download) URL.revokeObjectURL(download); }, [download]);

  async function addSticker(file: Blob, name: string) {
    if (!ready || pendingImage.current) return;
    if (current.current.length >= 12) { setError(t("В одном макете можно разместить до 12 наклеек.", "Бір макетте 12 жапсырмаға дейін болады.", "A design can contain up to 12 decals.")); return; }
    const targetZone = zone;
    const anchor = engine.current?.anchor(targetZone);
    if (!anchor) return;
    pendingImage.current = true;
    setBusy(true);
    setError("");
    try {
      const asset = await readSticker(file);
      if (!live.current) return;
      const sticker: Sticker = { ...anchor, ...asset, id: crypto.randomUUID(), zone: targetZone, name, size: 75, angle: 0, opacity: 100 };
      commit([...current.current, sticker]);
      setSelected(sticker.id);
      setZone(targetZone);
      setMoving(true);
      engine.current?.focus(targetZone);
    } catch {
      if (live.current) setError(t("Не удалось открыть изображение. Используйте PNG, JPG или WebP до 8 МБ и 8192 × 8192 px.", "Сурет ашылмады. 8 МБ және 8192 × 8192 px дейінгі PNG, JPG немесе WebP қолданыңыз.", "Could not open this image. Use PNG, JPG or WebP up to 8 MB and 8192 × 8192 px."));
    } finally { pendingImage.current = false; if (live.current) setBusy(false); }
  }
  async function sample() {
    setError("");
    try {
      const response = await fetch("/brand/onroad-light.png");
      if (!response.ok) throw Error("LOGO");
      await addSticker(await response.blob(), "ONROAD");
    } catch { setError(t("Логотип не загрузился. Попробуйте ещё раз.", "Логотип жүктелмеді. Қайта көріңіз.", "Logo could not load. Try again.")); }
  }
  function adjust(field: "size" | "angle" | "opacity", value: number) {
    if (!selected) return;
    adjustment.current ||= current.current;
    assign(current.current.map(s => s.id === selected ? { ...s, [field]: value } : s));
  }
  function finishAdjustment() {
    if (!adjustment.current) return;
    const before = adjustment.current;
    adjustment.current = null;
    if (before !== current.current) setHistory(h => ({ past: [...h.past, before].slice(-30), future: [] }));
  }
  function undo() {
    const previous = history.past.at(-1);
    if (!previous) return;
    const before = current.current;
    setHistory(h => ({ past: h.past.slice(0, -1), future: [before, ...h.future] }));
    assign(previous);
    setSelected(null);
    setMoving(false);
  }
  function redo() {
    const next = history.future[0];
    if (!next) return;
    const before = current.current;
    setHistory(h => ({ past: [...h.past, before], future: h.future.slice(1) }));
    assign(next);
    setSelected(null);
    setMoving(false);
  }
  function remove(id: string) {
    commit(current.current.filter(s => s.id !== id));
    if (id === selected) { setSelected(null); setMoving(false); }
  }
  async function exportPNG() {
    if (!engine.current || !ready) return;
    setExporting(true);
    setError("");
    try {
      const blob = await engine.current.exportPNG();
      if (!live.current) return;
      const url = URL.createObjectURL(blob);
      setDownload(url);
      const link = document.createElement("a");
      link.href = url;
      link.download = "onroad-porsche-911-design.png";
      link.click();
    } catch { if (live.current) setError(t("Не удалось сохранить макет. Попробуйте ещё раз.", "Макет сақталмады. Қайта көріңіз.", "Could not export the design. Please try again.")); }
    finally { if (live.current) setExporting(false); }
  }

  return (
    <div className="decal-studio">
      <aside className="decal-sidebar">
        <div className="decal-step-heading"><span>01 / {t("АВТОМОБИЛЬ", "АВТОМОБИЛЬ", "VEHICLE")}</span><span className="decal-pill">360°</span></div>
        <h2>Porsche 911 <span>Carrera 4S</span></h2>
        <p className="decal-intro">{t("Выберите поверхность. Добавьте свой дизайн. Посмотрите со всех сторон.", "Бетті таңдаңыз. Дизайныңызды қосыңыз. Барлық жағынан қараңыз.", "Choose a surface. Add your design. See every angle.")}</p>
        <div className="decal-step-heading">02 / {t("ЗОНА РАЗМЕЩЕНИЯ", "ОРНАЛАСТЫРУ АЙМАҒЫ", "PLACEMENT")}</div>
        <div className="decal-zone-grid">
          {PORSCHE_ZONES.map((key, i) => <button key={key} type="button" aria-pressed={zone === key} onClick={() => chooseZone(key)}>
            <span>0{i + 1}</span><strong>{t(...SLOT_NAMES[key])}</strong>
            <small>{stickers.filter(s => s.zone === key).length || "—"}</small>
          </button>)}
        </div>
        {zone === "REAR_WINDOW" && <p className="decal-note">{t("Макет на стекле — для отдельного согласования обзорности и безопасности.", "Әйнектегі макет көріну мен қауіпсіздік бойынша бөлек келісіледі.", "Window placement requires a separate visibility and safety review.")}</p>}
        <div className="decal-step-heading">03 / {t("ВАША НАКЛЕЙКА", "СІЗДІҢ ЖАПСЫРМАҢЫЗ", "YOUR DECAL")}</div>
        <label className={`decal-upload ${!ready || busy ? "is-disabled" : ""}`}>
          <span>＋</span><strong>{busy ? t("Обработка…", "Өңделуде…", "Processing…") : t("Загрузить наклейку", "Жапсырма жүктеу", "Upload a decal")}</strong>
          <small>PNG · JPG · WebP / {t("до 8 МБ", "8 МБ дейін", "up to 8 MB")}</small>
          <input type="file" accept="image/png,image/jpeg,image/webp" disabled={!ready || busy} aria-label={t("Загрузить наклейку", "Жапсырма жүктеу", "Upload a decal")} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void addSticker(file, file.name); }} />
        </label>
        <button type="button" className="outline-button decal-example" disabled={!ready || busy} onClick={() => void sample()}>{t("Попробовать логотип ONROAD", "ONROAD логотипін сынау", "Try the ONROAD logo")}</button>
        <p className="decal-note">{t("Для наклейки без фона используйте прозрачный PNG или WebP. Можно добавить несколько изображений в каждую зону.", "Фонсыз жапсырма үшін мөлдір PNG немесе WebP қолданыңыз. Әр аймаққа бірнеше сурет қосуға болады.", "Use transparent PNG or WebP for a cutout decal. Add multiple images to each placement.")}</p>
        <Link className="decal-budget-link" href="/planner">{t("Перейти к расчёту бюджета", "Бюджетті есептеуге өту", "Estimate your campaign")}</Link>
      </aside>

      <section className="decal-workspace">
        <div className="decal-toolbar">
          <div className="decal-mode-switch">
            <button type="button" aria-pressed={!moving} onClick={() => setMoving(false)}>{t("Обзор 360°", "360° көрініс", "360° view")}</button>
            <button type="button" aria-pressed={moving} disabled={!activeSticker} onClick={() => { setMoving(true); engine.current?.focus(zone); }}>{t("Переместить наклейку", "Жапсырманы жылжыту", "Move decal")}</button>
          </div>
          <div className="decal-toolbar-actions">
            <button type="button" disabled={!history.past.length || !ready} onClick={undo} title={t("Отменить", "Болдырмау", "Undo")} aria-label={t("Отменить", "Болдырмау", "Undo")}>↶</button>
            <button type="button" disabled={!history.future.length || !ready} onClick={redo} title={t("Повторить", "Қайталау", "Redo")} aria-label={t("Повторить", "Қайталау", "Redo")}>↷</button>
            <button className="solid-button" type="button" onClick={() => void exportPNG()} disabled={!ready || exporting}>{exporting ? t("Сохраняем…", "Сақталуда…", "Exporting…") : t("Скачать PNG", "PNG жүктеу", "Download PNG")}</button>
          </div>
        </div>
        <div className="decal-canvas-wrap">
          <div ref={host} className="decal-canvas" />
          <div className="decal-canvas-heading"><span>PORSCHE 911 CARRERA 4S</span><strong>{t(...SLOT_NAMES[zone])}</strong></div>
          <div className="decal-view-tools">
            <button type="button" disabled={!ready} onClick={() => engine.current?.zoom(1)} aria-label={t("Приблизить", "Жақындату", "Zoom in")}>＋</button>
            <button type="button" disabled={!ready} onClick={() => engine.current?.zoom(-1)} aria-label={t("Отдалить", "Алыстату", "Zoom out")}>−</button>
            <button type="button" disabled={!ready} onClick={() => engine.current?.focus(zone)} aria-label={t("Вернуть ракурс зоны", "Аймақ көрінісін қайтару", "Reset placement view")}>↺</button>
          </div>
          {!ready && <div className="decal-loading" role="status">
            {failed ? <><strong>{t("3D-просмотр не загрузился", "3D көрінісі жүктелмеді", "3D viewer could not load")}</strong><p>{t("Попробуйте ещё раз или откройте вкладку «На фотографии».", "Қайта көріңіз немесе «Фотосуретте» қойындысын ашыңыз.", "Try again or open the Photo preview tab.")}</p><button className="outline-button" onClick={() => setAttempt(n => n + 1)}>{t("Повторить загрузку", "Қайта жүктеу", "Try again")}</button></> : <><span className="decal-loading-icon">911</span><strong>{progress >= 95 ? t("Подготавливаем поверхности…", "Беттер дайындалуда…", "Preparing surfaces…") : t("Загружаем Porsche…", "Porsche жүктелуде…", "Loading your Porsche…")}</strong><progress value={progress} max="100" /><small>{progress}% · {t("Первое открытие может занять немного времени", "Алғашқы жүктеу біраз уақыт алады", "The first load may take a moment")}</small></>}
          </div>}
          <div className="decal-canvas-footer"><span>ONROAD / DESIGN STUDIO</span><button type="button" disabled={!ready} aria-pressed={showZones} onClick={() => setShowZones(v => !v)}>{showZones ? t("Скрыть зоны", "Аймақтарды жасыру", "Hide zones") : t("Показать зоны", "Аймақтарды көрсету", "Show zones")}</button></div>
        </div>
        <p className="decal-interaction-hint">{moving && activeSticker ? t("Нажмите на поверхность или перетащите наклейку в пределах выбранной зоны. Для вращения машины включите «Обзор 360°».", "Таңдалған аймақ бетіне басыңыз немесе жапсырманы сүйреңіз. Көлікті айналдыру үшін «360° көрінісін» қосыңыз.", "Click or drag on the selected panel to move your decal. Switch to 360° view to rotate the car.") : t("Перетаскивайте, чтобы вращать автомобиль. Колёсико или два пальца — масштаб. Выберите наклейку в списке для редактирования.", "Көлікті айналдыру үшін сүйреңіз. Масштабты дөңгелекпен немесе екі саусақпен өзгертіңіз. Өңдеу үшін тізімнен жапсырманы таңдаңыз.", "Drag to orbit. Scroll or pinch to zoom. Select a decal from the list to edit it.")}</p>
        {(error || notice) && <p className={error ? "form-error" : "decal-notice"} role={error ? "alert" : "status"}>{error || notice}</p>}
        {download && <a className="decal-download" href={download} download="onroad-porsche-911-design.png">{t("PNG готов — нажмите, если скачивание не началось", "PNG дайын — жүктеу басталмаса, басыңыз", "PNG ready — click here if the download did not start")}</a>}

        <div className="decal-editing-row">
          <div className="decal-layer-panel">
            <div className="decal-step-heading">{t("НАКЛЕЙКИ В МАКЕТЕ", "МАКЕТТЕГІ ЖАПСЫРМАЛАР", "DECALS IN YOUR DESIGN")} <span>{stickers.length.toString().padStart(2, "0")} / 12</span></div>
            {!stickers.length ? <div className="decal-empty"><span>＋</span><p>{t("Ваш первый дизайн начинается с одной наклейки.", "Алғашқы дизайн бір жапсырмадан басталады.", "Your first design starts with one decal.")}</p></div> : <div className="decal-layer-list">{stickers.map(sticker => <div key={sticker.id} className={selected === sticker.id ? "is-selected" : ""}>
              <button type="button" aria-pressed={selected === sticker.id} onClick={() => chooseSticker(sticker.id)}><img src={sticker.image} alt="" /><span><strong>{sticker.name}</strong><small>{t(...SLOT_NAMES[sticker.zone])}</small></span></button>
              <button type="button" className="decal-remove" onClick={() => remove(sticker.id)} aria-label={`${t("Удалить", "Жою", "Remove")} ${sticker.name}`}>×</button>
            </div>)}</div>}
          </div>
          <div className="decal-adjustments">
            <div className="decal-step-heading">{t("НАСТРОЙКА НАКЛЕЙКИ", "ЖАПСЫРМАНЫ БАПТАУ", "DECAL SETTINGS")}</div>
            {activeSticker ? <>
              {([ ["size", t("Размер", "Өлшем", "Size"), 15, 100, "%"], ["angle", t("Поворот", "Бұрылу", "Rotation"), -180, 180, "°"], ["opacity", t("Непрозрачность", "Мөлдір еместік", "Opacity"), 20, 100, "%"] ] as const).map(([key, label, min, max, unit]) => <label key={key}><span>{label}<output>{activeSticker[key]}{unit}</output></span><input type="range" min={min} max={max} step="1" value={activeSticker[key]} onChange={e => adjust(key, Number(e.target.value))} onPointerUp={finishAdjustment} onKeyUp={finishAdjustment} onBlur={finishAdjustment} /></label>)}
              <button type="button" className="text-button" onClick={() => { const anchor = engine.current?.anchor(activeSticker.zone); if (anchor) commit(current.current.map(s => s.id === selected ? { ...s, ...anchor, size: 75, angle: 0, opacity: 100 } : s)); }}>{t("Вернуть в центр зоны", "Аймақ ортасына қайтару", "Center and reset decal")}</button>
            </> : <p className="decal-note">{t("Выберите наклейку, чтобы настроить её размер, угол и прозрачность.", "Өлшемін, бұрышын және мөлдірлігін баптау үшін жапсырманы таңдаңыз.", "Select a decal to adjust its size, rotation and opacity.")}</p>}
          </div>
        </div>
        <p className="decal-privacy">{t("Изображения остаются в вашем браузере. Скачайте PNG перед закрытием страницы. Примерка визуальная; размеры, материал и монтаж согласуются отдельно.", "Суреттер браузеріңізде қалады. Бетті жаппас бұрын PNG жүктеңіз. Бұл визуалды сынау; өлшемдер, материал және орнату бөлек келісіледі.", "Images stay in your browser. Download your PNG before closing this page. This is a visual mockup; dimensions, materials and installation are agreed separately.")}</p>
        <p className="decal-credit"><a href="https://sketchfab.com/3d-models/free-porsche-911-carrera-4s-d01b254483794de3819786d93e0e1ebf" target="_blank" rel="noreferrer">Porsche 911 Carrera 4S · Karol Miklas</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>. {t("Макеты включают эту 3D-модель; сохраняйте указание автора и лицензии при публикации.", "Макеттерде осы 3D модель бар; жариялағанда автор мен лицензияны көрсетіңіз.", "Exports include this model; retain its attribution and license when sharing.")}</p>
      </section>
    </div>
  );
}
