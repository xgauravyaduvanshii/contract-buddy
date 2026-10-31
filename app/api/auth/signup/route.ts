import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, startSession, toPublicUser } from "@/lib/auth";
import { sendTemplatedEmail } from "@/lib/mailer";
import { ok, fail } from "@/lib/api";
import { signupSchema, firstZodError } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return fail(firstZodError(parsed.error));

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return fail("An account with this email already exists", 409);

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: { name, email: normalizedEmail, passwordHash, provider: "CREDENTIALS" },
  });

  await startSession(toPublicUser(user));

  await db.notification.create({
    data: {
      userId: user.id,
      title: "Welcome to ContractBuddy",
      body: "Create your first project or contract from the dashboard to get started.",
      type: "SYSTEM",
    },
  });

  await sendTemplatedEmail({
    to: normalizedEmail,
    templateKey: "welcome",
    variables: { name: name ?? "there", email: normalizedEmail },
  }).catch(() => {});

  return ok({ user: toPublicUser(user) }, { status: 201 });
}

