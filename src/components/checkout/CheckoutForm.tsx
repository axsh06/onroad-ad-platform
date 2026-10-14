"use client";
import { ErrorMessage } from "@/components/platform/ErrorMessage";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/platform/Locale";
interface Props {
  slotId: string;
  slotLabel: string;
  carName: string;
  priceWeekly: number;
  priceMonthly: number;
  mockupData?: object;
  mockupUrl?: string;
  campaignId?: string;
}
export function CheckoutForm({
  slotId,
  slotLabel,
  carName,
  priceWeekly,
  priceMonthly,
  mockupData,
  mockupUrl,
  campaignId,
}: Props) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [duration, setDuration] = useState("ONE_MONTH");
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  async function submit() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId,
          campaignId,
          duration,
          startDate: new Date(`${date}T12:00:00+05:00`).toISOString(),
          mockupData,
          mockupUrl,
        }),
      });
      const d = await r.json();
      if (r.status === 401) {
        router.push("/login");
        return;
      }
      if (!r.ok) throw Error(d.error);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  if (sent)
    return (
      <section className="panel form-stack">
        <h3>{t("Запрос отправлен", "Өтінім жіберілді", "Request sent")}</h3>
        <p>
          {t(
            "Команда проверит даты и свяжется с вами. Деньги не списаны.",
            "Команда күндерді тексеріп, сізбен байланысады. Ақша алынған жоқ.",
            "Our team will check the dates and contact you. You have not been charged.",
          )}
        </p>
        <button
          className="solid-button"
          onClick={() => router.push("/dashboard")}
        >
          {t("Мои запросы", "Менің өтінімдерім", "My requests")}
        </button>
      </section>
    );
  return (
    <section className="panel form-stack">
      <h3>
        {t("Запросить размещение", "Орналастыру сұрау", "Request a placement")}
      </h3>
      <p>
        {carName} · {slotLabel}
      </p>
      <label>
        {t("Дата начала", "Басталу күні", "Start date")}
        <input
          type="date"
          min={new Date().toISOString().slice(0, 10)}
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <label>
        {t("Срок", "Мерзім", "Duration")}
        <select value={duration} onChange={(e) => setDuration(e.target.value)}>
          <option value="ONE_WEEK">
            {t("1 неделя", "1 апта", "1 week")} ·{" "}
            {priceWeekly.toLocaleString(locale)} ₸
          </option>
          <option value="ONE_MONTH">
            {t("1 месяц", "1 ай", "1 month")} ·{" "}
            {priceMonthly.toLocaleString(locale)} ₸
          </option>
        </select>
      </label>
      <p className="fine-print">
        {t(
          "Окончательные условия и оплата согласуются отдельно. Запрос не является оплатой и не гарантирует бронирование.",
          "Соңғы шарттар мен төлем бөлек келісіледі. Өтінім төлем емес және брондауға кепілдік бермейді.",
          "Final terms and payment are agreed separately. A request is not a payment or a guaranteed reservation.",
        )}
      </p>
      {error && (
        <p role="alert" className="form-error">
          {<ErrorMessage message={error} />}
        </p>
      )}
      <button
        disabled={busy || !date}
        className="solid-button"
        onClick={submit}
      >
        {busy
          ? t("Отправляем…", "Жіберілуде…", "Submitting…")
          : t("Отправить запрос", "Өтінім жіберу", "Send request")}
      </button>
    </section>
  );
}
export default CheckoutForm;
