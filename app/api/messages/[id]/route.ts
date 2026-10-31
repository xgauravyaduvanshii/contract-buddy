import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ content: z.string().trim().min(1).max(20000) });

// Edit a message's content (user or assistant). Owner-checked via the thread.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const msg = await db.chatMessage.findFirst({
      where: { id, thread: { userId: user.id } },
      select: { id: true, role: true },
    });
    if (!msg) return fail("Not found", 404);

    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return fail("Invalid content");

    const updated = await db.chatMessage.update({
      where: { id },
      data: { content: parsed.data.content },
    });
    return ok({ message: { id: updated.id, role: updated.role, content: updated.content } });
  } catch {
    return fail("Unauthorized", 401);
  }
}
