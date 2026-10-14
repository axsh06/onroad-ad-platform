"use client";
import { ErrorMessage } from "@/components/platform/ErrorMessage";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header, Footer } from "@/components/platform/Shell";
import { useLocale } from "@/components/platform/Locale";
import { CarModel } from "@/components/platform/CarModel";
import { type CarItem } from "@/components/platform/Inventory";
import {
  LogoConfigurator,
  type SlotType,
} from "@/components/canvas/LogoConfigurator";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { SLOT_NAMES } from "@/lib/slots";
export default function Page() {
  const { t } = useLocale();
  const params = useParams<{ id: string }>();
  const [car, setCar] = useState<CarItem | null>(null);
  const [slotId, setSlotId] = useState("");
  const [photo, setPhoto] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [interest, setInterest] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mockup, setMockup] = useState<{
    fabricJson: object;
    previewUrl: string;
  } | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/cars/${params.id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (live) {
          setCar(d.car);
          setPhoto(d.car.photoUrls[0]);
          setSlotId(
            d.car.adSlots.find((s: CarItem["adSlots"][number]) => s.isAvailable)
              ?.id || "",
          );
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [params.id]);
  async function shareInterest() {
    setBusy(true);
    try {
      const r = await fetch(`/api/cars/${params.id}/interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setInterest(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  const slot = car?.adSlots.find((s) => s.id === slotId);
  const label = slot
    ? SLOT_NAMES[slot.slotType]
      ? t(...SLOT_NAMES[slot.slotType])
      : slot.label
    : "";
  return (
    <div className="platform light-site">
      <Header />
      <main className="section-wrap">
        <Link className="text-button" href="/catalog">
          {t("Все автомобили", "Барлық автомобильдер", "All cars")}
        </Link>
        {loading ? (
          <p className="empty-state">
            {t("Загрузка…", "Жүктелуде…", "Loading…")}
          </p>
        ) : !car ? (
          <p className="empty-state">{<ErrorMessage message={error} />}</p>
        ) : (
          <>
            <div className="dashboard-heading" style={{ marginTop: 30 }}>
              <div>
                <p className="eyebrow">ASTANA, KZ / {car.year}</p>
                <h1>
                  {car.make} {car.model}
                </h1>
              </div>
              <span className="status-pill">
                {t("Проверено ONROAD", "ONROAD тексерген", "ONROAD approved")}
              </span>
            </div>
            <div className="detail-layout">
              <section>
                <img
                  className="detail-photo"
                  src={photo}
                  alt={`${car.make} ${car.model}`}
                />
                <div className="detail-photos">
                  {car.photoUrls.map((u) => (
                    <button key={u} onClick={() => setPhoto(u)}>
                      <img
                        src={u}
                        alt={t(
                          "Фото автомобиля",
                          "Автомобиль фотосы",
                          "Vehicle photo",
                        )}
                      />
                    </button>
                  ))}
                </div>
                <CarModel
                  src={car.modelUrl}
                  hotspots={car.modelHotspots}
                  photo={photo}
                  selected={slot?.slotType}
                  onSelect={(type) => {
                    const s = car.adSlots.find(
                      (s) => s.slotType === type && s.isAvailable,
                    );
                    if (s) {
                      setSlotId(s.id);
                      setMockup(null);
                    }
                  }}
                />
                {slot && (
                  <details style={{ marginTop: 25 }}>
                    <summary>
                      {t(
                        "Подготовить макет на фотографии",
                        "Фотода макет дайындау",
                        "Create a photo mockup",
                      )}
                    </summary>
                    <div style={{ marginTop: 20 }}>
                      <LogoConfigurator
                        key={photo + slot.id}
                        carImageUrl={photo}
                        selectedSlot={slot.slotType as SlotType}
                        onChange={setMockup}
                      />
                    </div>
                    <p className="fine-print">
                      {t(
                        "Переместите логотип на нужное место. Это визуальный черновик, точные размеры согласуются отдельно.",
                        "Логотипті қажетті орынға жылжытыңыз. Бұл визуалды жоба, нақты өлшемдер бөлек келісіледі.",
                        "Move the logo to your desired location. This is a visual draft; exact measurements are agreed separately.",
                      )}
                    </p>
                  </details>
                )}
              </section>
              <section className="form-stack">
                <h2>
                  {t("Выберите место", "Орын таңдаңыз", "Choose a placement")}
                </h2>
                <div className="detail-zones">
                  {car.adSlots.map((s) => (
                    <button
                      key={s.id}
                      disabled={!s.isAvailable}
                      aria-pressed={s.id === slotId}
                      onClick={() => {
                        setSlotId(s.id);
                        setMockup(null);
                      }}
                    >
                      <span>
                        {SLOT_NAMES[s.slotType]
                          ? t(...SLOT_NAMES[s.slotType])
                          : s.label}
                        <small>
                          {s.isAvailable
                            ? t(
                                "Даты согласуются при запросе",
                                "Күндер өтінімде келісіледі",
                                "Dates confirmed on request",
                              )
                            : t("Недоступно", "Қолжетімсіз", "Unavailable")}
                        </small>
                      </span>
                      <strong>
                        {Number(s.priceMonthly).toLocaleString()} ₸
                        <small>{t("за месяц", "айына", "per month")}</small>
                      </strong>
                    </button>
                  ))}
                </div>
                {slot && (
                  <CheckoutForm
                    key={slot.id}
                    slotId={slot.id}
                    slotLabel={label}
                    carName={`${car.make} ${car.model}`}
                    priceMonthly={Number(slot.priceMonthly)}
                    priceWeekly={Number(slot.priceWeekly)}
                    mockupData={mockup?.fabricJson}
                    mockupUrl={mockup?.previewUrl}
                  />
                )}
                <div className="panel form-stack">
                  <h3>
                    {t(
                      "Интересно вашей компании?",
                      "Компанияңызға қызықты ма?",
                      "Interested for your company?",
                    )}
                  </h3>
                  <p className="fine-print">
                    {t(
                      "Нажимая кнопку, вы разрешаете показать владельцу название вашей компании и дату интереса. Контактный email публично не раскрывается.",
                      "Батырманы басу арқылы иесіне компания атауы мен қызығушылық күнін көрсетуге рұқсат бересіз. Email жарияланбайды.",
                      "By clicking, you allow the owner to see your company name and the date of interest. Your email is not made public.",
                    )}
                  </p>
                  <button
                    className="outline-button"
                    disabled={interest || busy}
                    onClick={shareInterest}
                  >
                    {interest
                      ? t(
                          "Интерес передан владельцу",
                          "Қызығушылық иесіне жіберілді",
                          "Interest shared with owner",
                        )
                      : t(
                          "Сообщить об интересе",
                          "Қызығушылықты білдіру",
                          "Share my interest",
                        )}
                  </button>
                </div>
                {error && (
                  <p className="form-error" role="alert">
                    {<ErrorMessage message={error} />}
                  </p>
                )}
              </section>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
