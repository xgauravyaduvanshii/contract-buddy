import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { db } from "./db";
import { env, isSmtpConfigured } from "./env";
import { DEFAULT_TEMPLATES, interpolate } from "./email-templates";

let transporter: Transporter | null = null;
function getTransporter(): Transporter | null {
  if (!isSmtpConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
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

  const t = getTransporter();
  if (!t) {
    console.log(
      `\n📧 [dev] Email not sent (SMTP unconfigured) → ${to}\nSubject: ${subject}\n(OTP/vars: ${JSON.stringify(
        variables,
      )})\n`,
    );
    return { delivered: false, reason: "smtp_unconfigured" };
  }

  await t.sendMail({ from: env.smtp.from, to, subject, html, text });
  return { delivered: true };
}
