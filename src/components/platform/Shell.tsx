"use client";
import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Menu, X, UserRound } from "lucide-react";
import { Languages, useLocale } from "./Locale";
export function Header({ dark = false }: { dark?: boolean }) {
  const { t, account: user } = useLocale();
  const [open, setOpen] = useState(false);
  return (
    <header className={`platform-header ${dark ? "header-dark" : ""}`}>
      <Link href="/home" aria-label="ONROAD">
        <img
          src={dark ? "/onroad-logo.svg" : "/onroad-logo-dark.svg"}
          alt="ONROAD"
          width="188"
          height="36"
        />
      </Link>
      <nav className={open ? "is-open" : ""} onClick={() => setOpen(false)}>
        <Link href="/home#how">
          {t("Как это работает", "Қалай жұмыс істейді", "How it works")}
        </Link>
        <Link href="/catalog">{t("Автомобили", "Автомобильдер", "Cars")}</Link>
        <Link href="/planner">
          {t("Калькулятор", "Калькулятор", "Planner")}
        </Link>
        <Link href="/home#faq">FAQ</Link>
      </nav>
      <div className="header-controls">
        <Languages />
        {user ? (
          <Link className="account-link" href="/dashboard">
            <UserRound size={16} />
            <span>{user.name}</span>
          </Link>
        ) : (
          <Link className="solid-button small" href="/register">
            {t("Личный кабинет", "Жеке кабинет", "My account")}
          </Link>
        )}
        <button
          className="mobile-toggle"
          aria-label={t("Меню", "Мәзір", "Menu")}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="platform-footer">
      <div>
        <img src="/onroad-logo-dark.svg" width="188" height="36" alt="ONROAD" />
        <span>ASTANA, KZ</span>
        <p>
          {t(
            "Город едет. Бренд видят.",
            "Қала қозғалады. Бренд көрінеді.",
            "The city moves. Your brand gets noticed.",
          )}
        </p>
      </div>
      <div>
        <span>© ONROAD 2026</span>
        <Link href="/privacy">
          {t("Конфиденциальность", "Құпиялылық", "Privacy")}
        </Link>
        <Link href="/terms">{t("Условия", "Шарттар", "Terms")}</Link>
        <Link href="/home#cities">{t("Города", "Қалалар", "Cities")}</Link>
      </div>
    </footer>
  );
}
export function AccountActions() {
  const { t } = useLocale();
  return (
    <div className="account-actions">
      <Link href="/catalog">{t("Каталог", "Каталог", "Catalog")}</Link>
      <button onClick={() => void signOut({ callbackUrl: "/home" })}>
        {t("Выйти", "Шығу", "Sign out")}
      </button>
    </div>
  );
}
