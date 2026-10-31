import "server-only";
import { db } from "./db";
import { chatCompletion } from "./xrouter";
import { ROUTER_MODEL } from "./chat-modes";

// ── User memories ─────────────────────────────────────────────
// Small persistent "cards" the AI knows about each user. Two switches:
//  • memoryAutoGen  — after chat turns, automatically extract durable facts
//  • memoryRetrieval — inject relevant memories into every chat context

const MAX_CARDS = 40;
const CONTEXT_CAP = 3500;

export async function getMemoryContext(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { memoryRetrieval: true },
  });
  if (!user?.memoryRetrieval) return "";
  const memories = await db.memory.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });
  if (!memories.length) return "";
  let text = memories
    .map((m) => `- [${m.kind}] ${m.title}: ${m.body}`)
    .join("\n");
  text = text.slice(0, CONTEXT_CAP);
  return `# What you remember about this user (personalise answers & contracts with these; never contradict them):\n${text}`;
}

/** Extract durable facts from a finished turn and store them as memory cards. */
export async function autoMemorize(opts: {
  userId: string;
  question: string;
  answer: string;
}): Promise<void> {
  try {
    const user = await db.user.findUnique({
      where: { id: opts.userId },
      select: { memoryAutoGen: true },
    });
    if (!user?.memoryAutoGen) return;

    const existing = await db.memory.findMany({
      where: { userId: opts.userId },
      select: { title: true },
      take: MAX_CARDS,
    });

    const r = await chatCompletion({
      model: ROUTER_MODEL,
      messages: [
        {
          role: "system",
          content:
            'You maintain memory cards for a contract-writing AI assistant. From the chat turn, extract durable facts worth remembering about the USER: their profile, preferences, recurring project details, style choices, corrections they made ("always/never…"). Reply with ONLY a JSON array: [{"kind":"PROFILE|PREFERENCE|PROJECT|FEEDBACK|NOTE","title":"<2-5 word label>","body":"<one factual sentence, max 200 chars>"}]. Max 3 cards. Reply [] if nothing durable was learned (e.g. small talk, one-off questions).',
        },
        {
          role: "user",
          content: `Existing card titles: ${JSON.stringify(existing.map((e) => e.title)).slice(0, 800)}\n\nUSER: ${opts.question.slice(0, 800)}\nASSISTANT: ${opts.answer.slice(0, 800)}`,
        },
      ],
      temperature: 0.2,
      maxTokens: 400,
    });

    const clean = r.content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    const cards = JSON.parse(clean) as { kind?: string; title?: string; body?: string }[];
    if (!Array.isArray(cards)) return;

    for (const c of cards.slice(0, 3)) {
      const title = String(c.title || "").trim().slice(0, 60);
      const body = String(c.body || "").trim().slice(0, 300);
      if (!title || !body) continue;
      const kind = ["PROFILE", "PREFERENCE", "PROJECT", "FEEDBACK", "NOTE"].includes(String(c.kind))
        ? String(c.kind)
        : "NOTE";
      // Upsert by title (case-insensitive) so repeated turns refine, not duplicate
      const dup = await db.memory.findFirst({
        where: { userId: opts.userId, title: { equals: title, mode: "insensitive" } },
      });
      if (dup) {
        await db.memory.update({ where: { id: dup.id }, data: { body, kind } });
      } else {
        const count = await db.memory.count({ where: { userId: opts.userId } });
        if (count >= MAX_CARDS) continue;
        await db.memory.create({
          data: { userId: opts.userId, kind, title, body, source: "AUTO" },
        });
      }
    }
  } catch {
    // memories must never break chat
  }
}
