"use client";
import { useLocale } from "./Locale";
const messages: Record<string, [string, string]> = {
  "Отправка кодов временно недоступна. Попробуйте позже.": [
    "Код жіберу уақытша қолжетімсіз. Кейінірек қайталаңыз.",
    "Email verification is temporarily unavailable. Please try again later.",
  ],
  "Отправка кодов временно недоступна.": [
    "Код жіберу уақытша қолжетімсіз.",
    "Email verification is temporarily unavailable.",
  ],
  "Аккаунт с таким email или телефоном уже существует.": [
    "Бұл email немесе телефонмен аккаунт бар.",
    "An account with this email or phone already exists.",
  ],
  "Проверьте поля формы.": [
    "Форма өрістерін тексеріңіз.",
    "Please check the form fields.",
  ],
  "Код неверен или истёк. Запросите новый.": [
    "Код қате немесе мерзімі өтті. Жаңасын сұраңыз.",
    "The code is invalid or expired. Request a new one.",
  ],
  "Код неверен или истёк.": [
    "Код қате немесе мерзімі өтті.",
    "The code is invalid or expired.",
  ],
  "Введите email и шестизначный код.": [
    "Email мен алты таңбалы кодты енгізіңіз.",
    "Enter your email and six-digit code.",
  ],
  "Подождите перед повторной отправкой.": [
    "Қайта жіберуден бұрын күтіңіз.",
    "Wait before requesting another code.",
  ],
  "Слишком много попыток. Попробуйте через час.": [
    "Әрекеттер тым көп. Бір сағаттан кейін қайталаңыз.",
    "Too many attempts. Try again in an hour.",
  ],
  "Лимит попыток. Повторите через час.": [
    "Әрекет шегіне жеттіңіз. Бір сағаттан кейін қайталаңыз.",
    "Attempt limit reached. Try again in an hour.",
  ],
  "Войдите как компания.": [
    "Компания ретінде кіріңіз.",
    "Sign in with a company account.",
  ],
  "Only buyers can create bookings": [
    "Өтінім жіберу үшін компания аккаунты қажет.",
    "A company account is required to request placements.",
  ],
  "Slot is already booked for the selected dates": [
    "Таңдалған күндерде орын бос емес.",
    "This placement is already booked for those dates.",
  ],
  "This slot is currently unavailable": [
    "Бұл орын қазір қолжетімсіз.",
    "This placement is currently unavailable.",
  ],
  "Выберите дату в течение следующего года.": [
    "Келесі жыл ішіндегі күнді таңдаңыз.",
    "Choose a date within the next year.",
  ],
  "Добавьте комментарий: от 10 до 2000 символов.": [
    "10–2000 таңбадан тұратын пікір қосыңыз.",
    "Add a message between 10 and 2,000 characters.",
  ],
  "Модель не сохранена. Нужен GLB 2.0 со встроенными текстурами, до 4 МБ.": [
    "Модель сақталмады. Кірістірілген текстурасы бар GLB 2.0 қажет, 4 МБ дейін.",
    "Model not saved. Use a self-contained GLB 2.0 up to 4 MB.",
  ],
  "Письмо не отправлено. Проверьте настройки почты.": [
    "Хат жіберілмеді. Пошта баптауларын тексеріңіз.",
    "Email was not sent. Check the email settings.",
  ],
};
export function ErrorMessage({ message }: { message: string }) {
  const { locale, t } = useLocale();
  if (locale === "ru") return <>{message}</>;
  const match = messages[message];
  return (
    <>
      {match
        ? match[locale === "kk" ? 0 : 1]
        : /[А-Яа-яЁё]/.test(message)
          ? t(
              message,
              "Әрекетті аяқтау мүмкін болмады. Деректерді тексеріп, қайта көріңіз.",
              "Could not complete this action. Check your details and try again.",
            )
          : message}
    </>
  );
}
