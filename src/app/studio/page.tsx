"use client";
import { useEffect, useState } from "react";
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
  const [threeOpened, setThreeOpened] = useState(false);
  useEffect(() => {
    const syncMode = () => {
      if (window.location.hash === "#photo") { setMode("photo"); setPhotoOpened(true); }
      else { setMode("3d"); setThreeOpened(true); }
    };
    syncMode();
    window.addEventListener("hashchange", syncMode);
    return () => window.removeEventListener("hashchange", syncMode);
  }, []);
  function selectMode(next: "3d" | "photo") {
    setMode(next);
    if (next === "photo") setPhotoOpened(true);
    else setThreeOpened(true);
    window.history.replaceState(null, "", `#${next}`);
  }
  return (
    <div className="platform light-site">
      <Header />
      <main className="section-wrap studio-page">
        <p className="eyebrow">ONROAD / DESIGN STUDIO</p>
        <div className="section-title">
          <h1>{t("Ваш бренд.\nВ новом измерении.", "Сіздің бренд.\nЖаңа өлшемде.", "Your brand.\nA new dimension.")}</h1>
          <p>{t("Примерьте свой дизайн на Porsche 911: на фотографиях или в 3D. Выберите поверхность, добавьте наклейку и сохраните макет. Без регистрации.", "Porsche 911 көлігіне дизайныңызды фотода немесе 3D көрінісінде сынаңыз. Бетті таңдаңыз, жапсырма қосып, макетті сақтаңыз. Тіркелусіз.", "Try your design on a Porsche 911 — in photos or in 3D. Choose a surface, add a decal and save your mockup. No account needed.")}</p>
        </div>
        <div className="studio-view-tabs" aria-label={t("Режим примерки", "Сынау режимі", "Preview mode")}>
          <button type="button" aria-pressed={mode === "3d"} onClick={() => selectMode("3d")}>3D / Porsche 911</button>
          <button type="button" aria-pressed={mode === "photo"} onClick={() => selectMode("photo")}>{t("2D / На фотографии", "2D / Фотосуретте", "2D / Photo preview")}</button>
        </div>
        {threeOpened && <div hidden={mode !== "3d"}><PorscheStudio /></div>}
        {photoOpened && <div hidden={mode !== "photo"}><PhotoStudio /></div>}
      </main>
      <Footer />
    </div>
  );
}
