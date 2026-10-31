import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { DEFAULT_TEMPLATES } from "@/lib/email-templates";

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    const s = (e as { status?: number }).status;
    return fail(s === 403 ? "Forbidden" : "Unauthorized", s || 401);
  }
  const rows = await db.emailTemplate.findMany();
  const overrides = new Map(rows.map((r) => [r.key, r]));
  const templates = DEFAULT_TEMPLATES.map((d) => {
    const o = overrides.get(d.key);
    return {
      key: d.key,
      name: d.name,
      category: d.category,
      subject: o?.subject ?? d.subject,
      html: o?.html ?? d.html,
      text: o?.text ?? d.text,
      customized: Boolean(o),
    };
  });
  return ok({ templates });
}
