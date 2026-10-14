"use client";
import { useEffect, useState } from "react";
import { useLocale } from "./Locale";
import { STATUS_NAMES } from "./Statuses";
import { SLOT_NAMES } from "@/lib/slots";
import { ErrorMessage } from "./ErrorMessage";
type Stats = {
  totalEarnings: number;
  pendingPayout: number;
  completedPayout: number;
  activeBookings: number;
};
type Booking = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  sellerAmount: string | number;
  slot: {
    slotType: string;
    label: string;
    car: { make: string; model: string };
  };
  campaign?: { brandName: string } | null;
};
export function OwnerActivity() {
  const { t, locale } = useLocale();
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState("active");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      fetch("/api/seller/stats", { cache: "no-store" }),
      fetch(`/api/bookings?group=${tab}&page=${page}&limit=10`, {
        cache: "no-store",
      }),
    ])
      .then(async ([a, b]) => {
        const [sa, sb] = await Promise.all([a.json(), b.json()]);
        if (!a.ok || !b.ok) throw Error(sa.error || sb.error);
        if (alive) {
          setStats(sa);
          setBookings(sb.bookings);
          setPages(sb.pagination.pages);
          setError("");
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tab, page]);
  const money = (v: number | string) =>
    (+v).toLocaleString(locale === "en" ? "en-US" : "ru-KZ") + " ₸";
  return (
    <section>
      <div className="metrics-grid">
        {[
          [
            t("Начислено", "Есептелді", "Recorded earnings"),
            stats ? money(stats.totalEarnings) : "—",
          ],
          [
            t("К выплате", "Төленуі тиіс", "Pending payout"),
            stats ? money(stats.pendingPayout) : "—",
          ],
          [
            t("Выплачено", "Төленді", "Paid out"),
            stats ? money(stats.completedPayout) : "—",
          ],
          [
            t(
              "Размещений в работе",
              "Жұмыстағы орналастыру",
              "Open placements",
            ),
            stats ? String(stats.activeBookings) : "—",
          ],
        ].map(([label, value]) => (
          <div className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <p className="fine-print">
        {t(
          "Показатели из учёта платформы. Подтверждение заявки само по себе не означает выплату.",
          "Көрсеткіштер платформа есебінен. Өтінімді растау төлем жасалды дегенді білдірмейді.",
          "Figures from platform records. Confirming a request does not itself record a payout.",
        )}
      </p>
      <details className="panel" style={{ margin: "24px 0" }}>
        <summary>
          {t(
            "Кампании и история размещений",
            "Науқандар мен орналастыру тарихы",
            "Campaigns and placement history",
          )}
        </summary>
        <div className="dashboard-tabs" style={{ marginTop: 20 }}>
          {["active", "history"].map((v) => (
            <button
              key={v}
              aria-pressed={tab === v}
              onClick={() => {
                setTab(v);
                setPage(1);
              }}
            >
              {v === "active"
                ? t("В работе", "Жұмыста", "Open")
                : t("История", "Тарих", "History")}
            </button>
          ))}
        </div>
        {error && (
          <p className="form-error">
            <ErrorMessage message={error} />
          </p>
        )}
        {loading ? (
          <p>{t("Загрузка…", "Жүктелуде…", "Loading…")}</p>
        ) : !bookings.length ? (
          <p className="empty-state">
            {t(
              "Размещений пока нет.",
              "Әзірге орналастыру жоқ.",
              "No placements yet.",
            )}
          </p>
        ) : (
          bookings.map((b) => (
            <article className="booking-row" key={b.id}>
              <div>
                <strong>
                  {b.slot.car.make} {b.slot.car.model}
                </strong>
                <p>
                  {SLOT_NAMES[b.slot.slotType]
                    ? t(...SLOT_NAMES[b.slot.slotType])
                    : b.slot.label}{" "}
                  · {b.campaign?.brandName || "ONROAD"}
                </p>
                <p>
                  {new Date(b.startDate).toLocaleDateString(
                    locale === "en" ? "en-GB" : "ru-KZ",
                  )}{" "}
                  —{" "}
                  {new Date(b.endDate).toLocaleDateString(
                    locale === "en" ? "en-GB" : "ru-KZ",
                  )}
                </p>
              </div>
              <div>
                <span className="status-pill">
                  {STATUS_NAMES[b.status]
                    ? t(...STATUS_NAMES[b.status])
                    : b.status}
                </span>
                <p>
                  {t("Доля владельца", "Иесінің үлесі", "Owner share")}:{" "}
                  {money(b.sellerAmount)}
                </p>
              </div>
            </article>
          ))
        )}
        <div className="dashboard-tabs">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t("Назад", "Артқа", "Previous")}
          </button>
          <span>
            {page} / {Math.max(1, pages)}
          </span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)}>
            {t("Далее", "Келесі", "Next")}
          </button>
        </div>
      </details>
    </section>
  );
}
