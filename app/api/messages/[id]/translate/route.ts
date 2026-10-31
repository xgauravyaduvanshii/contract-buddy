import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { chatCompletion } from "@/lib/xrouter";
import { ROUTER_MODEL } from "@/lib/chat-modes";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ lang: z.string().trim().min(2).max(40) });

// Translate a message into a target language (returned only, not persisted).
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const msg = await db.chatMessage.findFirst({
      where: { id, thread: { userId: user.id } },
      select: { content: true },
    });
    if (!msg) return fail("Not found", 404);

    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return fail("Invalid language");

    const r = await chatCompletion({
      model: ROUTER_MODEL,
      messages: [
        {
          role: "system",
          content: `Translate the user's text into ${parsed.data.lang}. Output ONLY the translation, preserving any markdown formatting. Never add explanations.`,
        },
        { role: "user", content: msg.content.slice(0, 6000) },
      ],
      temperature: 0.3,
      maxTokens: 2500,
    });
    return ok({ translation: r.content });
  } catch (e) {
    const m = (e as Error).message || "";
    if (/leaked|403|api key/i.test(m)) return fail("Translation needs a working AI key (Admin → Settings).", 502);
    return fail("Translation failed", 502);
  }
}
