"use client";

import Link from "next/link";
import { Header, Footer } from "./Shell";
import { useLocale } from "./Locale";
import { privacySections, termsSections, type LegalText } from "./legal-copy";
import { PRIVACY_POLICY_VERSION } from "@/lib/legal-version";
import "./legal.css";

// Public contact explicitly supplied by the project owner for these documents.
const CONTACT_EMAIL = "onroad.kz@gmail.com";

export function LegalPage({ privacy = false }: { privacy?: boolean }) {
  const { t } = useLocale();
  const sections = privacy ? privacySections : termsSections;
  const translate = (text: LegalText) => t(...text);
  const title = privacy
    ? t("Политика конфиденциальности", "Құпиялылық саясаты", "Privacy policy")
    : t("Условия использования", "Пайдалану шарттары", "Terms of use");
  const highlights: LegalText[] = privacy
    ? [
        ["Публикация после модерации", "Модерациядан кейін жариялау", "Publication after review"],
        ["Контакты вне публичной карточки", "Байланыс деректері жария емес", "Contact details kept off listings"],
        ["Примерка в вашем браузере", "Өз браузеріңізде сынау", "Previews in your browser"],
      ]
    : [
        ["Проверка каждого автомобиля", "Әр көлікті тексеру", "Every vehicle is reviewed"],
        ["Согласование перед размещением", "Орналастыру алдында келісу", "Agreement before placement"],
        ["Расчёт стоимости в тенге", "Құнын теңгемен есептеу", "Estimates in tenge"],
      ];

  return (
    <div className="platform light-site legal-page">
      <Header />
      <main className="legal-main">
        <div className="legal-navigation">
          <Link href="/home">{t("Главная", "Басты бет", "Home")}</Link>
          <span aria-hidden="true">/</span>
          <span>{t("Документы", "Құжаттар", "Documents")}</span>
        </div>
        <nav className="legal-tabs" aria-label={t("Документы ONROAD", "ONROAD құжаттары", "ONROAD documents")}>
          <Link href="/privacy" aria-current={privacy ? "page" : undefined}>
            {t("Конфиденциальность", "Құпиялылық", "Privacy")}
          </Link>
          <Link href="/terms" aria-current={!privacy ? "page" : undefined}>
            {t("Условия использования", "Пайдалану шарттары", "Terms of use")}
          </Link>
        </nav>
        <header className="legal-intro">
          <p className="eyebrow">ONROAD / ASTANA, KZ</p>
          <h1>{title}</h1>
          <p className="legal-description">
            {privacy
              ? t(
                  "Какие данные нужны сервису, кто их видит и как управлять своей информацией.",
                  "Сервиске қандай деректер қажет, оларды кім көреді және өз ақпаратыңызды қалай басқаруға болады.",
                  "What information the service needs, who can see it and how to manage your data.",
                )
              : t(
                  "Понятные правила для владельцев автомобилей и компаний — от первой заявки до согласования размещения.",
                  "Көлік иелері мен компанияларға арналған түсінікті ережелер — алғашқы өтінімнен орналастыруды келісуге дейін.",
                  "Clear guidelines for vehicle owners and companies, from the first request to agreeing a placement.",
                )}
          </p>
          <p className="legal-revision">
            {t("Редакция от", "Нұсқа күні:", "Last updated")}{" "}
            <time dateTime={PRIVACY_POLICY_VERSION}>
              {t("14 октября 2026 года", "2026 жылғы 14 қазан", "14 October 2026")}
            </time>
          </p>
        </header>
        <ul className="legal-highlights">
          {highlights.map((item, index) => (
            <li key={index}><span aria-hidden="true">0{index + 1}</span>{translate(item)}</li>
          ))}
        </ul>
        <div className="legal-layout">
          <aside className="legal-contents">
            <p id="legal-contents-title" className="eyebrow">{t("На этой странице", "Осы бетте", "On this page")}</p>
            <nav aria-labelledby="legal-contents-title">
              <ol>
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{translate(section.title)}</a>
                  </li>
                ))}
                <li><a href="#contact"><span aria-hidden="true">11</span>{t("Связь с ONROAD", "ONROAD-пен байланыс", "Contact ONROAD")}</a></li>
              </ol>
            </nav>
          </aside>
          <article className="legal-body" aria-label={title}>
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="legal-section" aria-labelledby={`${section.id}-title`}>
                <div className="legal-section-heading">
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <h2 id={`${section.id}-title`}>{translate(section.title)}</h2>
                </div>
                {section.paragraphs?.map((paragraph, i) => <p key={i}>{translate(paragraph)}</p>)}
                {section.items && <ul>{section.items.map((item, i) => <li key={i}>{translate(item)}</li>)}</ul>}
                {section.source && <p className="legal-source"><a href={section.source.href} target="_blank" rel="noopener noreferrer">{translate(section.source.label)}</a></p>}
              </section>
            ))}
            <section id="contact" className="legal-section legal-contact" aria-labelledby="contact-title">
              <div className="legal-section-heading">
                <span aria-hidden="true">11</span>
                <h2 id="contact-title">{t("Связь с ONROAD", "ONROAD-пен байланыс", "Contact ONROAD")}</h2>
              </div>
              <p>{t(
                "По вопросам работы сервиса, заявок и обработки персональных данных напишите на рабочую почту ONROAD. Для исправления или удаления данных используйте тему «Персональные данные» и email, указанный при регистрации.",
                "Сервис жұмысы, өтінімдер және дербес деректерді өңдеу туралы сұрақтар бойынша ONROAD жұмыс поштасына жазыңыз. Деректерді түзету немесе жою үшін «Дербес деректер» тақырыбын және тіркелу кезінде көрсетілген email-ды пайдаланыңыз.",
                "For questions about the service, requests or personal data, write to ONROAD’s business email. To request correction or deletion, use the subject “Personal data” and the email address used for your account.",
              )}</p>
              <a className="legal-email" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              <p className="legal-location">{t("Астана, Казахстан", "Астана, Қазақстан", "Astana, Kazakhstan")}</p>
            </section>
            <div className="legal-related">
              <p>{t("Связанный документ", "Қатысты құжат", "Related document")}</p>
              <Link href={privacy ? "/terms" : "/privacy"}>
                {privacy
                  ? t("Условия использования ONROAD", "ONROAD пайдалану шарттары", "ONROAD Terms of use")
                  : t("Политика конфиденциальности ONROAD", "ONROAD құпиялылық саясаты", "ONROAD Privacy policy")}
              </Link>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
