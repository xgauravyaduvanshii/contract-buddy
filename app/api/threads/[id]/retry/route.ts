import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { chatCompletion, type ChatMessage as XRMsg } from "@/lib/xrouter";
import { type Mode, ROUTER_MODEL, systemPrompt } from "@/lib/chat-modes";
import { runTurnMeta } from "@/lib/chat-meta";

type Ctx = { params: Promise<{ id: string }> };

const DEFAULT_MODEL = "gemini/gemini-2.5-flash";

// Retry: regenerate the assistant answer for a turn.
// Body: { messageId } — id of the assistant message to redo, or of the user
// message to resend. Everything after that user message is discarded.
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const thread = await db.chatThread.findFirst({ where: { id, userId: user.id, deletedAt: null } });
    if (!thread) return fail("Not found", 404);

    const body = await req.json().catch(() => ({}));
    const messageId = String(body.messageId || "");

    const msgs = await db.chatMessage.findMany({
      where: { threadId: id },
      orderBy: { createdAt: "asc" },
    });
    const idx = msgs.findIndex((m) => m.id === messageId);
    if (idx === -1) return fail("Message not found", 404);

    // Walk back to the user message that starts this turn
    let qIdx = msgs[idx].role === "USER" ? idx : -1;
    for (let i = idx; qIdx === -1 && i >= 0; i--) if (msgs[i].role === "USER") qIdx = i;
    if (qIdx === -1) return fail("Nothing to retry", 400);

    const question = msgs[qIdx].content;
    const history = msgs.slice(0, qIdx).filter((m) => m.role !== "SYSTEM");

    // Drop everything after the user message, then regenerate its answer
    await db.chatMessage.deleteMany({ where: { id: { in: msgs.slice(qIdx + 1).map((m) => m.id) } } });

    const model = thread.model || DEFAULT_MODEL;
    const resolvedMode: Mode = thread.mode === "AUTO" ? "ASK" : (thread.mode as Mode);
    const xrMessages: XRMsg[] = [
      { role: "system", content: systemPrompt(resolvedMode) },
      ...history.map((h) => ({
        role: h.role === "ASSISTANT" ? ("assistant" as const) : ("user" as const),
        content: h.content,
      })),
      { role: "user", content: question },
    ];

    let result: { content: string; reasoning: string | null };
    try {
      result = await chatCompletion({ model, messages: xrMessages, temperature: 0.7, maxTokens: 3000 });
    } catch (e) {
      const msg = (e as Error).message || "Model request failed";
      if (/leaked|403|PERMISSION_DENIED|api key/i.test(msg)) {
        return fail(
          "The AI provider rejected the current API key. Add a working key in Admin → Settings → AI Provider.",
          502,
        );
      }
      return fail(`AI provider error: ${msg.replace(/^XRouter .*?: /, "").slice(0, 200)}`, 502);
    }

    const assistantMsg = await db.chatMessage.create({
      data: {
        threadId: id,
        userId: user.id,
        role: "ASSISTANT",
        content: result.content,
        mode: resolvedMode,
        thinking: result.reasoning,
      },
    });

    const meta = await runTurnMeta({
      model: ROUTER_MODEL,
      question,
      answer: result.content,
      userMessageId: msgs[qIdx].id,
    });

    return ok({
      userMessage: {
        id: msgs[qIdx].id,
        role: "USER",
        content: question,
        reactions: meta.reaction ? [{ by: "AI", emoji: meta.reaction }] : [],
        comments: meta.comment ? [{ by: "AI", text: meta.comment, at: new Date().toISOString() }] : [],
      },
      assistantMessage: {
        id: assistantMsg.id,
        role: "ASSISTANT",
        content: result.content,
        thinking: result.reasoning,
        toolCalls: [],
        suggestions: meta.suggestions,
      },
    });
  } catch {
    return fail("Unauthorized", 401);
  }
}
