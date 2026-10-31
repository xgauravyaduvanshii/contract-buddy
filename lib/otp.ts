import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";
import type { OtpPurpose } from "@prisma/client";

export function generateOtpCode(): string {
  // 6-digit, crypto-random
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function createOtp(opts: {
  userId: string;
  email: string;
  purpose: OtpPurpose;
  minutes?: number;
}) {
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + (opts.minutes ?? 15) * 60_000);
  await db.otpToken.create({
    data: { userId: opts.userId, email: opts.email, codeHash, purpose: opts.purpose, expiresAt },
  });
  return code;
}

export async function verifyOtp(opts: {
  email: string;
  code: string;
  purpose: OtpPurpose;
}): Promise<{ valid: boolean; otpId?: string; userId?: string; reason?: string }> {
  const otp = await db.otpToken.findFirst({
    where: { email: opts.email, purpose: opts.purpose, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return { valid: false, reason: "No active code" };
  if (otp.expiresAt < new Date()) return { valid: false, reason: "Code expired" };
  if (otp.attempts >= 5) return { valid: false, reason: "Too many attempts" };

  const match = await bcrypt.compare(opts.code, otp.codeHash);
  if (!match) {
    await db.otpToken.update({ where: { id: otp.id }, data: { attempts: otp.attempts + 1 } });
    return { valid: false, reason: "Incorrect code" };
  }
  return { valid: true, otpId: otp.id, userId: otp.userId };
}

export async function consumeOtp(otpId: string) {
  await db.otpToken.update({ where: { id: otpId }, data: { usedAt: new Date() } });
}
