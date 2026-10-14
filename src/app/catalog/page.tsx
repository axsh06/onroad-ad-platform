"use client";
import { Header, Footer } from "@/components/platform/Shell";
import { Inventory } from "@/components/platform/Inventory";
import { useLocale } from "@/components/platform/Locale";
export default function Page() {
  const { t } = useLocale();
  return (
    <div className="platform light-site">
      <Header />
      <main className="section-wrap">
        <p className="eyebrow">ASTANA, KZ</p>
        <h1>
          {t(
            "Найдите свой автомобиль",
            "Өз автомобиліңізді табыңыз",
            "Find your car",
          )}
        </h1>
        <p className="section-lead">
          {t(
            "Реальные фотографии. Проверенные владельцы. Понятные зоны размещения.",
            "Нақты фотосуреттер. Тексерілген иелер. Түсінікті орналастыру аймақтары.",
            "Real photos. Reviewed owners. Clear placement options.",
          )}
        </p>
        <Inventory />
      </main>
      <Footer />
    </div>
  );
}
