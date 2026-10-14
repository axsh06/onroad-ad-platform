import type { Metadata } from "next";
import "./globals.css";
import "./platform.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { LocaleProvider, type Locale } from "@/components/platform/Locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await cookies()).get("onroad_locale")?.value;
  if (locale === "en")
    return {
      title: "ONROAD — advertising on cars",
      description:
        "Connecting companies and car owners for vehicle advertising in Astana.",
    };
  if (locale === "kk")
    return {
      title: "ONROAD — автомобильдегі жарнама",
      description:
        "Астанада автомобильге жарнама орналастыру үшін компаниялар мен көлік иелерін байланыстырамыз.",
    };
  return {
    title: "ONROAD — реклама на автомобилях",
    description:
      "Соединяем компании и владельцев автомобилей для размещения рекламы в Астане.",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const account = session?.user
    ? { name: session.user.name, role: session.user.role }
    : null;
  const saved = (await cookies()).get("onroad_locale")?.value;
  const locale: Locale = saved === "kk" || saved === "en" ? saved : "ru";
  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0a0a0a] text-white antialiased">
        <LocaleProvider initial={locale} account={account}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
