"use client";
import { useState } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/platform/Shell";
import { useLocale } from "@/components/platform/Locale";
import { useCars } from "@/components/platform/Inventory";
import { SLOT_NAMES } from "@/lib/slots";
export default function Planner() {
  const { t, locale } = useLocale();
  const { cars, loading, error, reload, hasMore, loadMore, loadingMore } =
    useCars();
  const [selected, setSelected] = useState<string[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [months, setMonths] = useState(1);
  const chosen = cars.filter((c) => selected.includes(c.id));
  const lines = chosen.flatMap((c) =>
    c.adSlots
      .filter((s) => s.isAvailable && slots.includes(s.id))
      .map((s) => ({ car: c, slot: s })),
  );
  const monthly = lines.reduce(
    (v, { slot }) => v + Number(slot.priceMonthly),
    0,
  );
  const total = monthly * months;
  const money = (n: number) =>
    n.toLocaleString(locale === "en" ? "en-US" : "ru-KZ") + " ₸";
  function toggle(id: string) {
    const car = cars.find((c) => c.id === id)!;
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
      setSlots(slots.filter((x) => !car.adSlots.some((s) => s.id === x)));
    } else {
      setSelected([...selected, id]);
      setSlots([
        ...slots,
        ...car.adSlots.filter((s) => s.isAvailable).map((s) => s.id),
      ]);
    }
  }
  function download() {
    const content = [
      `ONROAD · ASTANA, KZ`,
      t("Предварительный расчёт", "Алдын ала есеп", "Campaign estimate"),
      ...lines.map(
        ({ car, slot }) =>
          `${car.make} ${car.model} · ${SLOT_NAMES[slot.slotType] ? t(...SLOT_NAMES[slot.slotType]) : slot.label} · ${money(Number(slot.priceMonthly))}`,
      ),
      `${t("Месяцев", "Ай саны", "Months")}: ${months}`,
      `${t("Итого", "Барлығы", "Total")}: ${money(total)}`,
      t(
        "Расчёт не является офертой и не резервирует места.",
        "Есеп оферта емес және орындарды брондамайды.",
        "This estimate is not an offer and does not reserve placements.",
      ),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + content], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "ONROAD-estimate.txt";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  return (
    <div className="platform light-site">
      <Header />
      <main className="section-wrap">
        <p className="eyebrow">ONROAD / PLANNER</p>
        <h1>
          {t(
            "Соберите свою кампанию",
            "Өз науқаныңызды құрастырыңыз",
            "Build your campaign",
          )}
        </h1>
        <p className="section-lead">
          {t(
            "Выберите проверенные автомобили и доступные места. Расчёт использует цены из их карточек.",
            "Тексерілген автомобильдер мен бос орындарды таңдаңыз. Есеп карточкадағы бағаларға негізделеді.",
            "Choose approved cars and available placements. Estimates use the prices in their listings.",
          )}
        </p>
        <div className="planner-grid">
          <div className="form-stack">
            <section className="panel">
              <p className="eyebrow">01 / {t("ГОРОД", "ҚАЛА", "CITY")}</p>
              <h2>{t("Астана", "Астана", "Astana")}</h2>
              <p>
                {t(
                  "Алматы и Шымкент — скоро",
                  "Алматы мен Шымкент — жақында",
                  "Almaty and Shymkent — coming soon",
                )}
              </p>
            </section>
            <section className="panel">
              <p className="eyebrow">
                02 /{" "}
                {t("КАКОЙ АВТОМОБИЛЬ", "ҚАЙ АВТОМОБИЛЬ", "SELECT YOUR CARS")}
              </p>
              <button className="text-button" onClick={reload}>
                {t("Обновить список", "Тізімді жаңарту", "Refresh cars")}
              </button>
              {loading ? (
                <p>{t("Загрузка…", "Жүктелуде…", "Loading…")}</p>
              ) : error ? (
                <p role="alert">
                  {t(
                    "Каталог временно недоступен.",
                    "Каталог уақытша қолжетімсіз.",
                    "The catalog is temporarily unavailable.",
                  )}
                </p>
              ) : !cars.length ? (
                <div className="empty-state">
                  <p>
                    {t(
                      "Пока нет одобренных автомобилей. Они появятся здесь сразу после проверки администратором.",
                      "Әзірге мақұлданған автомобиль жоқ. Әкімші тексергеннен кейін олар осында пайда болады.",
                      "No approved cars yet. They appear here as soon as an administrator approves them.",
                    )}
                  </p>
                  <Link href="/seller/register">
                    {t("Добавить автомобиль", "Автомобиль қосу", "List a car")}
                  </Link>
                </div>
              ) : (
                <div className="planner-cars">
                  {cars.map((car) => (
                    <button
                      key={car.id}
                      className={selected.includes(car.id) ? "selected" : ""}
                      aria-pressed={selected.includes(car.id)}
                      onClick={() => toggle(car.id)}
                    >
                      <img
                        src={car.photoUrls[0]}
                        alt={`${car.make} ${car.model}`}
                      />
                      <span>
                        <strong>
                          {car.make} {car.model}
                        </strong>
                        <small>{car.year} · ASTANA</small>
                      </span>
                      <span className="selection-dot">
                        {selected.includes(car.id) ? "✓" : "+"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {!loading && !error && hasMore && (
                <button
                  className="outline-button"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore
                    ? t("Загрузка…", "Жүктелуде…", "Loading…")
                    : t(
                        "Показать ещё автомобили",
                        "Тағы автомобиль көрсету",
                        "Load more cars",
                      )}
                </button>
              )}
            </section>
            <section className="panel">
              <p className="eyebrow">
                03 /{" "}
                {t(
                  "ЗОНЫ И СРОК",
                  "АЙМАҚТАР МЕН МЕРЗІМ",
                  "PLACEMENTS & DURATION",
                )}
              </p>
              {chosen.map((car) => (
                <fieldset key={car.id}>
                  <legend>
                    {car.make} {car.model}
                  </legend>
                  {car.adSlots.map((s) => (
                    <label key={s.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        disabled={!s.isAvailable}
                        checked={slots.includes(s.id) && s.isAvailable}
                        onChange={() =>
                          setSlots(
                            slots.includes(s.id)
                              ? slots.filter((x) => x !== s.id)
                              : [...slots, s.id],
                          )
                        }
                      />
                      <span>
                        {SLOT_NAMES[s.slotType]
                          ? t(...SLOT_NAMES[s.slotType])
                          : s.label}{" "}
                        · {money(Number(s.priceMonthly))}
                        {!s.isAvailable
                          ? " · " +
                            t("Недоступно", "Қолжетімсіз", "Unavailable")
                          : ""}
                      </span>
                    </label>
                  ))}
                </fieldset>
              ))}
              <label>
                {t("Месяцев", "Ай саны", "Months")}: {months}
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                />
              </label>
            </section>
          </div>
          <aside className="estimate-panel">
            <p className="eyebrow">
              {t("ВАШ РАСЧЁТ", "СІЗДІҢ ЕСЕБІҢІЗ", "YOUR ESTIMATE")}
            </p>
            <h2>{money(total)}</h2>
            <dl>
              <dt>{t("Автомобилей", "Автомобиль саны", "Cars")}</dt>
              <dd>{chosen.length}</dd>
              <dt>{t("Зон", "Аймақтар", "Placements")}</dt>
              <dd>{lines.length}</dd>
              <dt>{t("Срок, месяцев", "Мерзімі, ай", "Duration, months")}</dt>
              <dd>{months}</dd>
              <dt>{t("В месяц", "Айына", "Per month")}</dt>
              <dd>{money(monthly)}</dd>
            </dl>
            <button
              className="solid-button"
              disabled={!lines.length || loading || error}
              onClick={download}
            >
              {t("Скачать расчёт", "Есепті жүктеу", "Download estimate")}
            </button>
            <Link
              className="outline-button"
              href={chosen[0] ? `/catalog/${chosen[0].id}` : "/catalog"}
            >
              {t(
                "Перейти к размещению",
                "Орналастыруға өту",
                "Request a placement",
              )}
            </Link>
            <p className="fine-print">
              {t(
                "Расчёт не резервирует места. Даты, макет, монтаж и окончательная стоимость согласуются отдельно. Заявки оформляются по каждой зоне автомобиля.",
                "Есеп орындарды брондамайды. Күндер, макет, орнату және соңғы баға бөлек келісіледі. Өтінім әр автомобиль аймағына беріледі.",
                "The estimate does not reserve placements. Dates, artwork, installation and final pricing are agreed separately. Submit a request for each car placement.",
              )}
            </p>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
