import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { verifyOtp, consumeOtp } from "@/lib/otp";
import { sendTemplatedEmail } from "@/lib/mailer";
import { ok, fail } from "@/lib/api";
import { resetSchema, firstZodError } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) return fail(firstZodError(parsed.error));

  const email = parsed.data.email.toLowerCase();
  const check = await verifyOtp({ email, code: parsed.data.code, purpose: "PASSWORD_RESET" });
  if (!check.valid || !check.otpId || !check.userId) {
    return fail(check.reason ?? "Invalid or expired code", 400);
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.user.update({ where: { id: check.userId }, data: { passwordHash } });
  await consumeOtp(check.otpId);

  await sendTemplatedEmail({
    to: email,
    templateKey: "password_changed",
    variables: {},
  }).catch(() => {});

  return ok({ reset: true });
}

