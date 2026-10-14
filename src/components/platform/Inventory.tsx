"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "./Locale";
export type CarItem = {
  id: string;
  make: string;
  model: string;
  year: number;
  city: string;
  class: string;
  color: string;
  photoUrls: string[];
  modelUrl?: string | null;
  modelHotspots?: Record<string, { position: string; normal: string }>;
  adSlots: {
    id: string;
    slotType: string;
    label: string;
    priceWeekly: string | number;
    priceMonthly: string | number;
    isAvailable: boolean;
  }[];
};
export function useCars({
  search = "",
  carClass = "",
  limit = 24,
}: { search?: string; carClass?: string; limit?: number } = {}) {
  const [cars, setCars] = useState<CarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const loadedPages = useRef(1);
  const version = useRef(0);
  const busy = useRef(false);
  const fetchPage = useCallback(
    async (page: number) => {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search.trim()) query.set("q", search.trim());
      if (carClass) query.set("class", carClass);
      const response = await fetch(`/api/cars?${query}`, { cache: "no-store" });
      if (!response.ok) throw new Error("CATALOG_UNAVAILABLE");
      return response.json() as Promise<{
        cars: CarItem[];
        pagination: { pages: number };
      }>;
    },
    [search, carClass, limit],
  );
  const reload = useCallback(async () => {
    const current = ++version.current;
    busy.current = true;
    setLoading(true);
    setLoadingMore(false);
    try {
      const pages = await Promise.all(
        Array.from({ length: loadedPages.current }, (_, i) => fetchPage(i + 1)),
      );
      if (current !== version.current) return;
      setCars(
        Array.from(
          new Map(
            pages.flatMap((p) => p.cars).map((car) => [car.id, car]),
          ).values(),
        ),
      );
      setHasMore(pages[0].pagination.pages > loadedPages.current);
      setError(false);
    } catch {
      if (current === version.current) setError(true);
    } finally {
      if (current === version.current) {
        setLoading(false);
        busy.current = false;
      }
    }
  }, [fetchPage]);
  const loadMore = useCallback(async () => {
    if (busy.current || !hasMore) return;
    busy.current = true;
    setLoadingMore(true);
    const current = version.current;
    const next = loadedPages.current + 1;
    try {
      const result = await fetchPage(next);
      if (current !== version.current) return;
      setCars((previous) =>
        Array.from(
          new Map(
            [...previous, ...result.cars].map((car) => [car.id, car]),
          ).values(),
        ),
      );
      loadedPages.current = next;
      setHasMore(result.pagination.pages > next);
      setError(false);
    } catch {
      if (current === version.current) setError(true);
    } finally {
      if (current === version.current) {
        setLoadingMore(false);
        busy.current = false;
      }
    }
  }, [fetchPage, hasMore]);
  useEffect(() => {
    loadedPages.current = 1;
    void reload();
    const focus = () => {
      void reload();
    };
    window.addEventListener("focus", focus);
    return () => {
      ++version.current;
      window.removeEventListener("focus", focus);
    };
  }, [reload]);
  return { cars, loading, error, reload, hasMore, loadMore, loadingMore };
}
export function Inventory({
  limit,
  select,
  selected,
}: {
  limit?: number;
  select?: (id: string) => void;
  selected?: string[];
}) {
  const { t, locale } = useLocale();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [carClass, setClass] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const { cars, loading, error, reload, hasMore, loadMore, loadingMore } =
    useCars({ search: query, carClass, limit: limit || 24 });
  const filtered = cars.slice(0, limit);
  return (
    <div>
      {!limit && (
        <div className="inventory-controls">
          <input
            aria-label={t("Поиск автомобиля", "Автомобиль іздеу", "Find a car")}
            placeholder={t(
              "Марка или модель",
              "Марка немесе модель",
              "Make or model",
            )}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            aria-label={t("Класс", "Класс", "Class")}
            value={carClass}
            onChange={(e) => setClass(e.target.value)}
          >
            <option value="">
              {t("Все классы", "Барлық класс", "All classes")}
            </option>
            {["PREMIUM", "LUXURY", "SPORT", "SUV", "SUPERCAR"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <button onClick={reload}>
            {t("Обновить", "Жаңарту", "Refresh")}
          </button>
        </div>
      )}
      {loading ? (
        <p className="empty-state">
          {t(
            "Загружаем автомобили…",
            "Автомобильдер жүктелуде…",
            "Loading cars…",
          )}
        </p>
      ) : error ? (
        <div className="empty-state" role="alert">
          {t(
            "Не удалось загрузить каталог.",
            "Каталогты жүктеу мүмкін болмады.",
            "Could not load cars.",
          )}{" "}
          <button onClick={reload}>
            {t("Повторить", "Қайталау", "Retry")}
          </button>
        </div>
      ) : !filtered.length ? (
        <div className="empty-state">
          <h3>
            {search || carClass
              ? t("Ничего не найдено", "Ештеңе табылмады", "No matching cars")
              : t(
                  "Подборка формируется",
                  "Тізім дайындалуда",
                  "The collection is taking shape",
                )}
          </h3>
          <p>
            {t(
              "Здесь появятся реальные фотографии автомобилей после проверки ONROAD.",
              "ONROAD тексергеннен кейін мұнда нақты автомобильдердің фотосуреттері пайда болады.",
              "Real owner photos appear here after ONROAD approval.",
            )}
          </p>
          <Link href="/seller/register">
            {t("Предложить автомобиль", "Автомобиль ұсыну", "List your car")}
          </Link>
        </div>
      ) : (
        <div className="real-car-grid">
          {filtered.map((car) => {
            const prices = car.adSlots
              .filter((s) => s.isAvailable)
              .map((s) => Number(s.priceMonthly));
            const card = (
              <>
                <div className="real-car-photo">
                  {car.photoUrls[0] && (
                    <img
                      src={car.photoUrls[0]}
                      alt={`${car.make} ${car.model}`}
                      loading="lazy"
                    />
                  )}
                  <span>
                    {t(
                      "Проверен ONROAD",
                      "ONROAD тексерген",
                      "ONROAD approved",
                    )}
                  </span>
                </div>
                <div className="real-car-info">
                  <h3>
                    {car.make} {car.model}
                  </h3>
                  <p>
                    {car.year} · {t("Астана", "Астана", "Astana")}
                  </p>
                  <div>
                    <span>
                      {prices.length
                        ? t("от", "бастап", "from") +
                          " " +
                          Math.min(...prices).toLocaleString(
                            locale === "en" ? "en-US" : "ru-KZ",
                          ) +
                          " ₸"
                        : t(
                            "Нет свободных зон",
                            "Бос аймақ жоқ",
                            "No available zones",
                          )}
                    </span>
                    <small>
                      {t(
                        "в месяц за зону",
                        "айына бір аймақ үшін",
                        "per zone / month",
                      )}
                    </small>
                  </div>
                </div>
              </>
            );
            return select ? (
              <button
                key={car.id}
                className={`real-car-card ${selected?.includes(car.id) ? "selected" : ""}`}
                aria-pressed={selected?.includes(car.id)}
                onClick={() => select(car.id)}
              >
                {card}
              </button>
            ) : (
              <Link
                key={car.id}
                href={`/catalog/${car.id}`}
                className="real-car-card"
              >
                {card}
              </Link>
            );
          })}
        </div>
      )}
      {!limit && !loading && !error && hasMore && (
        <button
          className="outline-button"
          disabled={loadingMore}
          onClick={loadMore}
        >
          {loadingMore
            ? t("Загрузка…", "Жүктелуде…", "Loading…")
            : t("Показать ещё", "Тағы көрсету", "Load more")}
        </button>
      )}
    </div>
  );
}
