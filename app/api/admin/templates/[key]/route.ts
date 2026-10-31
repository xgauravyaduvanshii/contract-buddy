import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { DEFAULT_TEMPLATES } from "@/lib/email-templates";

type Ctx = { params: Promise<{ key: string }> };

async function guard() {
  try {
    await requireAdmin();
    return null;
  } catch (e) {
    const s = (e as { status?: number }).status;
    return fail(s === 403 ? "Forbidden" : "Unauthorized", s || 401);
  }
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const { key } = await params;
  const row = await db.emailTemplate.findUnique({ where: { key } });
  const def = DEFAULT_TEMPLATES.find((d) => d.key === key);
  if (!row && !def) return fail("Not found", 404);
  return ok({ template: row ?? { ...def, customized: false } });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const { key } = await params;
  const def = DEFAULT_TEMPLATES.find((d) => d.key === key);
  if (!def) return fail("Unknown template key", 404);
  const body = await req.json().catch(() => ({}));
  const row = await db.emailTemplate.upsert({
    where: { key },
    create: {
      key,
      name: def.name,
      subject: typeof body.subject === "string" ? body.subject : def.subject,
      html: typeof body.html === "string" ? body.html : def.html,
      text: typeof body.text === "string" ? body.text : def.text,
    },
    update: {
      subject: typeof body.subject === "string" ? body.subject : undefined,
      html: typeof body.html === "string" ? body.html : undefined,
      text: typeof body.text === "string" ? body.text : undefined,
    },
  });
  return ok({ template: row });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const { key } = await params;
  await db.emailTemplate.deleteMany({ where: { key } });
  return ok({ reset: true });
}
