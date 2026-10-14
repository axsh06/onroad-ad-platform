"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/platform/Shell";
import { useLocale } from "@/components/platform/Locale";
import { Inventory } from "@/components/platform/Inventory";
import { CarModel } from "@/components/platform/CarModel";
const faqs: [string, string, string, string, string, string][] = [
  [
    "Как автомобиль попадает в каталог?",
    "Автомобиль каталогқа қалай кіреді?",
    "How does a car get listed?",
    "Владелец подтверждает email, заполняет данные и загружает фотографии. Администратор проверяет автомобиль и доступные зоны. Только после одобрения он появляется в каталоге и калькуляторе.",
    "Иесі email мекенжайын растап, деректер мен фотосуреттерді жүктейді. Әкімші автомобиль мен аймақтарды тексереді. Мақұлданғаннан кейін ғана ол каталог пен калькуляторда көрінеді.",
    "The owner verifies their email and submits vehicle details and photos. An administrator reviews the car and placements. Approved cars appear in both the catalog and planner.",
  ],
  [
    "Что делать, если нужны новые фотографии?",
    "Жаңа фотосуреттер қажет болса не істеу керек?",
    "What if more photos are requested?",
    "В кабинете появится комментарий администратора. Приложите дополнительные фотографии, напишите пояснение и отправьте заявку повторно. История обсуждения сохранится.",
    "Кабинетте әкімшінің пікірі пайда болады. Қосымша фотосуреттерді, түсініктемені қосып, өтінімді қайта жіберіңіз. Хабарламалар тарихы сақталады.",
    "Read the administrator’s feedback in your dashboard, add photos and a reply, then resubmit. Your review history is preserved.",
  ],
  [
    "Нужно ли менять маршруты?",
    "Бағыттарды өзгерту керек пе?",
    "Do I need to change my routes?",
    "Укажите реальные районы и привычные поездки. Дополнительные маршруты, пробег и отчётность обсуждаются до начала кампании и фиксируются в договоре.",
    "Нақты аудандар мен күнделікті бағыттарды көрсетіңіз. Қосымша бағыттар, жүріс және есептілік науқан алдында келісіліп, шартта жазылады.",
    "List your actual areas and normal routes. Any extra routes, mileage or reporting obligations are agreed before the campaign and included in the contract.",
  ],
  [
    "Сколько можно заработать?",
    "Қанша табыс табуға болады?",
    "How much can I earn?",
    "Фиксированного гарантированного дохода нет. Стоимость зависит от автомобиля, зоны, срока и условий кампании. Калькулятор показывает предварительную стоимость для компании; выплата владельцу согласуется отдельно.",
    "Кепілдендірілген тұрақты табыс жоқ. Баға көлікке, аймаққа, мерзімге және науқанға байланысты. Калькулятор компания үшін алдын ала бағаны көрсетеді; иесінің төлемі бөлек келісіледі.",
    "There is no guaranteed income. Pricing depends on the car, placement, duration and campaign. The planner estimates the company’s cost; the owner’s payout is agreed separately.",
  ],
  [
    "Кто устанавливает и снимает наклейки?",
    "Жапсырманы кім орнатады және алып тастайды?",
    "Who installs and removes the decals?",
    "Исполнитель, материал, сроки монтажа, снятие и ответственность за возможное повреждение покрытия согласуются письменно. До установки фиксируется состояние кузова и утверждается макет.",
    "Орындаушы, материал, орнату және алып тастау мерзімі, жабынның зақымдануына жауапкершілік жазбаша келісіледі. Орнатуға дейін кузовтың күйі мен макет бекітіледі.",
    "The installer, material, installation and removal schedule, and responsibility for paint damage are agreed in writing. The vehicle’s condition is documented and the artwork approved first.",
  ],
  [
    "Какие документы нужны для размещения?",
    "Жарнама үшін қандай құжаттар керек?",
    "What paperwork is needed?",
    "Перед запуском стороны оформляют договор с собственником или уполномоченным владельцем автомобиля. В нём указывают зоны, срок, стоимость, выплаты, требования к макету и порядок прекращения размещения. При необходимости полномочия владельца проверяются отдельно.",
    "Іске қосу алдында меншік иесімен немесе уәкілетті иеленушімен шарт жасалады. Онда аймақтар, мерзім, баға, төлем, макет талаптары және тоқтату тәртібі көрсетіледі. Қажет болса, өкілеттік бөлек тексеріледі.",
    "Before launch, the parties sign an agreement with the owner or authorized vehicle holder, covering placements, duration, price, payouts, artwork requirements and termination. Authority to use the vehicle is checked where needed.",
  ],
  [
    "Можно ли наклеивать рекламу на стекло?",
    "Әйнекке жарнама жапсыруға бола ма?",
    "Can ads go on the windows?",
    "Стекло не включено в стандартные зоны. Каждый такой вариант требует отдельной проверки обзорности, безопасности и действующих требований. Номера, световые приборы и важные для обзора участки закрывать нельзя. Согласование в интерфейсе само по себе не является юридическим разрешением.",
    "Әйнек стандартты аймақтарға кірмейді. Әр нұсқа көріну, қауіпсіздік және қолданыстағы талаптар бойынша бөлек тексеріледі. Нөмірлерді, шамдарды және көрінуге маңызды бөліктерді жабуға болмайды. Интерфейстегі келісім заңды рұқсат емес.",
    "Windows are excluded from standard placements. Any window placement needs a separate visibility, safety and regulatory review. Plates, lights and required sightlines must remain clear. An interface approval is not a legal permit.",
  ],
  [
    "Есть ли ограничения для рекламы?",
    "Жарнамаға шектеулер бар ма?",
    "Are there restrictions on advertising?",
    "Да. Содержание рекламы, используемые изображения и товарные знаки проверяются до печати. Для регулируемых товаров и услуг могут действовать дополнительные ограничения. Компания должна иметь права на переданный макет. Правила проверяются по законодательству Казахстана для конкретной кампании.",
    "Иә. Жарнама мазмұны, суреттер мен тауар белгілері басып шығарудан бұрын тексеріледі. Кейбір тауарлар мен қызметтерге қосымша шектеулер бар. Компания макетке құқық иеленуі керек. Әр науқан Қазақстан заңнамасына сай тексеріледі.",
    "Yes. Content, images and trademarks are reviewed before printing. Regulated products and services may face additional restrictions. Companies must hold the rights to their artwork. Each campaign is reviewed under Kazakhstan law.",
  ],
  [
    "Когда списываются деньги?",
    "Ақша қашан алынады?",
    "When am I charged?",
    "Отправка запроса на сайте не списывает деньги. Команда сначала согласует условия и наличие места. Оплата и выплаты оформляются отдельно по договору; онлайн-эквайринг пока не подключён.",
    "Сайтта өтінім жіберу ақша алмайды. Алдымен шарттар мен орынның қолжетімділігі келісіледі. Төлемдер шарт бойынша бөлек жүргізіледі; онлайн төлем әзірге қосылмаған.",
    "Submitting a request does not charge you. Availability and terms are agreed first. Payments and payouts are handled separately under contract; online payments are not connected yet.",
  ],
  [
    "Кто видит мои данные?",
    "Менің деректерімді кім көреді?",
    "Who can see my information?",
    "До одобрения фотографии доступны владельцу и администраторам. После одобрения фотографии размещаются в каталоге. Контактные данные не публикуются в карточке. Название компании передаётся владельцу только при явном подтверждении интереса.",
    "Мақұлдауға дейін фотосуреттер иесі мен әкімшілерге ғана көрінеді. Мақұлданған фотосуреттер каталогқа шығады. Байланыс деректері карточкада жарияланбайды. Компания атауы қызығушылықты нақты растағаннан кейін ғана иесіне көрсетіледі.",
    "Photos are private to the owner and administrators until approval, then appear in the catalog. Contact details are not published on vehicle cards. A company’s name is shared with the owner only after it explicitly expresses interest.",
  ],
];
export default function HomePage() {
  const { t } = useLocale();
  const [zone, setZone] = useState("LEFT_DOOR");
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.08 },
    );
    els.forEach((el) => {
      el.classList.add("reveal-ready");
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return (
    <div className="platform light-site">
      <Header />
      <main>
        <section className="new-hero editorial-hero">
          <img
            className="editorial-backdrop"
            src="/photos/hero-w223-astana.png"
            alt="Mercedes-Benz S-Class W223 с макетом ONROAD"
            fetchPriority="high"
          />
          <div className="sky-motion" aria-hidden="true" />
          <div className="hero-heading">
            <p className="eyebrow">ONROAD / ASTANA, KZ</p>
            <h1>
              {t("ВАШ БРЕНД.", "СІЗДІҢ БРЕНД.", "YOUR BRAND.")}
              <br />
              {t("В ДВИЖЕНИИ.", "ҚОЗҒАЛЫСТА.", "IN MOTION.")}
            </h1>
            <p>
              {t(
                "Реальные автомобили. Привычные маршруты. Новые возможности для вашего бренда.",
                "Нақты автомобильдер. Күнделікті бағыттар. Брендіңіз үшін жаңа мүмкіндіктер.",
                "Real cars. Everyday routes. New possibilities for your brand.",
              )}
            </p>
            <div className="hero-buttons">
              <Link className="solid-button" href="/catalog">
                {t("Выбрать автомобиль", "Автомобиль таңдау", "Find a car")}
              </Link>
              <Link className="outline-button" href="/seller/register">
                {t(
                  "Предложить свой автомобиль",
                  "Автомобиль ұсыну",
                  "List your car",
                )}
              </Link>
            </div>
          </div>
          <div className="editorial-caption">
            <span>ONROAD · ASTANA, KZ</span>
            <span>
              {t(
                "Mercedes-Benz W223 · визуализация бренда",
                "Mercedes-Benz W223 · бренд визуализациясы",
                "Mercedes-Benz W223 · brand visualization",
              )}
            </span>
          </div>
        </section>
        <section className="city-strip" id="cities">
          <span>
            {t("География запуска", "Іске қосу қалалары", "Where we launch")}
          </span>
          <strong>● {t("Астана", "Астана", "Astana")}</strong>
          <span>
            {t("Алматы — скоро", "Алматы — жақында", "Almaty — coming soon")}
          </span>
          <span>
            {t(
              "Шымкент — скоро",
              "Шымкент — жақында",
              "Shymkent — coming soon",
            )}
          </span>
        </section>
        <section className="section-wrap reveal" id="how">
          <p className="eyebrow">
            01 / {t("КАК ЭТО РАБОТАЕТ", "ҚАЛАЙ ЖҰМЫС ІСТЕЙДІ", "HOW IT WORKS")}
          </p>
          <div className="section-title">
            <h2>
              {t(
                "Город едет.\nБренд видят.",
                "Қала қозғалады.\nБренд көрінеді.",
                "The city moves.\nYour brand gets noticed.",
              )}
            </h2>
            <p>
              {t(
                "Соединяем компании и владельцев автомобилей. Каждый автомобиль, макет и зона проходят согласование.",
                "Компаниялар мен автомобиль иелерін байланыстырамыз. Әр автомобиль, макет және аймақ келісіледі.",
                "Connecting companies with car owners. Every car, design and placement is reviewed.",
              )}
            </p>
          </div>
          <div className="process-grid">
            {[
              [
                t("Создайте аккаунт", "Аккаунт жасаңыз", "Create an account"),
                t(
                  "Выберите роль и подтвердите почту.",
                  "Рөлді таңдап, поштаңызды растаңыз.",
                  "Choose your role and verify your email.",
                ),
              ],
              [
                t(
                  "Добавьте или выберите авто",
                  "Авто қосыңыз немесе таңдаңыз",
                  "List or select a car",
                ),
                t(
                  "В каталог попадают только проверенные заявки.",
                  "Каталогқа тек тексерілген өтінімдер түседі.",
                  "Only approved vehicles enter the catalog.",
                ),
              ],
              [
                t(
                  "Согласуйте размещение",
                  "Орналастыруды келісіңіз",
                  "Agree on the placement",
                ),
                t(
                  "Зона, макет, срок и стоимость — до начала кампании.",
                  "Аймақ, макет, мерзім және баға науқанға дейін келісіледі.",
                  "Placement, artwork, duration and price are agreed first.",
                ),
              ],
              [
                t(
                  "Запускайте кампанию",
                  "Науқанды бастаңыз",
                  "Launch the campaign",
                ),
                t(
                  "Установка, отчётность и выплаты по договору.",
                  "Орнату, есеп және төлем шарт бойынша.",
                  "Installation, reporting and payouts follow the contract.",
                ),
              ],
            ].map(([title, body], i) => (
              <article key={i}>
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section-wrap reveal" id="cars">
          <p className="eyebrow">
            02 /{" "}
            {t(
              "ПРОВЕРЕННЫЕ АВТОМОБИЛИ",
              "ТЕКСЕРІЛГЕН АВТОМОБИЛЬДЕР",
              "APPROVED VEHICLES",
            )}
          </p>
          <div className="section-title">
            <h2>
              {t(
                "Автомобили,\nкоторые замечают.",
                "Көзге түсетін\nавтомобильдер.",
                "Cars that\nget noticed.",
              )}
            </h2>
            <Link href="/catalog" className="outline-button">
              {t("Открыть каталог", "Каталогты ашу", "Explore the catalog")}
            </Link>
          </div>
          <Inventory limit={3} />
        </section>
        <section className="placement-section reveal">
          <div className="section-wrap placement-grid">
            <div>
              <p className="eyebrow">
                03 / {t("РАЗМЕЩЕНИЕ", "ОРНАЛАСТЫРУ", "PLACEMENTS")}
              </p>
              <h2>
                {t(
                  "Посмотрите\nсо всех сторон.",
                  "Барлық жағынан\nқараңыз.",
                  "See every\nangle.",
                )}
              </h2>
              <p>
                {t(
                  "Две боковые двери, капот и задняя часть кузова. Вращайте модель и выбирайте зону.",
                  "Екі бүйір есік, капот және кузовтың артқы бөлігі. Модельді айналдырып, аймақты таңдаңыз.",
                  "Two side doors, the hood and the rear body panel. Rotate the model and choose a placement.",
                )}
              </p>
              <Link href="/planner" className="solid-button">
                {t(
                  "Рассчитать кампанию",
                  "Науқанды есептеу",
                  "Plan a campaign",
                )}
              </Link>
            </div>
            <CarModel selected={zone} onSelect={setZone} />
          </div>
        </section>
        <section className="movement-section reveal" id="for-brands">
          <div className="movement-photo">
            <img
              src="/photos/mercedes-s-class.png"
              alt="Mercedes-Benz S-Class"
              loading="lazy"
            />
            <span>
              ONROAD / {t("В ВАШЕМ ГОРОДЕ", "СІЗДІҢ ҚАЛАҢЫЗДА", "IN YOUR CITY")}
            </span>
          </div>
          <div>
            <p className="eyebrow">
              04 / {t("ДЛЯ КОМПАНИЙ", "КОМПАНИЯЛАРҒА", "FOR BRANDS")}
            </p>
            <h2>
              {t(
                "Быть частью\nдвижения.",
                "Қозғалыстың\nбір бөлігі болу.",
                "Be part of\nthe movement.",
              )}
            </h2>
            <p>
              {t(
                "Выберите реальные автомобили, посмотрите доступные места и сохраните расчёт кампании. В личном кабинете — ваши запросы и их статусы.",
                "Нақты автомобильдерді таңдап, бос орындарды көріп, науқан есебін сақтаңыз. Жеке кабинетте өтінімдер мен олардың мәртебелері бар.",
                "Choose real cars, explore placements and save your estimate. Your account keeps every request and its status in one place.",
              )}
            </p>
            <Link className="solid-button" href="/buyer/register">
              {t(
                "Создать аккаунт компании",
                "Компания аккаунтын жасау",
                "Create a company account",
              )}
            </Link>
          </div>
        </section>
        <section className="section-wrap reveal" id="faq">
          <p className="eyebrow">05 / FAQ</p>
          <div className="faq-grid">
            <h2>
              {t(
                "Всё, что\nважно знать.",
                "Білуіңіз\nкерек нәрселер.",
                "Good to know\nbefore you start.",
              )}
            </h2>
            <div>
              {faqs.map(([ru, kk, en, ar, ak, ae], i) => (
                <details key={i}>
                  <summary>
                    {t(ru, kk, en)}
                    <span>+</span>
                  </summary>
                  <p>{t(ar, ak, ae)}</p>
                </details>
              ))}
              <p className="legal-reference">
                {t(
                  "Правовая основа: Закон РК «О рекламе», статья 12. Условия конкретного размещения проверяются отдельно.",
                  "Құқықтық негіз: ҚР «Жарнама туралы» заңы, 12-бап. Нақты орналастыру шарттары бөлек тексеріледі.",
                  "Legal reference: Kazakhstan’s Law on Advertising, Article 12. Each placement is reviewed separately.",
                )}{" "}
                <a
                  href="https://adilet.zan.kz/rus/docs/Z030000508_"
                  target="_blank"
                  rel="noreferrer"
                >
                  Әділет
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
