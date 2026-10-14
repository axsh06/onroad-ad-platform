"use client";
import { createContext, useContext, useEffect, useState } from "react";
export type Locale = "ru" | "kk" | "en";
const valid = (v: unknown): v is Locale =>
  ["ru", "kk", "en"].includes(v as string);
const Context = createContext({
  account: null as { name: string; role: string } | null,
  locale: "ru" as Locale,
  setLocale: (_: Locale) => {},
  t: (ru: string, _kk: string, _en: string) => ru,
});
export function LocaleProvider({
  initial,
  account,
  children,
}: {
  initial: Locale;
  account: { name: string; role: string } | null;
  children: React.ReactNode;
}) {
  const [locale, update] = useState<Locale>(initial);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title =
      locale === "kk"
        ? "ONROAD — автомобильдегі жарнама"
        : locale === "en"
          ? "ONROAD — advertising on cars"
          : "ONROAD — реклама на автомобилях";
  }, [locale]);
  function setLocale(next: Locale) {
    update(next);
    document.documentElement.lang = next;
    document.cookie = `onroad_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    try {
      localStorage.setItem("onroad_locale", next);
    } catch {}
  }
  useEffect(() => {
    function sync(e: StorageEvent) {
      if (e.key === "onroad_locale" && valid(e.newValue)) setLocale(e.newValue);
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  return (
    <Context.Provider
      value={{
        account,
        locale,
        setLocale,
        t: (ru, kk, en) => (locale === "kk" ? kk : locale === "en" ? en : ru),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useLocale = () => useContext(Context);
export function Languages() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="language-switch" aria-label="Language">
      {(["ru", "kk", "en"] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          aria-pressed={locale === lang}
          onClick={() => setLocale(lang)}
        >
          {lang === "kk" ? "KZ" : lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
