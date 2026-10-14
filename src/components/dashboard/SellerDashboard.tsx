"use client";
import { ErrorMessage } from "@/components/platform/ErrorMessage";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { preparePhoto } from "@/lib/client/prepare-photo";
import { useLocale } from "@/components/platform/Locale";
import { CarModel, type Hotspots } from "@/components/platform/CarModel";
import { STATUS_NAMES } from "@/components/platform/Statuses";
import { SLOT_NAMES } from "@/lib/slots";
type GarageCar = {
  id: string;
  make: string;
  model: string;
  status: string;
  photoUrls: string[];
  modelUrl: string | null;
  modelHotspots: Hotspots;
  moderationHistory: {
    id: string;
    body: string;
    status: string;
    createdAt: string;
  }[];
  views: {
    buyerId: string;
    viewedAt: string;
    buyer: { companyName: string | null };
  }[];
  adSlots: {
    id: string;
    slotType: string;
    label: string;
    isAvailable: boolean;
    bookings: {
      id: string;
      status: string;
      startDate: string;
      endDate: string;
      buyer: { companyName: string | null; name: string };
    }[];
  }[];
};
export default function SellerDashboard() {
  const { t } = useLocale();
  const [cars, setCars] = useState<GarageCar[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/seller/cars");
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setCars(d.cars);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <div>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">
            {t("КАБИНЕТ ВЛАДЕЛЬЦА", "ИЕСІНІҢ КАБИНЕТІ", "OWNER ACCOUNT")}
          </p>
          <h1>{t("Мой гараж", "Менің гаражым", "My garage")}</h1>
        </div>
        <Link className="solid-button" href="/dashboard/add-car">
          {t("Добавить автомобиль", "Автомобиль қосу", "Add a car")}
        </Link>
      </div>
      {error && (
        <p className="form-error">{<ErrorMessage message={error} />}</p>
      )}
      {loading ? (
        <p>{t("Загрузка…", "Жүктелуде…", "Loading…")}</p>
      ) : !cars.length ? (
        <p className="empty-state">
          {t(
            "Добавьте свой первый автомобиль и отправьте его на проверку.",
            "Алғашқы автомобиліңізді қосып, тексеруге жіберіңіз.",
            "Add your first car and submit it for review.",
          )}
        </p>
      ) : (
        cars.map((car) => <GarageCard key={car.id} car={car} reload={load} />)
      )}
    </div>
  );
}
function GarageCard({
  car,
  reload,
}: {
  car: GarageCar;
  reload: () => Promise<void>;
}) {
  const { t, locale } = useLocale();
  const [zone, setZone] = useState("LEFT_DOOR");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function resubmit() {
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
      const r = await fetch(`/api/seller/cars/${car.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrls, note }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setFiles([]);
      setNote("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="panel garage-card">
      <div className="dashboard-heading">
        <h2>
          {car.make} {car.model}
        </h2>
        <span className="status-pill">{t(...STATUS_NAMES[car.status])}</span>
      </div>
      <div className="garage-grid">
        <div>
          <CarModel
            src={car.modelUrl}
            hotspots={car.modelHotspots}
            photo={car.photoUrls[0]}
            selected={zone}
            onSelect={setZone}
          />
          {!car.modelUrl && (
            <p className="fine-print">
              {t(
                "Индивидуальная 3D-модель ещё не загружена администратором.",
                "Әкімші жеке 3D модельді әлі жүктемеді.",
                "Your administrator has not uploaded an individual 3D model yet.",
              )}
            </p>
          )}
          <div className="detail-photos">
            {car.photoUrls.map((u) => (
              <a key={u} href={u} target="_blank" rel="noreferrer">
                <img src={u} alt={`${car.make} ${car.model}`} loading="lazy" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3>
            {t(
              "Места размещения",
              "Орналастыру орындары",
              "Placement availability",
            )}
          </h3>
          {car.adSlots.map((slot) => (
            <div className="placement-status" key={slot.id}>
              <span>
                {SLOT_NAMES[slot.slotType]
                  ? t(...SLOT_NAMES[slot.slotType])
                  : slot.label}
              </span>
              <div>
                {slot.bookings.length ? (
                  slot.bookings.map((b) => (
                    <p key={b.id}>
                      <strong>{b.buyer.companyName || b.buyer.name}</strong>
                      <br />
                      {new Date(b.startDate).toLocaleDateString(locale)} —{" "}
                      {new Date(b.endDate).toLocaleDateString(locale)}
                    </p>
                  ))
                ) : (
                  <span>
                    {slot.isAvailable
                      ? t("Свободно", "Бос", "Available")
                      : t("Недоступно", "Қолжетімсіз", "Unavailable")}
                  </span>
                )}
              </div>
            </div>
          ))}
          <div className="company-list">
            <h3>
              {t(
                "Интерес компаний",
                "Компаниялардың қызығушылығы",
                "Company interest",
              )}
            </h3>
            <p className="fine-print">
              {t(
                "Здесь только компании, разрешившие показать владельцу свой интерес.",
                "Мұнда өз қызығушылығын иесіне көрсетуге рұқсат берген компаниялар ғана бар.",
                "Only companies that consented to sharing their interest are shown.",
              )}
            </p>
            {car.views.length ? (
              car.views.map((v) => (
                <div key={v.buyerId}>
                  <strong>
                    {v.buyer.companyName ||
                      t("Компания", "Компания", "Company")}
                  </strong>{" "}
                  · {new Date(v.viewedAt).toLocaleDateString(locale)}
                </div>
              ))
            ) : (
              <p className="fine-print">
                {t(
                  "Пока нет подтверждённого интереса.",
                  "Әзірге расталған қызығушылық жоқ.",
                  "No shared interest yet.",
                )}
              </p>
            )}
          </div>
        </div>
      </div>
      {car.moderationHistory.length > 0 && (
        <details
          className="history-list"
          open={car.status === "NEEDS_INFO" || car.status === "REJECTED"}
        >
          <summary>
            {t(
              "Проверка и сообщения",
              "Тексеру және хабарламалар",
              "Review & messages",
            )}
          </summary>
          {car.moderationHistory.map((m) => (
            <div key={m.id}>
              <time>
                {new Date(m.createdAt).toLocaleString(locale)} ·{" "}
                {t(...STATUS_NAMES[m.status])}
              </time>
              {m.body}
            </div>
          ))}
        </details>
      )}
      {["NEEDS_INFO", "REJECTED"].includes(car.status) && (
        <div className="form-stack" style={{ marginTop: 25 }}>
          <label>
            {t("Ваше пояснение", "Түсініктемеңіз", "Your reply")}
            <textarea
              value={note}
              maxLength={1500}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <label>
            {t(
              "Дополнительные фотографии",
              "Қосымша фотосуреттер",
              "Additional photos",
            )}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) =>
                setFiles(Array.from(e.target.files || []).slice(0, 8))
              }
            />
          </label>
          {error && (
            <p role="alert" className="form-error">
              {<ErrorMessage message={error} />}
            </p>
          )}
          <button
            className="solid-button"
            disabled={busy || note.trim().length < 5}
            onClick={resubmit}
          >
            {busy
              ? t("Отправляем…", "Жіберілуде…", "Submitting…")
              : t("Отправить повторно", "Қайта жіберу", "Resubmit")}
          </button>
        </div>
      )}
    </article>
  );
}
