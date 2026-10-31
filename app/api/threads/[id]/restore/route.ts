import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// Undo a soft delete (available while the 1-hour restore window is open).
export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const thread = await db.chatThread.findFirst({ where: { id, userId: user.id } });
    if (!thread) return fail("Not found", 404);
    if (!thread.deletedAt) return ok({ restored: false });
    await db.chatThread.update({ where: { id }, data: { deletedAt: null } });
    return ok({ restored: true });
  } catch {
    return fail("Unauthorized", 401);
  }
}
