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
  const kinds = ["WELCOME", "UPDATE", "INFO", "MAINTENANCE"];
  const notice = await db.notice.update({
    where: { id },
    data: {
      title: typeof body.title === "string" ? body.title : undefined,
      body: typeof body.body === "string" ? body.body : undefined,
      kind: kinds.includes(body.kind) ? body.kind : undefined,
      active: typeof body.active === "boolean" ? body.active : undefined,
    },
  });
  return ok({ notice });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  await db.notice.delete({ where: { id } });
  return ok({ deleted: true });
}
