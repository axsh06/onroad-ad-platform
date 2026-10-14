"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/platform/Locale";
import {
  LogoConfigurator,
  type SlotType,
} from "@/components/canvas/LogoConfigurator";
import { PLACEMENT_TYPES, SLOT_NAMES } from "@/lib/slots";

export default function PhotoStudio() {
  const { t } = useLocale();
  const [photo, setPhoto] = useState<File | null>(null);
  const [image, setImage] = useState("/photos/mercedes-s-class.png");
  const [zone, setZone] = useState<SlotType>("LEFT_DOOR");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!photo) {
      setImage("/photos/mercedes-s-class.png");
      return;
    }
    const url = URL.createObjectURL(photo);
    setImage(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  return (
        <div className="studio-page-grid">
          <section className="panel form-stack">
            <p className="eyebrow">
              01 / {t("ФОТО И ЗОНА", "ФОТО ЖӘНЕ АЙМАҚ", "PHOTO AND PLACEMENT")}
            </p>
            <h2>
              {t("Подберите ракурс", "Ракурсты таңдаңыз", "Choose your angle")}
            </h2>
            <p>
              {t(
                "Для капота нужен вид спереди, для задней зоны — сзади. Редактор показывает вашу фотографию; выбранная зона обозначает назначение макета.",
                "Капот үшін алдыңғы, артқы аймақ үшін артқы көрініс керек. Редактор фотосуретіңізді көрсетеді; таңдалған аймақ макеттің мақсатын білдіреді.",
                "Use a front view for the hood and a rear view for the rear panel. The editor uses your photo; the selected placement labels the intended location.",
              )}
            </p>
            <label>
              {t(
                "Своё фото автомобиля",
                "Өз көлігіңіздің фотосы",
                "Your car photo",
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  if (
                    !["image/jpeg", "image/png", "image/webp"].includes(
                      file.type,
                    ) ||
                    file.size > 8 * 1024 * 1024
                  ) {
                    setError(
                      t(
                        "Выберите JPG, PNG или WebP до 8 МБ.",
                        "8 МБ-қа дейін JPG, PNG немесе WebP таңдаңыз.",
                        "Choose JPG, PNG or WebP up to 8 MB.",
                      ),
                    );
                    return;
                  }
                  setError("");
                  setPhoto(file);
                }}
              />
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            {photo ? (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setPhoto(null);
                  setError("");
                }}
              >
                {t(
                  "Вернуть пример W223",
                  "W223 мысалын қайтару",
                  "Use the W223 example",
                )}
              </button>
            ) : (
              <p className="fine-print">
                {t(
                  "Mercedes-Benz W223 — пример для примерки, не объявление в каталоге.",
                  "Mercedes-Benz W223 — каталогтағы хабарландыру емес, сынауға арналған мысал.",
                  "The Mercedes-Benz W223 is a design example, not a catalog listing.",
                )}
              </p>
            )}
            <label>
              {t("Зона размещения", "Орналастыру аймағы", "Placement")}
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value as SlotType)}
              >
                {PLACEMENT_TYPES.map((key) => (
                  <option key={key} value={key}>
                    {t(...SLOT_NAMES[key])}
                  </option>
                ))}
              </select>
            </label>
            <p className="fine-print">
              {t(
                "Файлы обрабатываются в браузере. В этом редакторе они не отправляются на сервер. Размеры и монтаж согласуются отдельно.",
                "Файлдар браузерде өңделеді және бұл редактордан серверге жіберілмейді. Өлшемдер мен орнату бөлек келісіледі.",
                "Files are processed in your browser and are not uploaded by this editor. Physical dimensions and installation are agreed separately.",
              )}
            </p>
            <Link className="outline-button" href="/planner">
              {t("Рассчитать бюджет", "Бюджетті есептеу", "Estimate a budget")}
            </Link>
          </section>
          <section className="panel">
            <p className="eyebrow">
              02 / {t("ПРИМЕРКА ЛОГОТИПА", "ЛОГОТИПТІ СЫНАУ", "LOGO PREVIEW")}
            </p>
            <LogoConfigurator carImageUrl={image} selectedSlot={zone} />
          </section>
        </div>
  );
}
