import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const thread = await db.chatThread.findFirst({
      where: { id, userId: user.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!thread) return fail("Not found", 404);
    return ok({ thread });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const thread = await db.chatThread.findFirst({ where: { id, userId: user.id } });
    if (!thread) return fail("Not found", 404);
    await db.chatThread.delete({ where: { id } });
    return ok({ deleted: true });
  } catch {
    return fail("Unauthorized", 401);
  }
}
