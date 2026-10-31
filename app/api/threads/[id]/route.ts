import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const thread = await db.chatThread.findFirst({
      where: { id, userId: user.id, deletedAt: null },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!thread) return fail("Not found", 404);
    return ok({ thread });
  } catch {
    return fail("Unauthorized", 401);
  }
}

const patchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  starred: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const thread = await db.chatThread.findFirst({ where: { id, userId: user.id, deletedAt: null } });
    if (!thread) return fail("Not found", 404);

    const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return fail("Invalid payload");

    const data: { title?: string; starred?: boolean; archivedAt?: Date | null } = {};
    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.starred !== undefined) data.starred = parsed.data.starred;
    if (parsed.data.archived !== undefined)
      data.archivedAt = parsed.data.archived ? new Date() : null;
    if (!Object.keys(data).length) return fail("Nothing to update");

    const updated = await db.chatThread.update({ where: { id }, data });
    return ok({ thread: { id: updated.id, title: updated.title, starred: updated.starred, archivedAt: updated.archivedAt } });
  } catch {
    return fail("Unauthorized", 401);
  }
}

// Soft delete — keeps the thread restorable for 1 hour (purged lazily in GET /api/threads).
// Pass ?permanent=1 to hard-delete immediately (used from the archived list).
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const thread = await db.chatThread.findFirst({ where: { id, userId: user.id } });
    if (!thread) return fail("Not found", 404);
    if (req.nextUrl.searchParams.get("permanent") === "1") {
      await db.chatThread.delete({ where: { id } });
      return ok({ deleted: true, permanent: true });
    }
    await db.chatThread.update({ where: { id }, data: { deletedAt: new Date() } });
    return ok({ deleted: true, restoreWindowMinutes: 60 });
  } catch {
    return fail("Unauthorized", 401);
  }
}
