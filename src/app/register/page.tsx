"use client";
import Link from "next/link";
import { Header, Footer } from "@/components/platform/Shell";
import { useLocale } from "@/components/platform/Locale";
export default function Page() {
  const { t } = useLocale();
  return (
    <div className="platform light-site">
      <Header />
      <main className="section-wrap">
        <p className="eyebrow">ONROAD / ASTANA, KZ</p>
        <h1>
          {t("Выберите свою роль", "Рөліңізді таңдаңыз", "Choose your role")}
        </h1>
        <div className="role-grid">
          <Link className="panel" href="/buyer/register">
            <span>01 / BRAND</span>
            <h2>
              {t(
                "Я представляю компанию",
                "Мен компания өкілімін",
                "I represent a company",
              )}
            </h2>
            <p>
              {t(
                "Каталог, расчёт кампании и запросы на размещение.",
                "Каталог, науқан есебі және орналастыру өтінімдері.",
                "Browse cars, estimate a campaign and request placements.",
              )}
            </p>
          </Link>
          <Link className="panel" href="/seller/register">
            <span>02 / DRIVER</span>
            <h2>
              {t(
                "У меня есть автомобиль",
                "Менде автомобиль бар",
                "I own a car",
              )}
            </h2>
            <p>
              {t(
                "Мой гараж, проверка автомобиля, свободные зоны и компании.",
                "Менің гаражым, автомобильді тексеру, бос аймақтар мен компаниялар.",
                "Your garage, vehicle review, placements and interested companies.",
              )}
            </p>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
