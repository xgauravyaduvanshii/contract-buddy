import "server-only";
import { db } from "./db";
import { chatCompletion } from "./xrouter";

export type Reaction = { by: "USER" | "AI"; emoji: string };
export type Comment = { by: "USER" | "AI"; text: string; at: string };

export type TurnMeta = { reaction: string | null; comment: string | null; suggestions: string[] };

// After a turn completes, ask a small model to (a) react to & comment on the
// user's message as the AI persona and (b) predict the user's intent and
// suggest the next messages. Failures are swallowed — this must never break chat.
export async function runTurnMeta(opts: {
  model: string;
  question: string;
  answer: string;
  userMessageId: string;
}): Promise<TurnMeta> {
  try {
    const r = await chatCompletion({
      model: opts.model,
      messages: [
        {
          role: "system",
          content:
            'You watch one turn of a chat between a user and "ContractBuddy", an AI contract assistant. Reply with ONLY a JSON object: {"reaction": <one of "👍","❤️","😂","🎯","🔥" or "" if none fits>, "comment": <max 12 words, a short friendly remark about the USER message written in the user\'s language>, "suggestions": [<2-3 concrete messages the USER is most likely to send next, predicting their intent from the conversation>]}. No markdown fences, no extra keys.',
        },
        {
          role: "user",
          content: `USER: ${opts.question.slice(0, 700)}\n\nASSISTANT: ${opts.answer.slice(0, 1200)}`,
        },
      ],
      temperature: 0.6,
      maxTokens: 220,
    });
    const clean = r.content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    const j = JSON.parse(clean) as Record<string, unknown>;
    const reaction = typeof j.reaction === "string" && j.reaction ? j.reaction.slice(0, 8) : null;
    const comment =
      typeof j.comment === "string" && j.comment.trim() ? j.comment.trim().slice(0, 140) : null;
    const suggestions = Array.isArray(j.suggestions)
      ? j.suggestions
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          .slice(0, 3)
          .map((s) => s.trim().slice(0, 140))
      : [];

    const data: { reactions?: Reaction[]; comments?: Comment[] } = {};
    if (reaction) data.reactions = [{ by: "AI", emoji: reaction }];
    if (comment) data.comments = [{ by: "AI", text: comment, at: new Date().toISOString() }];
    if (Object.keys(data).length) {
      await db.chatMessage.update({ where: { id: opts.userMessageId }, data });
    }
    return { reaction, comment, suggestions };
  } catch {
    return { reaction: null, comment: null, suggestions: [] };
  }
}
