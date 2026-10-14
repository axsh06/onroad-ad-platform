import { createHmac, randomInt } from "node:crypto";
import { prisma } from "./prisma";
import { sendEmail } from "./email";
export function codeHash(userId: string, code: string) {
  if (!process.env.NEXTAUTH_SECRET) throw new Error("AUTH_NOT_CONFIGURED");
  return createHmac("sha256", process.env.NEXTAUTH_SECRET)
    .update(`${userId}:${code}`)
    .digest("hex");
}
export async function rateLimit(identity: string, limit = 5, seconds = 3600) {
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const key = createHmac(
    "sha256",
    process.env.NEXTAUTH_SECRET || "local-rate-limit",
  )
    .update(`${identity}:${bucket}`)
    .digest("hex");
  const row = await prisma.rateBucket.upsert({
    where: { key },
    create: { key, expiresAt: new Date((bucket + 1) * seconds * 1000) },
    update: { count: { increment: 1 } },
  });
  return row.count <= limit;
}
export async function issueCode(user: {
  id: string;
  email: string;
  locale: string;
}) {
  const code = String(randomInt(100000, 1000000));
  const hash = codeHash(user.id, code);
  await prisma.emailChallenge.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      codeHash: hash,
      expiresAt: new Date(Date.now() + 600000),
    },
    update: {
      codeHash: hash,
      expiresAt: new Date(Date.now() + 600000),
      attempts: 0,
      sentAt: new Date(),
    },
  });
  const lines =
    user.locale === "en"
      ? [
          `Your ONROAD verification code: ${code}`,
          "The code expires in 10 minutes. Do not share it. If you did not request it, ignore this email.",
        ]
      : user.locale === "kk"
        ? [
            `ONROAD растау коды: ${code}`,
            "Код 10 минут жарамды. Оны ешкімге бермеңіз. Сұрау жібермесеңіз, хатты елемеңіз.",
          ]
        : [
            `Код подтверждения ONROAD: ${code}`,
            "Код действует 10 минут. Никому его не сообщайте. Если вы не запрашивали код, проигнорируйте письмо.",
          ];
  await sendEmail(
    user.email,
    "ONROAD · Email verification",
    lines.join("\n\n"),
  );
}
