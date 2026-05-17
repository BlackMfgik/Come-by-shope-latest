// src/services/email.ts
import { Resend } from "resend";
import { env } from "../env.js";

const resend = new Resend(env.EMAIL_PROVIDER_API_KEY);

export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string,
  userName: string,
): Promise<void> {
  const resetUrl = `${env.ALLOWED_ORIGIN}/reset-password?token=${resetToken}`;

  await resend.emails.send({
    from: env.EMAIL_FROM_ADDRESS,
    to: toEmail,
    subject: "Скидання пароля — Come by Shop",
    html: `
      <h2>Привіт, ${userName}!</h2>
      <p>Ви отримали цей лист тому що запросили скидання пароля.</p>
      <p>Натисніть на посилання нижче, щоб встановити новий пароль:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#222;color:#fff;text-decoration:none;border-radius:6px;">
        Скинути пароль
      </a>
      <p>Посилання дійсне протягом 1 години.</p>
      <p>Якщо ви не робили цього запиту — просто проігноруйте цей лист.</p>
    `,
  });
}

export async function sendTwoFactorEmail(
  toEmail: string,
  code: string,
): Promise<void> {
  // DEV режим: не надсилаємо реальний email, просто логуємо
  if (env.DEV_OTP) {
    console.log(`[DEV EMAIL 2FA] → ${toEmail}: код ${code}`);
    return;
  }

  await resend.emails.send({
    from: env.EMAIL_FROM_ADDRESS,
    to: toEmail,
    subject: "Підтвердження входу — Come by Shop",
    html: `
      <h2>Підтвердження входу</h2>
      <p>Хтось (сподіваємось, ви) входить у ваш акаунт Come by Shop з нового пристрою.</p>
      <p>Ваш одноразовий код:</p>
      <h1 style="font-size:48px;letter-spacing:12px;font-family:monospace;color:#009956;">${code}</h1>
      <p>Код дійсний протягом 10 хвилин.</p>
      <p>Якщо це не ви — негайно змініть пароль.</p>
    `,
  });
}

export async function sendEmailChangeCode(
  toEmail: string,
  code: string,
  userName: string,
): Promise<void> {
  await resend.emails.send({
    from: env.EMAIL_FROM_ADDRESS,
    to: toEmail,
    subject: "Підтвердження зміни email — Come by Shop",
    html: `
      <h2>Привіт, ${userName}!</h2>
      <p>Ваш код підтвердження для зміни email адреси:</p>
      <h1 style="font-size:40px;letter-spacing:8px;font-family:monospace;">${code}</h1>
      <p>Код дійсний протягом 10 хвилин.</p>
      <p>Якщо ви не робили цього запиту — проігноруйте цей лист.</p>
    `,
  });
}
