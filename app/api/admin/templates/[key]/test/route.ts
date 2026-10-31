import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { sendTemplatedEmail } from "@/lib/mailer";

type Ctx = { params: Promise<{ key: string }> };

// Body: { to: string } — sends this template rendered with sample variables.
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
  } catch (e) {
    const s = (e as { status?: number }).status;
    return fail(s === 403 ? "Forbidden" : "Unauthorized", s || 401);
  }
  const { key } = await params;
  const body = await req.json().catch(() => ({}));
  const to = String(body.to || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return fail("Enter a valid recipient email");

  const res = await sendTemplatedEmail({
    to,
    templateKey: key,
    variables: {
      name: "ContractBuddy Tester",
      email: to,
      otp: "123456",
      token: "test-token-42",
      title: "Test: System Alert",
      when: new Date().toUTCString(),
      message: `This is a test delivery of the "${key}" template from the ContractBuddy admin panel.`,
      headline: "Test: Campaign / Newsletter",
      body: "This is a sample newsletter body sent as a template test.",
      amount: "$0.00",
      invoiceId: "TEST-INVOICE",
      reason: "Template test",
      plan: "Pro (test)",
      date: new Date().toISOString().slice(0, 10),
      link: "https://example.com/test",
    },
  });
  if (!res.delivered) {
    return fail(
      res.reason === "smtp_unconfigured"
        ? "SMTP is not configured — the email was only printed to the server console."
        : `Send failed: ${res.reason || "unknown"}`,
      res.reason === "smtp_unconfigured" ? 503 : 502,
    );
  }
  return ok({ sent: true, to });
}
