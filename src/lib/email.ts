import nodemailer from "nodemailer";
export function emailReady() {
  return Boolean(
    process.env.EMAIL_FROM &&
      (process.env.RESEND_API_KEY ||
        (process.env.SMTP_HOST &&
          process.env.SMTP_USER &&
          process.env.SMTP_PASSWORD)),
  );
}
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  id?: string,
) {
  if (!emailReady()) throw new Error("EMAIL_NOT_CONFIGURED");
  if (process.env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(12000),
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        ...(id ? { "Idempotency-Key": id } : {}),
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [to],
        subject,
        text,
      }),
    });
    if (!response.ok) throw new Error(`EMAIL_PROVIDER_${response.status}`);
    return;
  }
  const port = Number(process.env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 12000,
    socketTimeout: 12000,
  });
  await transport.sendMail({ from: process.env.EMAIL_FROM, to, subject, text });
}
