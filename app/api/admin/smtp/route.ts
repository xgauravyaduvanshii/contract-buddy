import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { getSmtpConfig, getSmtpOverride, setSmtpOverride, type SmtpOverride } from "@/lib/settings";
import { sendTemplatedEmail } from "@/lib/mailer";

async function guard() {
  try {
    await requireAdmin();
    return null;
  } catch (e) {
    const s = (e as { status?: number }).status;
    return fail(s === 403 ? "Forbidden" : "Unauthorized", s || 401);
  }
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const [override, effective] = await Promise.all([getSmtpOverride(), getSmtpConfig()]);
  return ok({
    override: override ? { ...override, pass: override.pass ? "••••••••" : "" } : null,
    effective: { ...effective, pass: effective.pass ? "••••••••" : "" },
    envDefault: { host: process.env.SMTP_HOST || "", from: process.env.SMTP_FROM || "" },
  });
}

// Body: { clear: true } to reset to env, or { host, port, secure, user, pass, from }
export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));

  if (body.clear === true) {
    await setSmtpOverride(null);
    return ok({ cleared: true });
  }

  const o: SmtpOverride = {};
  if (typeof body.host === "string") o.host = body.host.trim();
  if (typeof body.port === "number") o.port = body.port;
  if (typeof body.secure === "boolean") o.secure = body.secure;
  if (typeof body.user === "string") o.user = body.user.trim();
  if (typeof body.from === "string") o.from = body.from.trim();
  // Password: keep existing override when the field is empty/sent as mask
  if (typeof body.pass === "string" && body.pass.trim() && body.pass.trim() !== "••••••••") {
    o.pass = body.pass.trim();
  } else {
    const prev = await getSmtpOverride();
    if (prev?.pass) o.pass = prev.pass;
  }
  await setSmtpOverride(o);
  return ok({ saved: true });
}

// Body: { to } — sends a system_alert test email through the current config
export async function PUT(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const to = String(body.to || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return fail("Enter a valid recipient email");
  const res = await sendTemplatedEmail({
    to,
    templateKey: "system_alert",
    variables: {
      title: "ContractBuddy SMTP test",
      when: new Date().toUTCString(),
      message: "If you received this, your SMTP settings work.",
    },
  });
  if (!res.delivered) {
    return fail(res.reason === "smtp_unconfigured" ? "SMTP incomplete — check host/user/pass" : `Send failed: ${res.reason}`, 502);
  }
  return ok({ sent: true, to });
}
