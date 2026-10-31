import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { createOtp, verifyOtp, consumeOtp } from "@/lib/otp";
import { sendTemplatedEmail } from "@/lib/mailer";

// Email change flow: user asks for a new email → OTP is sent to that address →
// user verifies → status VERIFIED → admin approves → email actually changes.

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return fail("Unauthorized", 401);
  }
  const body = await req.json().catch(() => ({}));

  // Step 1 — start a change request (sends OTP to the new address)
  if (typeof body.newEmail === "string" && body.newEmail.trim()) {
    const newEmail = body.newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return fail("Enter a valid email address");
    if (newEmail === user.email.toLowerCase()) return fail("That is already your email");
    const taken = await db.user.findUnique({ where: { email: newEmail } });
    if (taken) return fail("That email is already in use by another account");

    const code = await createOtp({ userId: user.id, email: newEmail, purpose: "EMAIL_CHANGE", minutes: 15 });
    const request = await db.emailChangeRequest.upsert({
      where: { userId: user.id },
      create: { userId: user.id, newEmail, status: "PENDING", expiresAt: new Date(Date.now() + 15 * 60_000) },
      update: { newEmail, status: "PENDING", expiresAt: new Date(Date.now() + 15 * 60_000) },
    });
    const sent = await sendTemplatedEmail({ to: newEmail, templateKey: "email_change_otp", variables: { otp: code, email: newEmail } });
    if (!sent.delivered) return fail(`The verification email could not be delivered: ${sent.reason}`, 502);
    return ok({ sent: true, requestId: request.id });
  }

  // Step 2 — verify the OTP
  if (typeof body.otp === "string" && body.otp.trim()) {
    const request = await db.emailChangeRequest.findUnique({ where: { userId: user.id } });
    if (!request || request.status === "APPROVED" || request.status === "REJECTED") {
      return fail("No active change request", 400);
    }
    const res = await verifyOtp({ email: request.newEmail, code: body.otp.trim(), purpose: "EMAIL_CHANGE" });
    if (!res.valid) return fail(res.reason || "Invalid code", 400);
    if (res.otpId) await consumeOtp(res.otpId);
    const updated = await db.emailChangeRequest.update({
      where: { id: request.id },
      data: { status: "VERIFIED" },
    });
    return ok({ status: updated.status });
  }

  return fail("Provide newEmail or otp");
}

// Current request state (for the settings UI)
export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return fail("Unauthorized", 401);
  }
  const request = await db.emailChangeRequest.findUnique({
    where: { userId: user.id },
    select: { id: true, newEmail: true, status: true, createdAt: true, updatedAt: true },
  });
  return ok({ request });
}

// Cancel a pending request
export async function DELETE() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return fail("Unauthorized", 401);
  }
  await db.emailChangeRequest.deleteMany({ where: { userId: user.id, status: { not: "APPROVED" } } });
  return ok({ ok: true });
}
