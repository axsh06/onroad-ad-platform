"use client";
import { ErrorMessage } from "@/components/platform/ErrorMessage";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { preparePhoto } from "@/lib/client/prepare-photo";
import { PLACEMENT_TYPES, SLOT_NAMES } from "@/lib/slots";
import { useLocale } from "./Locale";
export function AddCar() {
  const { t } = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [zones, setZones] = useState<string[]>(["LEFT_DOOR", "RIGHT_DOOR"]);
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "2022",
    color: "",
    class: "PREMIUM",
    districts: "",
    monthly: "150000",
  });
  const set = (key: keyof typeof form, v: string) =>
    setForm({ ...form, [key]: v });
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const photoUrls = [];
      for (const file of files) {
        const data = new FormData();
        data.append("file", await preparePhoto(file), "car.jpg");
        const r = await fetch("/api/uploads", { method: "POST", body: data });
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        photoUrls.push(d.url);
      }
      const monthly = Number(form.monthly);
      const r = await fetch("/api/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          city: "Астана",
          year: Number(form.year),
          districts: form.districts
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          photoUrls,
          slotPrices: Object.fromEntries(
            zones.map((z) => [z, { monthly, weekly: Math.round(monthly / 4) }]),
          ),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      router.push("/dashboard");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t("Ошибка отправки", "Жіберу қатесі", "Submission failed"),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="panel form-stack">
      <p className="eyebrow">ASTANA, KZ</p>
      <h1>{t("Добавить автомобиль", "Автомобиль қосу", "Add your car")}</h1>
      <div className="form-grid">
        {(
          [
            ["make", t("Марка", "Марка", "Make")],
            ["model", t("Модель", "Модель", "Model")],
            ["color", t("Цвет", "Түс", "Color")],
            [
              "districts",
              t(
                "Районы поездок через запятую",
                "Бағыт аудандары, үтірмен",
                "Driving areas, comma-separated",
              ),
            ],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              required
              maxLength={key === "districts" ? 200 : 50}
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
            />
          </label>
        ))}
        <label>
          {t("Год", "Жыл", "Year")}
          <input
            required
            type="number"
            min={2000}
            max={new Date().getFullYear()}
            value={form.year}
            onChange={(e) => set("year", e.target.value)}
          />
        </label>
        <label>
          {t("Класс", "Класс", "Class")}
          <select
            value={form.class}
            onChange={(e) => set("class", e.target.value)}
          >
            {["PREMIUM", "LUXURY", "SPORT", "SUV", "SUPERCAR"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        {t("Город", "Қала", "City")}
        <select disabled>
          <option>{t("Астана", "Астана", "Astana")}</option>
        </select>
        <small>
          {t(
            "Алматы и Шымкент — скоро",
            "Алматы мен Шымкент — жақында",
            "Almaty and Shymkent — coming soon",
          )}
        </small>
      </label>
      <label>
        {t(
          "Фотографии: общий вид, обе стороны и задняя часть",
          "Фотосуреттер: жалпы көрініс, екі жағы және артқы бөлігі",
          "Photos: overview, both sides and rear",
        )}
        <input
          required
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) =>
            setFiles(Array.from(e.target.files || []).slice(0, 8))
          }
        />
        <small>
          {t(
            "До 8 фото, каждое до 8 МБ. Используйте свои реальные фотографии.",
            "8 фотоға дейін, әрқайсысы 8 МБ-қа дейін. Өз нақты фотосуреттеріңізді пайдаланыңыз.",
            "Up to 8 photos, 8 MB each. Use your own real photographs.",
          )}
        </small>
      </label>
      <fieldset>
        <legend>
          {t(
            "Разрешённые зоны",
            "Рұқсат етілген аймақтар",
            "Placements you allow",
          )}
        </legend>
        <div className="zone-checkboxes">
          {PLACEMENT_TYPES.map((z) => (
            <label key={z} className="checkbox-label">
              <input
                type="checkbox"
                checked={zones.includes(z)}
                onChange={() =>
                  setZones(
                    zones.includes(z)
                      ? zones.filter((x) => x !== z)
                      : [...zones, z],
                  )
                }
              />
              {t(...SLOT_NAMES[z])}
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        {t(
          "Предлагаемая цена одной зоны за месяц, ₸",
          "Бір аймақтың ұсынылатын айлық бағасы, ₸",
          "Proposed monthly price per zone, ₸",
        )}
        <input
          type="number"
          required
          min={1000}
          max={1000000}
          step={1000}
          value={form.monthly}
          onChange={(e) => set("monthly", e.target.value)}
        />
      </label>
      <p className="fine-print">
        {t(
          "Точная выплата владельцу согласуется отдельно. Не закрывайте стекло, номера и световые приборы.",
          "Иесіне нақты төлем бөлек келісіледі. Әйнекті, нөмірлерді және шамдарды жаппаңыз.",
          "The owner payout is agreed separately. Keep windows, plates and lights clear.",
        )}
      </p>
      <label className="checkbox-label">
        <input required type="checkbox" />
        <span>
          {t(
            "Я имею право размещать этот автомобиль и фотографии. Согласен на публикацию после проверки.",
            "Бұл автомобиль мен фотосуреттерді орналастыруға құқығым бар. Тексеруден кейін жариялауға келісемін.",
            "I am authorized to list this vehicle and these photos, and consent to publication after approval.",
          )}
        </span>
      </label>
      {error && (
        <p role="alert" className="form-error">
          {<ErrorMessage message={error} />}
        </p>
      )}
      <button
        className="solid-button"
        disabled={busy || !zones.length || !files.length}
      >
        {busy
          ? t("Отправляем…", "Жіберілуде…", "Submitting…")
          : t("Отправить на проверку", "Тексеруге жіберу", "Submit for review")}
      </button>
    </form>
  );
}
