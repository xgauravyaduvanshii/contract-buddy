import { NextRequest } from "next/server";
import { verifyOtp } from "@/lib/otp";
import { ok, fail } from "@/lib/api";
import { verifyOtpSchema, firstZodError } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) return fail(firstZodError(parsed.error));

  const { valid, reason } = await verifyOtp({
    email: parsed.data.email.toLowerCase(),
    code: parsed.data.code,
    purpose: "PASSWORD_RESET",
  });
  if (!valid) return fail(reason ?? "Invalid code", 400);

  return ok({ verified: true });
}

