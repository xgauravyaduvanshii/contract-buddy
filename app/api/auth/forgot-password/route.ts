import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createOtp } from "@/lib/otp";
import { sendTemplatedEmail } from "@/lib/mailer";
import { isSmtpConfigured } from "@/lib/env";
import { ok, fail } from "@/lib/api";
import { forgotSchema, firstZodError } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) return fail(firstZodError(parsed.error));

  const email = parsed.data.email.toLowerCase();
  const user = await db.user.findUnique({ where: { email } });

  // Always respond the same way to avoid account enumeration.
  if (!user) return ok({ sent: true });

  const code = await createOtp({ userId: user.id, email, purpose: "PASSWORD_RESET" });

  const result = await sendTemplatedEmail({
    to: email,
    templateKey: "password_reset_otp",
    variables: { otp: code, name: user.name ?? "there" },
  });

  // Dev convenience: when SMTP is not configured, surface the code so the
  // reset flow can be completed locally. Never do this in production.
  const devCode =
    !isSmtpConfigured && process.env.NODE_ENV !== "production" ? code : undefined;

  return ok({ sent: true, delivered: result.delivered, devCode });
}

