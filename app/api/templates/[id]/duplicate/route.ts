import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

// POST /api/templates/[id]/duplicate — copy any template into the user's own list.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const source = await db.docTemplate.findFirst({ where: { id, OR: [{ userId: null }, { userId: user.id }] } });
    if (!source) return fail("Not found", 404);
    const copy = await db.docTemplate.create({
      data: {
        key: `u-${user.id.slice(-6)}-${Date.now().toString(36)}`,
        userId: user.id,
        kind: source.kind,
        badge: source.badge,
        name: `${source.name} (copy)`,
        description: source.description,
        priceHint: source.priceHint,
        tone: source.tone,
        tags: source.tags ?? [],
        sections: source.sections ?? [],
        fee: source.fee ?? undefined,
        terms: source.terms ?? undefined,
      },
    });
    return ok({ template: copy }, { status: 201 });
  } catch {
    return fail("Unauthorized", 401);
  }
}
