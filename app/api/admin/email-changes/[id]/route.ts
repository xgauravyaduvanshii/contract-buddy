import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { sendTemplatedEmail } from "@/lib/mailer";

type Ctx = { params: Promise<{ id: string }> };

async function guard() {
  try {
    await requireAdmin();
    return null;
  } catch (e) {
    const s = (e as { status?: number }).status;
    return fail(s === 403 ? "Forbidden" : "Unauthorized", s || 401);
  }
}

// Body: { approve: boolean }
export async function POST(req: NextRequest, { params }: Ctx) {
  const admin = await guard();
  if (admin) return admin;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const approve = body.approve === true;

  const request = await db.emailChangeRequest.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!request) return fail("Not found", 404);
  if (request.status === "APPROVED" || request.status === "REJECTED") {
    return fail(`Request already ${request.status.toLowerCase()}`);
  }
  if (approve && request.status !== "VERIFIED") {
    return fail("The user has not verified the new email via OTP yet", 400);
  }

  if (!approve) {
    await db.emailChangeRequest.update({ where: { id }, data: { status: "REJECTED" } });
    await sendTemplatedEmail({
      to: request.user.email,
      templateKey: "system_alert",
      variables: { title: "Email change request rejected", message: `Your request to change your email to ${request.newEmail} was rejected by an administrator.`, when: new Date().toUTCString() },
    }).catch(() => undefined);
    return ok({ status: "REJECTED" });
  }

  const taken = await db.user.findUnique({ where: { email: request.newEmail } });
  if (taken && taken.id !== request.userId) return fail("That email is now in use by another account", 400);

  await db.$transaction([
    db.user.update({ where: { id: request.userId }, data: { email: request.newEmail, emailVerified: true } }),
    db.emailChangeRequest.update({ where: { id }, data: { status: "APPROVED" } }),
  ]);
  await sendTemplatedEmail({
    to: request.newEmail,
    templateKey: "system_alert",
    variables: { title: "Your email was changed", message: `Your ContractBuddy account email is now ${request.newEmail}.`, when: new Date().toUTCString() },
  }).catch(() => undefined);
  return ok({ status: "APPROVED", email: request.newEmail });
}
