"use client";
import { ErrorMessage } from "@/components/platform/ErrorMessage";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Header, Footer } from "./Shell";
import { useLocale } from "./Locale";
export function AuthForm({
  role,
  verify = false,
  emailConfigured = true,
}: {
  role?: "SELLER" | "BUYER";
  verify?: boolean;
  emailConfigured?: boolean;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [code, setCode] = useState("");
  const [step, setStep] = useState(verify ? "verify" : "form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const change = (key: keyof typeof form, value: string) =>
    setForm({ ...form, [key]: value });
  async function resend() {
    if (busy || !emailConfigured) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setNotice(
        t(
          "Если данные верны, новый код отправлен. Проверьте входящие и спам.",
          "Деректер дұрыс болса, жаңа код жіберілді. Кіріс пен спамды тексеріңіз.",
          "If your details match, a new code has been sent. Check your inbox and spam.",
        ),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t("Ошибка отправки", "Жіберу қатесі", "Could not send"),
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || (role && step === "form" && !emailConfigured)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (step === "verify") {
        const r = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, code }),
        });
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
      } else if (role) {
        const r = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, role, locale, consent: true }),
        });
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        setStep("verify");
        setNotice(
          d.error
            ? t(
                "Аккаунт создан, но письмо не отправлено. Запросите новый код.",
                "Аккаунт жасалды, бірақ хат жіберілмеді. Жаңа код сұраңыз.",
                "Account created, but email was not sent. Request a new code.",
              )
            : t(
                "Мы отправили код на вашу почту.",
                "Код поштаңызға жіберілді.",
                "We sent a code to your email.",
              ),
        );
        return;
      }
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        if (result.error === "LOGIN_RATE_LIMIT")
          throw Error(
            t(
              "Слишком много попыток входа. Повторите через 15 минут.",
              "Кіру әрекеті тым көп. 15 минуттан кейін қайталаңыз.",
              "Too many sign-in attempts. Try again in 15 minutes.",
            ),
          );
        if (result.error === "EMAIL_NOT_VERIFIED") {
          setStep("verify");
          setNotice(
            t(
              "Подтвердите почту. При необходимости запросите новый код.",
              "Поштаңызды растаңыз. Қажет болса, жаңа код сұраңыз.",
              "Verify your email. Request a new code if needed.",
            ),
          );
          return;
        }
        throw Error(
          t(
            "Проверьте email и пароль.",
            "Email мен құпиясөзді тексеріңіз.",
            "Check your email and password.",
          ),
        );
      }
      router.push(role === "SELLER" ? "/dashboard/add-car" : "/dashboard");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t(
              "Не удалось продолжить",
              "Жалғастыру мүмкін болмады",
              "Could not continue",
            ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="platform light-site">
      <Header />
      <main className="account-form-wrap">
        <div className="account-form-heading">
          <p className="eyebrow">ONROAD / ASTANA, KZ</p>
          <h1>
            {step === "verify"
              ? t(
                  "Подтвердите почту",
                  "Поштаңызды растаңыз",
                  "Verify your email",
                )
              : role === "SELLER"
                ? t("Кабинет владельца", "Иесінің кабинеті", "Owner account")
                : role === "BUYER"
                  ? t(
                      "Кабинет компании",
                      "Компания кабинеті",
                      "Company account",
                    )
                  : t("С возвращением", "Қош келдіңіз", "Welcome back")}
          </h1>
          <p>
            {role === "SELLER"
              ? t(
                  "После подтверждения почты добавьте автомобиль на проверку.",
                  "Поштаңызды растағаннан кейін автомобильді тексеруге қосыңыз.",
                  "After verifying your email, submit your car for review.",
                )
              : t(
                  "Ваши автомобили, размещения и запросы — в одном месте.",
                  "Автомобильдер, орналастырулар және өтінімдер бір жерде.",
                  "Your cars, placements and requests in one place.",
                )}
          </p>
        </div>
        <form className="panel form-stack" onSubmit={submit}>
          {role && step === "form" && (
            <>
              <label>
                {t("Ваше имя", "Атыңыз", "Your name")}
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => change("name", e.target.value)}
                />
              </label>
              {role === "BUYER" && (
                <label>
                  {t("Название компании", "Компания атауы", "Company name")}
                  <input
                    required
                    maxLength={120}
                    value={form.companyName}
                    onChange={(e) => change("companyName", e.target.value)}
                  />
                </label>
              )}
              <label>
                {t("Телефон", "Телефон", "Phone")}
                <input
                  type="tel"
                  maxLength={32}
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => change("phone", e.target.value)}
                />
              </label>
            </>
          )}
          <label>
            Email
            <input
              required
              type="email"
              maxLength={254}
              autoComplete="email"
              value={form.email}
              onChange={(e) => change("email", e.target.value)}
            />
          </label>
          <label>
            {t(
              "Пароль — от 8 символов",
              "Құпиясөз — кемінде 8 таңба",
              "Password — at least 8 characters",
            )}
            <input
              required
              type="password"
              minLength={8}
              maxLength={100}
              autoComplete={role ? "new-password" : "current-password"}
              value={form.password}
              onChange={(e) => change("password", e.target.value)}
            />
          </label>
          {step === "verify" && (
            <>
              <label>
                {t("Код из письма", "Хаттағы код", "Email code")}
                <input
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </label>
              <p className="fine-print">
                {t(
                  "Код действует 10 минут. Не сообщайте его другим.",
                  "Код 10 минут жарамды. Оны ешкімге бермеңіз.",
                  "The code expires in 10 minutes. Do not share it.",
                )}
              </p>
              <button
                className="text-button"
                type="button"
                disabled={
                  busy ||
                  !emailConfigured ||
                  !form.email ||
                  form.password.length < 8
                }
                onClick={resend}
              >
                {t("Отправить новый код", "Жаңа код жіберу", "Send a new code")}
              </button>
            </>
          )}
          {role && step === "form" && (
            <label className="checkbox-label">
              <input required type="checkbox" />
              <span>
                {t(
                  "Согласен с обработкой данных для регистрации и связи со мной.",
                  "Тіркелу және байланыс үшін деректерді өңдеуге келісемін.",
                  "I consent to processing my data for registration and communication.",
                )}{" "}
                <Link href="/privacy">
                  {t(
                    "Политика конфиденциальности",
                    "Құпиялылық саясаты",
                    "Privacy policy",
                  )}
                </Link>
              </span>
            </label>
          )}
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
          <button
            className="solid-button"
            disabled={
              busy || Boolean(role && step === "form" && !emailConfigured)
            }
          >
            {busy
              ? t("Подождите…", "Күтіңіз…", "Please wait…")
              : step === "verify"
                ? t("Подтвердить и войти", "Растап кіру", "Verify and sign in")
                : role
                  ? t(
                      "Получить код на почту",
                      "Поштаға код алу",
                      "Send verification code",
                    )
                  : t("Войти", "Кіру", "Sign in")}
          </button>
          <p className="fine-print">
            <Link href={role ? "/login" : "/register"}>
              {role
                ? t(
                    "Уже есть аккаунт? Войти",
                    "Аккаунтыңыз бар ма? Кіру",
                    "Already registered? Sign in",
                  )
                : t("Создать аккаунт", "Аккаунт жасау", "Create an account")}
            </Link>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}
