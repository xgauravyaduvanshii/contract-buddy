import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { db } from "./db";
import { env } from "./env";
import { getSmtpConfig } from "./settings";
import { DEFAULT_TEMPLATES, interpolate } from "./email-templates";

let cached: { key: string; t: Transporter } | null = null;

async function getTransporter(): Promise<Transporter | null> {
  const cfg = await getSmtpConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) return null;
  const key = `${cfg.host}:${cfg.port}:${cfg.secure}:${cfg.user}`;
  if (!cached || cached.key !== key) {
    cached = {
      key,
      t: nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: { user: cfg.user, pass: cfg.pass },
      }),
    };
  }
  return cached.t;
}

export type SendArgs = {
  to: string;
  templateKey: string;
  variables?: Record<string, string>;
};

export type SendResult = { delivered: boolean; reason?: string };

/**
 * Render + send a templated email. The DB row (if the admin edited it) wins
 * over the built-in default. When SMTP is unconfigured the rendered email is
 * logged to the console so local flows (OTP, welcome) still work end-to-end.
 */
export async function sendTemplatedEmail({
  to,
  templateKey,
  variables = {},
}: SendArgs): Promise<SendResult> {
  const vars: Record<string, string> = { appUrl: env.appUrl, ...variables };

  const dbTemplate = await db.emailTemplate.findUnique({
    where: { key: templateKey },
  });
  const fallback = DEFAULT_TEMPLATES.find((t) => t.key === templateKey);

  if (!dbTemplate && !fallback) {
    return { delivered: false, reason: `Unknown template: ${templateKey}` };
  }

  const subject = interpolate(
    dbTemplate?.subject ?? fallback!.subject,
    vars,
  );
  const html = interpolate(dbTemplate?.html ?? fallback!.html, vars);
  const text = interpolate(
    dbTemplate?.text ?? fallback?.text ?? subject,
    vars,
  );

  const t = await getTransporter();
  if (!t) {
    console.log(
      `\n📧 [dev] Email not sent (SMTP unconfigured) → ${to}\nSubject: ${subject}\n(OTP/vars: ${JSON.stringify(
        variables,
      )})\n`,
    );
    return { delivered: false, reason: "smtp_unconfigured" };
  }

  const cfg = await getSmtpConfig();
  try {
    await t.sendMail({ from: cfg.from, to, subject, html, text });
  } catch (e) {
    console.error(`📧 send failed → ${to}:`, (e as Error).message?.slice(0, 200));
    return { delivered: false, reason: (e as Error).message?.slice(0, 200) || "send failed" };
  }
  return { delivered: true };
}
