import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import type { Comment } from "@/lib/chat-meta";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ text: z.string().trim().min(1).max(500) });

// Add the current user's comment about a message (AI comments come from chat-meta).
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const msg = await db.chatMessage.findFirst({
      where: { id, thread: { userId: user.id } },
      select: { id: true, comments: true },
    });
    if (!msg) return fail("Not found", 404);

    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return fail("Invalid comment");

    const list: Comment[] = Array.isArray(msg.comments) ? (msg.comments as Comment[]) : [];
    list.push({ by: "USER", text: parsed.data.text, at: new Date().toISOString() });

    const updated = await db.chatMessage.update({ where: { id }, data: { comments: list } });
    return ok({ comments: updated.comments });
  } catch {
    return fail("Unauthorized", 401);
  }
}
