"use client";
import { ErrorMessage } from "@/components/platform/ErrorMessage";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/platform/Locale";
import { Inventory } from "@/components/platform/Inventory";
import { STATUS_NAMES } from "@/components/platform/Statuses";
import { SLOT_NAMES } from "@/lib/slots";
type Booking = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalAmount: string | number;
  slot: {
    slotType: string;
    label: string;
    car: { make: string; model: string; photoUrls: string[] };
  };
};
export function BuyerDashboard() {
  const { t, locale } = useLocale();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/bookings?limit=50")
      .then(async (r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => setBookings(d.bookings))
      .catch(() =>
        setError(
          t(
            "Не удалось загрузить заявки. Обновите страницу.",
            "Өтінімдер жүктелмеді. Бетті жаңартыңыз.",
            "Could not load requests. Refresh the page.",
          ),
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  return (
    <div>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">
            {t("КАБИНЕТ КОМПАНИИ", "КОМПАНИЯ КАБИНЕТІ", "COMPANY ACCOUNT")}
          </p>
          <h1>
            {t(
              "Ваш бренд в движении",
              "Сіздің бренд қозғалыста",
              "Your brand in motion",
            )}
          </h1>
        </div>
        <Link className="outline-button" href="/planner">
          {t("Рассчитать кампанию", "Науқанды есептеу", "Plan a campaign")}
        </Link>
      </div>
      <section>
        <h2>{t("Мои запросы", "Менің өтінімдерім", "My requests")}</h2>
        {error && (
          <p className="form-error">{<ErrorMessage message={error} />}</p>
        )}
        {loading ? (
          <p>{t("Загрузка…", "Жүктелуде…", "Loading…")}</p>
        ) : !bookings.length ? (
          <p className="empty-state">
            {t(
              "Выберите автомобиль ниже и отправьте запрос на размещение.",
              "Төменнен автомобиль таңдап, орналастыру өтінімін жіберіңіз.",
              "Choose a car below and request a placement.",
            )}
          </p>
        ) : (
          bookings.map((b) => (
            <article className="panel booking-row" key={b.id}>
              <div>
                <h3>
                  {b.slot.car.make} {b.slot.car.model}
                </h3>
                <p>
                  {SLOT_NAMES[b.slot.slotType]
                    ? t(...SLOT_NAMES[b.slot.slotType])
                    : b.slot.label}{" "}
                  · {new Date(b.startDate).toLocaleDateString(locale)} —{" "}
                  {new Date(b.endDate).toLocaleDateString(locale)}
                </p>
              </div>
              <strong>{Number(b.totalAmount).toLocaleString(locale)} ₸</strong>
              <span className="status-pill">
                {STATUS_NAMES[b.status]
                  ? t(...STATUS_NAMES[b.status])
                  : b.status}
              </span>
            </article>
          ))
        )}
      </section>
      <section style={{ marginTop: 60 }}>
        <h2>
          {t(
            "Автомобили для вашей кампании",
            "Науқаныңызға арналған автомобильдер",
            "Cars for your campaign",
          )}
        </h2>
        <Inventory />
      </section>
    </div>
  );
}
