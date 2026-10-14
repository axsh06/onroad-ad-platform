"use client";
import { ErrorMessage } from "@/components/platform/ErrorMessage";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/platform/Locale";
import { CarModel, type Hotspots } from "@/components/platform/CarModel";
import { STATUS_NAMES } from "@/components/platform/Statuses";
import { PLACEMENT_TYPES, SLOT_NAMES } from "@/lib/slots";
type ReviewCar = {
  id: string;
  make: string;
  model: string;
  year: number;
  city: string;
  status: string;
  photoUrls: string[];
  modelAssetId: string | null;
  modelHotspots: Hotspots;
  owner: { name: string; email: string; phone: string | null };
  moderationHistory: {
    id: string;
    body: string;
    status: string;
    emailStatus: string;
    createdAt: string;
  }[];
  adSlots: { slotType: string; label: string; priceMonthly: string | number }[];
};
type Booking = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalAmount: string | number;
  buyer: { name: string; companyName: string | null; email: string };
  slot: {
    label: string;
    slotType: string;
    car: { make: string; model: string };
  };
};
export function AdminDashboard() {
  const { t } = useLocale();
  const [cars, setCars] = useState<ReviewCar[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState("PENDING");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        fetch(`/api/admin/cars?status=${status}&page=${page}`),
        fetch("/api/admin/bookings"),
      ]);
      const [ad, bd] = await Promise.all([a.json(), b.json()]);
      if (!a.ok || !b.ok) throw Error(ad.error || bd.error);
      setCars(ad.cars);
      setCounts(ad.counts);
      setPages(ad.pages);
      setBookings(bd.bookings);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [status, page]);
  useEffect(() => {
    void load();
  }, [load]);
  async function booking(id: string, status: string) {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <p className="eyebrow">ONROAD / ADMIN</p>
      <div className="dashboard-heading">
        <h1>
          {t("Управление платформой", "Платформаны басқару", "Manage ONROAD")}
        </h1>
        <button className="outline-button" onClick={load}>
          {t("Обновить", "Жаңарту", "Refresh")}
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {<ErrorMessage message={error} />}
        </p>
      )}
      {notice && (
        <p className="form-notice" role="status">
          {notice}
        </p>
      )}
      <div className="dashboard-tabs">
        {["PENDING", "NEEDS_INFO", "APPROVED", "REJECTED"].map((s) => (
          <button
            key={s}
            aria-pressed={s === status}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
          >
            {t(...STATUS_NAMES[s])} ({counts[s] || 0})
          </button>
        ))}
      </div>
      {loading ? (
        <p>{t("Загрузка…", "Жүктелуде…", "Loading…")}</p>
      ) : !cars.some((c) => c.status === status) ? (
        <p className="empty-state">
          {t(
            "В этом разделе пока нет автомобилей.",
            "Бұл бөлімде әзірге автомобиль жоқ.",
            "No cars in this section yet.",
          )}
        </p>
      ) : (
        cars
          .filter((c) => c.status === status)
          .map((car) => (
            <ReviewCard
              key={car.id}
              car={car}
              reload={load}
              notify={setNotice}
            />
          ))
      )}
      <div className="dashboard-tabs">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
          {t("Назад", "Артқа", "Previous")}
        </button>
        <span>
          {page} / {Math.max(pages, 1)}
        </span>
        <button disabled={page >= pages} onClick={() => setPage(page + 1)}>
          {t("Далее", "Келесі", "Next")}
        </button>
      </div>
      <section style={{ marginTop: 60 }}>
        <h2>
          {t(
            "Запросы на размещение",
            "Орналастыру өтінімдері",
            "Placement requests",
          )}
        </h2>
        {!bookings.length && (
          <p className="empty-state">
            {t("Новых запросов нет.", "Жаңа өтінім жоқ.", "No new requests.")}
          </p>
        )}
        {bookings.map((b) => (
          <article key={b.id} className="panel booking-row">
            <div>
              <h3>{b.buyer.companyName || b.buyer.name}</h3>
              <p>{b.buyer.email}</p>
              <p>
                {b.slot.car.make} {b.slot.car.model} ·{" "}
                {SLOT_NAMES[b.slot.slotType]
                  ? t(...SLOT_NAMES[b.slot.slotType])
                  : b.slot.label}
              </p>
              <strong>{Number(b.totalAmount).toLocaleString()} ₸</strong>
              <p className="fine-print">
                {t(
                  "Подтверждение вручную после договора и проверки оплаты. Деньги этим действием не переводятся.",
                  "Шарт пен төлемді тексергеннен кейін қолмен растау. Бұл әрекет ақша аудармайды.",
                  "Confirm manually after contract and payment checks. This does not transfer money.",
                )}
              </p>
            </div>
            <div className="review-buttons">
              <button
                disabled={busy}
                className="solid-button"
                onClick={() => booking(b.id, "CONFIRMED")}
              >
                {t("Подтвердить", "Растау", "Confirm")}
              </button>
              <button
                disabled={busy}
                className="outline-button"
                onClick={() => booking(b.id, "CANCELLED")}
              >
                {t("Отклонить", "Қабылдамау", "Decline")}
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
function ReviewCard({
  car,
  reload,
  notify,
}: {
  car: ReviewCar;
  reload: () => Promise<void>;
  notify: (s: string) => void;
}) {
  const { t, locale } = useLocale();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editModel, setEditModel] = useState(false);
  const [selected, setSelected] = useState("LEFT_DOOR");
  const [hotspots, setHotspots] = useState<Hotspots>(car.modelHotspots || {});
  const [consent, setConsent] = useState(false);
  async function moderate(status: string) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/cars/${car.id}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      notify(
        d.emailStatus === "SENT"
          ? t(
              "Решение сохранено. Письмо отправлено.",
              "Шешім сақталды. Хат жіберілді.",
              "Decision saved. Email sent.",
            )
          : t(
              "Решение сохранено в кабинете владельца. Письмо не отправлено — проверьте почту и повторите отправку.",
              "Шешім иесінің кабинетінде сақталды. Хат жіберілмеді — пошта баптауын тексеріп, қайталаңыз.",
              "Decision saved in the owner’s account. Email failed — check email settings and retry.",
            ),
      );
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const data = new FormData();
      data.append("file", file);
      const r = await fetch(`/api/admin/cars/${car.id}/model`, {
        method: "POST",
        body: data,
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setHotspots({});
      await reload();
      setEditModel(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  async function saveZones() {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/cars/${car.id}/model`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotspots }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      notify(
        t(
          "Координаты зон сохранены.",
          "Аймақ координаттары сақталды.",
          "Placement coordinates saved.",
        ),
      );
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  async function retry(id: string) {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/messages/${id}/retry`, {
        method: "POST",
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  const templates = [
    t(
      `Здравствуйте, ${car.owner.name}! Ваш автомобиль одобрен и опубликован в каталоге ONROAD. Условия каждой кампании согласуем отдельно.`,
      `${car.owner.name}, сәлеметсіз бе! Автомобиліңіз мақұлданып, ONROAD каталогына жарияланды. Әр науқанның шарттарын бөлек келісеміз.`,
      `Hello ${car.owner.name}, your vehicle has been approved and published in the ONROAD catalog. Each campaign’s terms will be agreed separately.`,
    ),
    t(
      `Здравствуйте, ${car.owner.name}! Для завершения проверки просим добавить чёткие фотографии обеих сторон, капота и задней части автомобиля. Ответить можно в личном кабинете.`,
      `${car.owner.name}, сәлеметсіз бе! Тексеруді аяқтау үшін екі жақтың, капоттың және артқы бөліктің анық фотосуреттерін қосыңыз. Жеке кабинетте жауап бере аласыз.`,
      `Hello ${car.owner.name}, please add clear photos of both sides, the hood and the rear to complete the review. You can reply in your dashboard.`,
    ),
    t(
      `Здравствуйте, ${car.owner.name}! Спасибо за заявку. Сейчас мы не можем одобрить автомобиль по следующей причине: `,
      `${car.owner.name}, сәлеметсіз бе! Өтініміңізге рахмет. Автомобиль келесі себеппен мақұлданбады: `,
      `Hello ${car.owner.name}, thank you for applying. We cannot approve your vehicle at this time for the following reason: `,
    ),
  ];
  return (
    <article className="panel">
      <div className="review-card">
        <div className="review-photos">
          {car.photoUrls.map((u) => (
            <a href={u} key={u} target="_blank" rel="noreferrer">
              <img src={u} alt={`${car.make} ${car.model}`} loading="lazy" />
            </a>
          ))}
        </div>
        <div className="review-content">
          <h3>
            {car.make} {car.model} · {car.year}
          </h3>
          <p>
            {car.city} · {car.owner.name} · {car.owner.email} ·{" "}
            {car.owner.phone}
          </p>
          <p>
            {car.adSlots
              .map(
                (s) =>
                  (SLOT_NAMES[s.slotType]
                    ? t(...SLOT_NAMES[s.slotType])
                    : s.label) +
                  " " +
                  Number(s.priceMonthly).toLocaleString() +
                  " ₸",
              )
              .join(" / ")}
          </p>
          <div className="review-buttons">
            {templates.map((v, i) => (
              <button
                className="text-button"
                key={i}
                onClick={() => setNote(v)}
              >
                {
                  [
                    t(
                      "Шаблон одобрения",
                      "Мақұлдау үлгісі",
                      "Approval template",
                    ),
                    t("Запрос фото", "Фото сұрау", "Request photos"),
                    t("Шаблон отказа", "Бас тарту үлгісі", "Decline template"),
                  ][i]
                }
              </button>
            ))}
          </div>
          <label>
            {t("Сообщение владельцу", "Иесіне хабарлама", "Message to owner")}
            <textarea
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <div className="review-buttons">
            <button
              disabled={busy || note.trim().length < 10}
              onClick={() => moderate("APPROVED")}
              className="solid-button"
            >
              {t(
                "Одобрить и опубликовать",
                "Мақұлдау және жариялау",
                "Approve & publish",
              )}
            </button>
            <button
              disabled={busy || note.trim().length < 10}
              onClick={() => moderate("NEEDS_INFO")}
              className="outline-button"
            >
              {t("Запросить уточнение", "Нақтылау сұрау", "Request details")}
            </button>
            <button
              disabled={busy || note.trim().length < 10}
              onClick={() => moderate("REJECTED")}
              className="outline-button"
            >
              {t("Отклонить", "Қабылдамау", "Decline")}
            </button>
          </div>
        </div>
      </div>
      <details>
        <summary>
          {t(
            "3D-модель и история",
            "3D модель және тарих",
            "3D model & history",
          )}
        </summary>
        <div className="form-stack" style={{ marginTop: 20 }}>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              {t(
                "У меня есть право использовать модель. Она соответствует автомобилю владельца.",
                "Модельді пайдалануға құқығым бар. Ол иесінің автомобиліне сәйкес келеді.",
                "I have the right to use this model, and it matches the owner’s vehicle.",
              )}
            </span>
          </label>
          <label>
            {t(
              "Загрузить GLB со встроенными текстурами, до 4 МБ",
              "Кірістірілген текстуралары бар GLB, 4 МБ дейін",
              "Upload a self-contained GLB, up to 4 MB",
            )}
            <input
              type="file"
              accept=".glb"
              disabled={busy || !consent}
              onChange={(e) => {
                if (e.target.files?.[0]) void upload(e.target.files[0]);
              }}
            />
          </label>
          {car.modelAssetId && (
            <>
              <button
                className="outline-button"
                onClick={() => setEditModel(!editModel)}
              >
                {t(
                  "Настроить зоны в 3D",
                  "3D аймақтарын баптау",
                  "Configure 3D placements",
                )}
              </button>
              {editModel && (
                <>
                  <p className="fine-print">
                    {t(
                      "Выберите зону, затем нажмите на соответствующее место модели. Сохраните все точки.",
                      "Аймақты таңдап, модельдегі орынды басыңыз. Нүктелерді сақтаңыз.",
                      "Choose a placement, click its location on the model, then save the points.",
                    )}
                  </p>
                  <CarModel
                    src={`/api/media/${car.modelAssetId}`}
                    hotspots={hotspots}
                    selected={selected}
                    onSelect={setSelected}
                    onAnnotate={(key, p) =>
                      setHotspots({ ...hotspots, [key]: p })
                    }
                  />
                  <p className="fine-print">
                    {PLACEMENT_TYPES.filter((x) => hotspots[x]).length} / 4
                  </p>
                  <button
                    disabled={busy || !Object.keys(hotspots).length}
                    className="solid-button"
                    onClick={saveZones}
                  >
                    {t(
                      "Сохранить зоны",
                      "Аймақтарды сақтау",
                      "Save placements",
                    )}
                  </button>
                </>
              )}
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {<ErrorMessage message={error} />}
            </p>
          )}
          <div className="history-list">
            {car.moderationHistory.map((m) => (
              <div key={m.id}>
                <time>
                  {new Date(m.createdAt).toLocaleString(locale)} ·{" "}
                  {t(...STATUS_NAMES[m.status])}
                </time>
                <p>{m.body}</p>
                {m.emailStatus === "FAILED" && (
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => retry(m.id)}
                  >
                    {t(
                      "Письмо не отправлено. Повторить",
                      "Хат жіберілмеді. Қайталау",
                      "Email failed. Retry",
                    )}
                  </button>
                )}
                {m.emailStatus === "SENT" && (
                  <small>
                    {t("Письмо отправлено", "Хат жіберілді", "Email sent")}
                  </small>
                )}
              </div>
            ))}
          </div>
        </div>
      </details>
      {error && !editModel && (
        <p className="form-error" role="alert">
          {<ErrorMessage message={error} />}
        </p>
      )}
    </article>
  );
}
