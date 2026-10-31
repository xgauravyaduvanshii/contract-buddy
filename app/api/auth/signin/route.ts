import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, startSession, toPublicUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { signinSchema, firstZodError } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = signinSchema.safeParse(body);
  if (!parsed.success) return fail(firstZodError(parsed.error));

  const email = parsed.data.email.toLowerCase();
  const user = await db.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash) return fail("Invalid email or password", 401);
  if (user.suspended) return fail("This account is suspended", 403);

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return fail("Invalid email or password", 401);

  await startSession(toPublicUser(user));
  return ok({ user: toPublicUser(user) });
}

