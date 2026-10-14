"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorMessage } from "./ErrorMessage";
import { preparePhoto } from "@/lib/client/prepare-photo";
import { PLACEMENT_TYPES, SLOT_NAMES } from "@/lib/slots";
import { VEHICLE_MODELS, CAR_CLASSES } from "@/lib/vehicle-options";
import {
  LogoConfigurator,
  type SlotType,
} from "@/components/canvas/LogoConfigurator";
import { useLocale } from "./Locale";
export function AddCar() {
  const { t } = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [zones, setZones] = useState<string[]>(["LEFT_DOOR", "RIGHT_DOOR"]);
  const [previewZone, setPreviewZone] = useState<SlotType>("LEFT_DOOR");
  const [prices, setPrices] = useState<
    Record<string, { monthly: string; weekly: string }>
  >(
    Object.fromEntries(
      PLACEMENT_TYPES.map((z) => [z, { monthly: "150000", weekly: "40000" }]),
    ),
  );
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: String(new Date().getFullYear()),
    color: "",
    class: "PREMIUM",
    districts: "",
    weeklyKm: "",
    plateNumber: "",
  });
  const set = (key: keyof typeof form, value: string) =>
    setForm((previous) => ({
      ...previous,
      [key]: value,
      ...(key === "make" ? { model: "" } : {}),
    }));
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPhotos(urls);
    setPhotoIndex(0);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);
  function addFiles(incoming: File[]) {
    if (files.length + incoming.length > 8) {
      setError(
        t(
          "Можно добавить до 8 фотографий.",
          "8 фотосуретке дейін қосуға болады.",
          "You can add up to 8 photos.",
        ),
      );
      return;
    }
    if (
      incoming.some(
        (f) =>
          f.size > 8 * 1024 * 1024 ||
          !["image/jpeg", "image/png", "image/webp"].includes(f.type),
      )
    ) {
      setError(
        t(
          "Фотографии должны быть JPG, PNG или WebP до 8 МБ.",
          "Фотолар JPG, PNG немесе WebP форматында, 8 МБ-қа дейін болуы керек.",
          "Photos must be JPG, PNG or WebP up to 8 MB.",
        ),
      );
      return;
    }
    setError("");
    setFiles([...files, ...incoming]);
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !files.length || !zones.length) return;
    setBusy(true);
    setError("");
    try {
      const photoUrls: string[] = [];
      for (const [index, file] of files.entries()) {
        setProgress(
          t(
            `Загружаем фото ${index + 1} из ${files.length}`,
            `${files.length} фотодан ${index + 1} жүктелуде`,
            `Uploading photo ${index + 1} of ${files.length}`,
          ),
        );
        const data = new FormData();
        data.append("file", await preparePhoto(file), "car.jpg");
        const response = await fetch("/api/uploads", {
          method: "POST",
          body: data,
        });
        const result = await response.json();
        if (!response.ok) throw Error(result.error);
        photoUrls.push(result.url);
      }
      setProgress(
        t(
          "Отправляем заявку…",
          "Өтінім жіберілуде…",
          "Submitting application…",
        ),
      );
      const response = await fetch("/api/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          plateNumber: form.plateNumber || undefined,
          city: "Астана",
          year: Number(form.year),
          weeklyKm: Number(form.weeklyKm),
          districts: form.districts
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          photoUrls,
          slotPrices: Object.fromEntries(
            zones.map((z) => [
              z,
              {
                monthly: Number(prices[z].monthly),
                weekly: Number(prices[z].weekly),
              },
            ]),
          ),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }
  return (
    <form onSubmit={submit} className="panel form-stack">
      <p className="eyebrow">ONROAD / ASTANA, KZ</p>
      <h1>{t("Добавить автомобиль", "Автомобиль қосу", "Add your car")}</h1>
      <p>
        {t(
          "Укажите автомобиль, загрузите фото, выберите зоны и посмотрите, как будет выглядеть реклама.",
          "Көлікті көрсетіп, фото жүктеңіз, аймақтарды таңдап, жарнама көрінісін қараңыз.",
          "Choose your vehicle, upload photos, select placements and preview the advertising.",
        )}
      </p>
      <section className="owner-step">
        <h2>01 / {t("Ваш автомобиль", "Сіздің автомобиль", "Your vehicle")}</h2>
        <div className="form-grid">
          <label>
            {t("Марка", "Марка", "Make")}
            <input
              required
              maxLength={50}
              list="vehicle-makes"
              placeholder="Mercedes-Benz"
              value={form.make}
              onChange={(e) => set("make", e.target.value)}
            />
            <datalist id="vehicle-makes">
              {Object.keys(VEHICLE_MODELS).map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </label>
          <label>
            {t("Модель и кузов", "Модель және кузов", "Model and generation")}
            <input
              required
              maxLength={50}
              list="vehicle-models"
              placeholder="S-Class W223"
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
            />
            <datalist id="vehicle-models">
              {(VEHICLE_MODELS[form.make] || []).map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <small>
              {t(
                "Выберите из списка или введите свою модель.",
                "Тізімнен таңдаңыз немесе өз моделіңізді енгізіңіз.",
                "Choose a suggestion or enter your own model.",
              )}
            </small>
          </label>
          <label>
            {t("Год выпуска", "Шығарылған жыл", "Year")}
            <select
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
            >
              {Array.from(
                { length: new Date().getFullYear() - 1999 },
                (_, i) => new Date().getFullYear() - i,
              ).map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </label>
          <label>
            {t("Класс", "Класс", "Class")}
            <select
              value={form.class}
              onChange={(e) => set("class", e.target.value)}
            >
              {Object.entries(CAR_CLASSES).map(([key, label]) => (
                <option key={key} value={key}>
                  {t(...label)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("Цвет", "Түс", "Color")}
            <input
              required
              maxLength={30}
              value={form.color}
              onChange={(e) => set("color", e.target.value)}
            />
          </label>
          <label>
            {t(
              "Госномер — только для проверки",
              "Мемлекеттік нөмір — тек тексеру үшін",
              "Plate — review only",
            )}
            <input
              minLength={4}
              maxLength={10}
              value={form.plateNumber}
              onChange={(e) => set("plateNumber", e.target.value)}
            />
            <small>
              {t(
                "Не публикуется в каталоге. Необязательно.",
                "Каталогта жарияланбайды. Міндетті емес.",
                "Not published in the catalog. Optional.",
              )}
            </small>
          </label>
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
              "Километров в неделю",
              "Аптасына километр",
              "Kilometres per week",
            )}
            <input
              type="number"
              min={0}
              max={10000}
              value={form.weeklyKm}
              onChange={(e) => set("weeklyKm", e.target.value)}
            />
          </label>
          <label>
            {t(
              "Районы поездок, через запятую",
              "Бағыт аудандары, үтірмен",
              "Driving areas, comma-separated",
            )}
            <input
              required
              maxLength={200}
              value={form.districts}
              onChange={(e) => set("districts", e.target.value)}
            />
          </label>
        </div>
      </section>
      <section className="owner-step">
        <h2>
          02 / {t("Реальные фотографии", "Нақты фотосуреттер", "Real photos")}
        </h2>
        <p>
          {t(
            "Добавьте общий вид, левую и правую стороны, капот и заднюю часть. До 8 фото, каждое до 8 МБ.",
            "Жалпы көрініс, сол және оң жақ, капот және артқы бөлікті қосыңыз. 8 фотоға дейін, әрқайсысы 8 МБ.",
            "Add an overview, both sides, hood and rear. Up to 8 photos, 8 MB each.",
          )}
        </p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy}
          onChange={(e) => {
            addFiles(Array.from(e.target.files || []));
            e.target.value = "";
          }}
          aria-label={t(
            "Добавить фотографии",
            "Фотосуреттер қосу",
            "Add photos",
          )}
        />
        <div className="photo-picker">
          {photos.map((url, i) => (
            <div key={url}>
              <button
                type="button"
                aria-pressed={photoIndex === i}
                onClick={() => setPhotoIndex(i)}
              >
                <img src={url} alt={`${t("Фото", "Фото", "Photo")} ${i + 1}`} />
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => setFiles(files.filter((_, n) => n !== i))}
              >
                {t("Удалить", "Жою", "Remove")}
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="owner-step">
        <h2>
          03 /{" "}
          {t("Зоны и стоимость", "Аймақтар мен баға", "Placements and pricing")}
        </h2>
        {PLACEMENT_TYPES.map((z) => (
          <div className="zone-price-row" key={z}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={zones.includes(z)}
                onChange={() =>
                  setZones(
                    zones.includes(z)
                      ? zones.filter((v) => v !== z)
                      : [...zones, z],
                  )
                }
              />
              {t(...SLOT_NAMES[z])}
            </label>
            <label>
              {t("За месяц, ₸", "Айына, ₸", "Per month, ₸")}
              <input
                type="number"
                required={zones.includes(z)}
                disabled={!zones.includes(z)}
                min={1000}
                max={1000000}
                value={prices[z].monthly}
                onChange={(e) =>
                  setPrices({
                    ...prices,
                    [z]: { ...prices[z], monthly: e.target.value },
                  })
                }
              />
            </label>
            <label>
              {t("За неделю, ₸", "Аптасына, ₸", "Per week, ₸")}
              <input
                type="number"
                required={zones.includes(z)}
                disabled={!zones.includes(z)}
                min={1000}
                max={1000000}
                value={prices[z].weekly}
                onChange={(e) =>
                  setPrices({
                    ...prices,
                    [z]: { ...prices[z], weekly: e.target.value },
                  })
                }
              />
            </label>
          </div>
        ))}
        <p className="fine-print">
          {t(
            "Предлагаемые цены проходят согласование. Стёкла, номера и световые приборы оставляем открытыми.",
            "Ұсынылған бағалар келісіледі. Әйнек, нөмір және шамдар ашық қалады.",
            "Proposed prices are reviewed. Windows, plates and lights must remain clear.",
          )}
        </p>
      </section>
      <section className="owner-step">
        <h2>
          04 / {t("Примерка логотипа", "Логотипті көру", "Preview a logo")}
        </h2>
        <label>
          {t("Зона для примерки", "Көру аймағы", "Preview placement")}
          <select
            value={previewZone}
            onChange={(e) => setPreviewZone(e.target.value as SlotType)}
          >
            {PLACEMENT_TYPES.map((z) => (
              <option value={z} key={z}>
                {t(...SLOT_NAMES[z])}
              </option>
            ))}
          </select>
        </label>
        {photos.length ? (
          <>
            <div className="photo-picker">
              {photos.map((url, i) => (
                <button
                  type="button"
                  key={url}
                  aria-pressed={photoIndex === i}
                  onClick={() => setPhotoIndex(i)}
                >
                  <img
                    src={url}
                    alt={`${t("Ракурс", "Ракурс", "View")} ${i + 1}`}
                  />
                </button>
              ))}
            </div>
            <LogoConfigurator
              carImageUrl={photos[photoIndex] || photos[0]}
              selectedSlot={previewZone}
            />
          </>
        ) : (
          <p className="empty-state">
            {t(
              "Загрузите фотографию выше — здесь откроется примерка на вашем автомобиле.",
              "Жоғарыда фото жүктеңіз — осында өз көлігіңіздегі көрініс ашылады.",
              "Upload a photo above to preview a logo on your own car.",
            )}
          </p>
        )}
      </section>
      <label className="checkbox-label">
        <input required type="checkbox" />
        <span>
          {t(
            "Я имею право размещать автомобиль и фотографии. Согласен на публикацию после проверки.",
            "Автомобиль мен фотоларды орналастыруға құқығым бар. Тексеруден кейін жариялауға келісемін.",
            "I am authorized to list this vehicle and photos and consent to publication after review.",
          )}
        </span>
      </label>
      {error && (
        <p className="form-error" role="alert">
          <ErrorMessage message={error} />
        </p>
      )}
      {progress && <p role="status">{progress}</p>}
      <button
        className="solid-button"
        disabled={busy || !files.length || !zones.length}
      >
        {busy
          ? t("Отправляем…", "Жіберілуде…", "Submitting…")
          : t("Отправить на проверку", "Тексеруге жіберу", "Submit for review")}
      </button>
    </form>
  );
}
