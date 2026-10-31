import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

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

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const plugin = await db.plugin.update({
    where: { id },
    data: {
      name: typeof body.name === "string" ? body.name : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
      config: (body.config && typeof body.config === "object" ? body.config : undefined) as never,
    },
  });
  return ok({ plugin });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  await db.plugin.delete({ where: { id } });
  return ok({ deleted: true });
}
