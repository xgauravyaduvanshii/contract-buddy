import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const KINDS = ["PROFILE", "PREFERENCE", "PROJECT", "FEEDBACK", "NOTE"];

async function guard() {
  try {
    return await requireUser();
  } catch {
    return null;
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await guard();
  if (!user) return fail("Unauthorized", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.trim().slice(0, 60);
  if (typeof body.body === "string") data.body = body.body.trim().slice(0, 300);
  if (typeof body.kind === "string" && KINDS.includes(body.kind)) data.kind = body.kind;
  const memory = await db.memory.updateMany({ where: { id, userId: user.id }, data });
  if (!memory.count) return fail("Not found", 404);
  return ok({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const user = await guard();
  if (!user) return fail("Unauthorized", 401);
  const { id } = await params;
  const deleted = await db.memory.deleteMany({ where: { id, userId: user.id } });
  if (!deleted.count) return fail("Not found", 404);
  return ok({ ok: true });
}
