import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

const DELETED_RETENTION_MS = 60 * 60 * 1000; // undo window: 1 hour

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    // Purge soft-deleted threads once the 1-hour undo window has passed
    await db.chatThread.deleteMany({
      where: { userId: user.id, deletedAt: { lt: new Date(Date.now() - DELETED_RETENTION_MS) } },
    });
    const archived = req.nextUrl.searchParams.get("archived") === "1";
    const threads = await db.chatThread.findMany({
      where: { userId: user.id, deletedAt: null, archivedAt: archived ? { not: null } : null },
      orderBy: [{ starred: "desc" }, { updatedAt: "desc" }],
      take: 50,
      select: {
        id: true,
        title: true,
        mode: true,
        model: true,
        projectId: true,
        starred: true,
        archivedAt: true,
        updatedAt: true,
      },
    });
    return ok({ threads });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const thread = await db.chatThread.create({
      data: {
        userId: user.id,
        title: String(body.title || "New chat"),
        mode: (body.mode as never) || "AUTO",
        model: body.model ? String(body.model) : null,
        projectId: body.projectId ? String(body.projectId) : null,
      },
    });
    return ok({ thread }, { status: 201 });
  } catch {
    return fail("Unauthorized", 401);
  }
}
