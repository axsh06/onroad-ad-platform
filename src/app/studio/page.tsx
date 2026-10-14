"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Header, Footer } from "@/components/platform/Shell";
import { useLocale } from "@/components/platform/Locale";
import "./studio.css";

const PorscheStudio = dynamic(() => import("@/components/studio/PorscheStudio"), {
  ssr: false,
  loading: () => <div className="studio-module-loading">ONROAD / 3D STUDIO…</div>,
});
const PhotoStudio = dynamic(() => import("@/components/studio/PhotoStudio"), { ssr: false });

export default function StudioPage() {
  const { t } = useLocale();
  const [mode, setMode] = useState<"3d" | "photo">("3d");
  const [photoOpened, setPhotoOpened] = useState(false);
  return (
    <div className="platform light-site">
      <Header />
      <main className="section-wrap studio-page">
        <p className="eyebrow">ONROAD / DESIGN STUDIO</p>
        <div className="section-title">
          <h1>{t("Ваш бренд.\nВ новом измерении.", "Сіздің бренд.\nЖаңа өлшемде.", "Your brand.\nA new dimension.")}</h1>
          <p>{t("Примерьте наклейки на Porsche 911: выберите зону, загрузите дизайн и рассмотрите его в 3D. Без регистрации.", "Porsche 911 көлігіне жапсырманы сынаңыз: аймақты таңдаңыз, дизайн жүктеп, 3D көрінісін қараңыз. Тіркелусіз.", "Try your decals on a Porsche 911. Choose a surface, upload your artwork and explore it in 3D. No account needed.")}</p>
        </div>
        <div className="studio-view-tabs" aria-label={t("Режим примерки", "Сынау режимі", "Preview mode")}>
          <button type="button" aria-pressed={mode === "3d"} onClick={() => setMode("3d")}>3D / Porsche 911</button>
          <button type="button" aria-pressed={mode === "photo"} onClick={() => { setMode("photo"); setPhotoOpened(true); }}>{t("На фотографии", "Фотосуретте", "Photo preview")}</button>
        </div>
        <div hidden={mode !== "3d"}><PorscheStudio /></div>
        {photoOpened && <div hidden={mode !== "photo"}><PhotoStudio /></div>}
      </main>
      <Footer />
    </div>
  );
}
