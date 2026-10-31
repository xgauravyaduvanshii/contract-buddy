import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const template = await db.docTemplate.findFirst({ where: { id, OR: [{ userId: null }, { userId: user.id }] } });
    if (!template) return fail("Not found", 404);
    return ok({ template });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await db.docTemplate.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      const globalOne = await db.docTemplate.findFirst({ where: { id } });
      return fail(globalOne ? "Global templates are read-only — duplicate it first." : "Not found", globalOne ? 403 : 404);
    }
    const body = await req.json().catch(() => ({}));
    const template = await db.docTemplate.update({
      where: { id },
      data: {
        name: typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 120) : undefined,
        badge: typeof body.badge === "string" ? body.badge.slice(0, 40) : undefined,
        description: typeof body.description === "string" ? body.description.slice(0, 600) : undefined,
        priceHint: typeof body.priceHint === "string" ? body.priceHint.slice(0, 60) : undefined,
        tone: typeof body.tone === "string" ? body.tone.slice(0, 20) : undefined,
        tags: Array.isArray(body.tags) ? body.tags.map((t: unknown) => String(t).slice(0, 60)).slice(0, 10) : undefined,
        sections: Array.isArray(body.sections) ? body.sections.slice(0, 30) : undefined,
        fee: body.fee && typeof body.fee === "object" ? body.fee : undefined,
        terms: Array.isArray(body.terms) ? body.terms.map((t: unknown) => String(t).slice(0, 600)).slice(0, 30) : undefined,
      },
    });
    return ok({ template });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await db.docTemplate.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      const globalOne = await db.docTemplate.findFirst({ where: { id } });
      return fail(globalOne ? "Global templates cannot be deleted." : "Not found", globalOne ? 403 : 404);
    }
    await db.docTemplate.delete({ where: { id } });
    return ok({ deleted: true });
  } catch {
    return fail("Unauthorized", 401);
  }
}
