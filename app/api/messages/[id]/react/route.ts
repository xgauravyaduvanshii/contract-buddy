import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import type { Reaction } from "@/lib/chat-meta";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ emoji: z.string().trim().min(1).max(8) });

// Toggle the current user's emoji reaction on a message.
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const msg = await db.chatMessage.findFirst({
      where: { id, thread: { userId: user.id } },
      select: { id: true, reactions: true },
    });
    if (!msg) return fail("Not found", 404);

    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return fail("Invalid emoji");

    const list: Reaction[] = Array.isArray(msg.reactions) ? (msg.reactions as Reaction[]) : [];
    const i = list.findIndex((x) => x.by === "USER" && x.emoji === parsed.data.emoji);
    if (i >= 0) list.splice(i, 1);
    else list.push({ by: "USER", emoji: parsed.data.emoji });

    const updated = await db.chatMessage.update({ where: { id }, data: { reactions: list } });
    return ok({ reactions: updated.reactions });
  } catch {
    return fail("Unauthorized", 401);
  }
}
