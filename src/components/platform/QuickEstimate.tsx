"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "./Locale";
import { PLACEMENT_TYPES, SLOT_NAMES } from "@/lib/slots";
import { CAR_CLASSES } from "@/lib/vehicle-options";
const defaults = {
  cars: 3,
  months: 1,
  rate: 150000,
  carClass: "PREMIUM",
  zones: ["LEFT_DOOR", "RIGHT_DOOR"] as string[],
};
export function QuickEstimate() {
  const { t, locale } = useLocale();
  const [plan, setPlan] = useState(defaults);
  const [notice, setNotice] = useState("");
  const money = (n: number) =>
    n.toLocaleString(locale === "en" ? "en-US" : "ru-KZ") + " ₸";
  const monthly = plan.cars * plan.zones.length * plan.rate;
  const total = monthly * plan.months;
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("onroad-budget-draft") || "null",
      );
      if (
        saved &&
        Number.isInteger(saved.cars) &&
        saved.cars >= 1 &&
        saved.cars <= 100 &&
        Number.isInteger(saved.months) &&
        saved.months >= 1 &&
        saved.months <= 12 &&
        Number.isFinite(saved.rate) &&
        saved.rate >= 1000 &&
        saved.rate <= 1000000 &&
        CAR_CLASSES[saved.carClass] &&
        Array.isArray(saved.zones) &&
        saved.zones.every((z: string) =>
          PLACEMENT_TYPES.includes(z as (typeof PLACEMENT_TYPES)[number]),
        )
      )
        setPlan({ ...saved, zones: Array.from(new Set(saved.zones)) });
    } catch {}
  }, []);
  function save() {
    try {
      localStorage.setItem("onroad-budget-draft", JSON.stringify(plan));
      setNotice(
        t(
          "Черновик сохранён в этом браузере.",
          "Жоба осы браузерде сақталды.",
          "Draft saved in this browser.",
        ),
      );
    } catch {
      setNotice(
        t(
          "Браузер не разрешает сохранение.",
          "Браузер сақтауға рұқсат бермейді.",
          "Browser storage is unavailable.",
        ),
      );
    }
  }
  function download() {
    const text = [
      "ONROAD · ASTANA, KZ",
      t("Предварительный бюджет", "Алдын ала бюджет", "Budget estimate"),
      `${t("Класс", "Класс", "Class")}: ${t(...CAR_CLASSES[plan.carClass])}`,
      `${t("Автомобилей", "Автомобиль", "Cars")}: ${plan.cars}`,
      `${t("Зоны", "Аймақтар", "Placements")}: ${plan.zones.map((z) => t(...SLOT_NAMES[z])).join(", ")}`,
      `${t("За зону в месяц", "Бір аймақ айына", "Per placement per month")}: ${money(plan.rate)}`,
      `${t("Месяцев", "Ай", "Months")}: ${plan.months}`,
      `${t("В месяц", "Айына", "Monthly")}: ${money(monthly)}`,
      `${t("Итого", "Барлығы", "Total")}: ${money(total)}`,
      t(
        "Ориентир по вашим параметрам. Не бронирование и не оферта. Печать и монтаж не включены.",
        "Сіздің параметрлеріңіз бойынша бағдар. Брондау немесе оферта емес. Басып шығару мен орнату кірмейді.",
        "Estimate based on your inputs, not a reservation or offer. Printing and installation excluded.",
      ),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + text], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "ONROAD-budget.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  return (
    <div className="planner-grid">
      <div className="form-stack">
        <section className="panel">
          <p className="eyebrow">01 / ASTANA, KZ</p>
          <h2>
            {t(
              "Бюджет до выбора автомобилей",
              "Автомобиль таңдауға дейінгі бюджет",
              "Budget before choosing cars",
            )}
          </h2>
          <p>
            {t(
              "Задайте свои ориентиры. Количество машин и ставка здесь — параметры расчёта; доступные автомобили выбираются в соседней вкладке.",
              "Өз бағдарыңызды қойыңыз. Көлік саны мен баға — есеп параметрлері; бос автомобильдер көрші қойындыда.",
              "Set your planning assumptions. Vehicle count and rate are your inputs; available cars are in the other tab.",
            )}
          </p>
        </section>
        <section className="panel form-stack">
          <p className="eyebrow">
            02 / {t("АВТОМОБИЛИ", "АВТОМОБИЛЬДЕР", "VEHICLES")}
          </p>
          <label>
            {t("Класс автомобиля", "Автомобиль класы", "Vehicle class")}
            <select
              value={plan.carClass}
              onChange={(e) => setPlan({ ...plan, carClass: e.target.value })}
            >
              {Object.entries(CAR_CLASSES).map(([key, v]) => (
                <option key={key} value={key}>
                  {t(...v)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("Количество автомобилей", "Автомобиль саны", "Number of cars")}:{" "}
            <strong>{plan.cars}</strong>
            <input
              type="range"
              min={1}
              max={100}
              value={plan.cars}
              onChange={(e) => setPlan({ ...plan, cars: +e.target.value })}
            />
          </label>
          <label>
            {t("Срок, месяцев", "Мерзім, ай", "Duration, months")}:{" "}
            <strong>{plan.months}</strong>
            <input
              type="range"
              min={1}
              max={12}
              value={plan.months}
              onChange={(e) => setPlan({ ...plan, months: +e.target.value })}
            />
          </label>
        </section>
        <section className="panel form-stack">
          <p className="eyebrow">
            03 /{" "}
            {t("ЗОНЫ И СТАВКА", "АЙМАҚТАР МЕН БАҒА", "PLACEMENTS AND RATE")}
          </p>
          <div className="zone-checkboxes">
            {PLACEMENT_TYPES.map((z) => (
              <label key={z} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={plan.zones.includes(z)}
                  onChange={() =>
                    setPlan({
                      ...plan,
                      zones: plan.zones.includes(z)
                        ? plan.zones.filter((v) => v !== z)
                        : [...plan.zones, z],
                    })
                  }
                />
                {t(...SLOT_NAMES[z])}
              </label>
            ))}
          </div>
          <label>
            {t(
              "Ориентир за зону в месяц, ₸",
              "Бір аймақтың айлық бағдары, ₸",
              "Assumed monthly rate per placement, ₸",
            )}
            <input
              type="number"
              min={1000}
              max={1000000}
              step={1000}
              value={plan.rate}
              onChange={(e) =>
                setPlan({
                  ...plan,
                  rate: Math.min(1000000, Math.max(0, Number(e.target.value))),
                })
              }
            />
          </label>
          <input
            aria-label={t("Ставка", "Баға", "Rate")}
            type="range"
            min={1000}
            max={500000}
            step={1000}
            value={Math.min(plan.rate, 500000)}
            onChange={(e) => setPlan({ ...plan, rate: +e.target.value })}
          />
        </section>
      </div>
      <aside className="estimate-panel">
        <p className="eyebrow">
          {t("ПРЕДВАРИТЕЛЬНО", "АЛДЫН АЛА", "ESTIMATE")}
        </p>
        <h2>{money(total)}</h2>
        <dl>
          <dt>{t("Автомобилей", "Автомобиль", "Cars")}</dt>
          <dd>{plan.cars}</dd>
          <dt>
            {t("Зон на каждом", "Әрқайсында аймақ", "Placements per car")}
          </dt>
          <dd>{plan.zones.length}</dd>
          <dt>{t("Месяцев", "Ай", "Months")}</dt>
          <dd>{plan.months}</dd>
          <dt>{t("В месяц", "Айына", "Monthly")}</dt>
          <dd>{money(monthly)}</dd>
        </dl>
        <button
          className="solid-button"
          disabled={!plan.zones.length || plan.rate < 1000}
          onClick={download}
        >
          {t("Скачать расчёт", "Есепті жүктеу", "Download estimate")}
        </button>
        <button className="outline-button" onClick={save}>
          {t("Сохранить черновик", "Жобаны сақтау", "Save draft")}
        </button>
        <button
          className="text-button"
          onClick={() => {
            setPlan(defaults);
            setNotice("");
            try {
              localStorage.removeItem("onroad-budget-draft");
            } catch {}
          }}
        >
          {t("Сбросить расчёт", "Есепті қалпына келтіру", "Reset estimate")}
        </button>
        {notice && <p role="status">{notice}</p>}
        <Link href="/catalog">
          {t("Открыть каталог", "Каталогты ашу", "Open catalog")}
        </Link>
        <p className="fine-print">
          {t(
            "Печать, монтаж и другие расходы согласуются отдельно. Выбор класса не меняет заданную вами ставку автоматически.",
            "Басып шығару, орнату және басқа шығындар бөлек келісіледі. Класс таңдауы бағаны автоматты өзгертпейді.",
            "Printing, installation and other costs are agreed separately. The selected class does not automatically change your input rate.",
          )}
        </p>
      </aside>
    </div>
  );
}
