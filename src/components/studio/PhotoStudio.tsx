"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/platform/Locale";
import { SLOT_NAMES } from "@/lib/slots";
import PhotoDecalEditor, { type PhotoPreset } from "./PhotoDecalEditor";

type PhotoView = "side" | "front" | "rear" | "custom";
const VIEWS: { id: Exclude<PhotoView, "custom">; label: [string, string, string]; zone: [string, string, string]; preset: PhotoPreset }[] = [
  { id: "side", label: ["Сбоку", "Бүйірінен", "Side view"], zone: ["Боковая дверь", "Бүйір есік", "Side door"], preset: {
    center: { x: 0.55, y: 0.625 }, width: 0.17,
    polygon: [{ x: 0.405, y: 0.515 }, { x: 0.665, y: 0.52 }, { x: 0.68, y: 0.59 }, { x: 0.675, y: 0.735 }, { x: 0.445, y: 0.72 }, { x: 0.414, y: 0.685 }],
  } },
  { id: "front", label: ["Спереди", "Алдынан", "Front view"], zone: ["Капот", "Капот", "Hood"], preset: {
    center: { x: 0.5, y: 0.475 }, width: 0.27,
    polygon: [{ x: 0.235, y: 0.375 }, { x: 0.77, y: 0.375 }, { x: 0.69, y: 0.58 }, { x: 0.3, y: 0.58 }],
  } },
  { id: "rear", label: ["Сзади", "Артынан", "Rear view"], zone: ["Заднее стекло", "Артқы әйнек", "Rear window"], preset: {
    center: { x: 0.5, y: 0.218 }, width: 0.24,
    polygon: [{ x: 0.30, y: 0.15 }, { x: 0.70, y: 0.15 }, { x: 0.69, y: 0.285 }, { x: 0.31, y: 0.285 }],
  } },
];

export default function PhotoStudio() {
  const { t } = useLocale();
  const [view, setView] = useState<PhotoView>("side");
  const [opened, setOpened] = useState<PhotoView[]>(["side"]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const [customZone, setCustomZone] = useState("LEFT_DOOR");
  const [error, setError] = useState("");
  function choose(next: PhotoView) {
    setView(next);
    setOpened(previous => previous.includes(next) ? previous : [...previous, next]);
  }
  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    setCustomUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  return <div className="photo-studio-layout">
    <aside className="photo-studio-sidebar">
      <div className="decal-step-heading"><span>01 / {t("ВЫБЕРИТЕ РАКУРС", "КӨРІНІСТІ ТАҢДАҢЫЗ", "CHOOSE YOUR VIEW")}</span><span className="decal-pill">2D</span></div>
      <h2>Porsche 911<span>{t("Ваш дизайн. В деталях.", "Сіздің дизайн. Егжей-тегжейлі.", "Your design. In detail.")}</span></h2>
      <p className="photo-studio-description">{t("Три фотографии, три поверхности для вашего бренда. Выберите ракурс и добавьте наклейку.", "Үш фото, брендіңізге арналған үш бет. Көріністі таңдап, жапсырма қосыңыз.", "Three photographs, three surfaces for your brand. Choose a view and add your decal.")}</p>
      <div className="photo-view-options">
        {VIEWS.map((item, index) => <button type="button" key={item.id} aria-pressed={view === item.id} onClick={() => choose(item.id)}>
          <span className="photo-view-thumb"><img src={`/photos/porsche-studio/${item.id}.png`} alt="" /></span>
          <span><strong>{t(...item.label)}</strong><small>{t(...item.zone)}</small></span><span className="photo-view-number">0{index + 1}</span>
        </button>)}
      </div>
      <p className="decal-note">{t("Для каждой фотографии — свой макет. Переключение ракурса сохраняет ваши наклейки до закрытия страницы.", "Әр фотоның өз макеті бар. Көріністі ауыстырғанда жапсырмалар бет жабылғанша сақталады.", "Each photo has its own design. Switching views keeps your decals until you leave this page.")}</p>
      <div className="photo-custom-upload">
        <label className="outline-button">{t("Загрузить своё фото", "Өз фотоңызды жүктеу", "Upload your own photo")}
          <input type="file" accept="image/jpeg,image/png,image/webp" aria-label={t("Загрузить своё фото", "Өз фотоңызды жүктеу", "Upload your own photo")} onChange={event => {
            const file = event.target.files?.[0]; event.target.value = "";
            if (!file) return;
            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) { setError(t("Выберите JPG, PNG или WebP до 8 МБ.", "8 МБ дейінгі JPG, PNG немесе WebP таңдаңыз.", "Choose JPG, PNG or WebP up to 8 MB.")); return; }
            setError(""); setPhoto(file); choose("custom");
          }} />
        </label>
        {photo && <button className="photo-custom-choice" aria-pressed={view === "custom"} onClick={() => choose("custom")}>{t("Моя фотография", "Менің фотом", "My photograph")}<small>{photo.name}</small></button>}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {view === "custom" && <label className="photo-custom-zone">{t("Зона размещения", "Орналастыру аймағы", "Placement")}<select value={customZone} onChange={e => setCustomZone(e.target.value)}>{["LEFT_DOOR", "RIGHT_DOOR", "HOOD", "REAR_WINDOW", "REAR_BODY"].map(key => <option key={key} value={key}>{t(...SLOT_NAMES[key])}</option>)}</select></label>}
      {view === "rear" && <p className="decal-note">{t("Размещение на стекле согласуется отдельно с учётом обзорности.", "Әйнекке орналастыру көрінуді ескере отырып бөлек келісіледі.", "Window placement is agreed separately with visibility in mind.")}</p>}
      <Link className="decal-budget-link" href="/planner">{t("Рассчитать бюджет кампании", "Кампания бюджетін есептеу", "Estimate your campaign")}</Link>
    </aside>
    <section className="photo-studio-workspace">
      {VIEWS.filter(item => opened.includes(item.id)).map(item => <div key={item.id} hidden={view !== item.id}>
        <PhotoDecalEditor image={`/photos/porsche-studio/${item.id}.png`} name={item.id} zone={t(...item.zone)} preset={item.preset} />
      </div>)}
      {customUrl && <div hidden={view !== "custom"}><PhotoDecalEditor key={customUrl} image={customUrl} name="custom" zone={t(...SLOT_NAMES[customZone])} /></div>}
      <p className="decal-privacy">{t("PNG, JPG, WebP и SVG до 8 МБ. Для наклеек без фона используйте прозрачный PNG или WebP. Файлы обрабатываются в браузере; скачайте макеты перед закрытием страницы.", "8 МБ дейінгі PNG, JPG, WebP және SVG. Фонсыз жапсырма үшін мөлдір PNG немесе WebP қолданыңыз. Файлдар браузерде өңделеді; бетті жаппас бұрын макеттерді жүктеңіз.", "PNG, JPG, WebP and SVG up to 8 MB. Use transparent PNG or WebP for cutout decals. Files are processed in your browser; download your designs before leaving.")}</p>
      <p className="decal-credit">{t("Фотографии подготовлены для визуальной примерки: фон удалён, чёткость улучшена. Размеры, материал и монтаж согласуются отдельно.", "Фотолар визуалды сынауға дайындалған: фон алынып, анықтық жақсартылған. Өлшемдер, материал және орнату бөлек келісіледі.", "Photos are retouched previews with backgrounds removed and clarity enhanced. Physical dimensions, materials and installation are agreed separately.")}</p>
    </section>
  </div>;
}
