import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await db.designSystem.findFirst({ where: { id, userId: user.id } });
    if (!existing) return fail("Not found", 404);
    const body = await req.json().catch(() => ({}));
    const system = await db.designSystem.update({
      where: { id },
      data: {
        name: body.name ? String(body.name) : undefined,
        tokens: (body.tokens && typeof body.tokens === "object" ? body.tokens : undefined) as never,
      },
    });
    return ok({ system });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await db.designSystem.findFirst({ where: { id, userId: user.id } });
    if (!existing) return fail("Not found", 404);
    await db.designSystem.delete({ where: { id } });
    return ok({ deleted: true });
  } catch {
    return fail("Unauthorized", 401);
  }
}
