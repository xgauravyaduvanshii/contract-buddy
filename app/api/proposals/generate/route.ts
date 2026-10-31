import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { chatCompletion } from "@/lib/xrouter";
import { ROUTER_MODEL } from "@/lib/chat-modes";
import { getMemoryContext } from "@/lib/memories";

type Gen = {
  title: string;
  clientName?: string;
  projectName?: string;
  feeStructure?: string;
  baseFee?: number;
  sections: { id: string; title: string; kind: "text" | "list"; content?: string; items?: string[] }[];
  terms?: string[];
  note?: string;
};

function extractJson(text: string): Gen | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const v = JSON.parse(text.slice(start, end + 1));
    if (!v || typeof v.title !== "string" || !Array.isArray(v.sections)) return null;
    return v as Gen;
  } catch {
    return null;
  }
}

// "Generate with AI" — turn a short brief into a full structured proposal.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const brief = String(body.brief || "").trim();
    if (brief.length < 8) return fail("Describe the project in a few words first.");
    if (brief.length > 2000) return fail("Brief is too long (max 2000 characters).");

    const memoryCtx = await getMemoryContext(user.id);
    const r = await chatCompletion({
      model: ROUTER_MODEL,
      temperature: 0.6,
      maxTokens: 2600,
      messages: [
        {
          role: "system",
          content: `You are the ContractBuddy proposal writer. From the user's brief, produce a complete client-ready freelance proposal as STRICT JSON (no markdown fences, no commentary) with this shape:
{"title": string, "clientName": string|null, "projectName": string|null, "feeStructure": "Fixed Price"|"Milestone"|"Monthly Retainer", "baseFee": number, "sections": [{"id": slug, "title": string, "kind": "text"|"list", "content": string (for text), "items": string[] (for list)}], "terms": string[], "note": string}
Rules: 4-6 sections starting with a "Project Overview" text section, then a "Scope of Work" list section, then Timeline/Investment. Prices in INR realistic for the Indian freelance market. "note" is a warm 2-sentence personal note from the designer. ${memoryCtx}`.replace(/\s+/g, " "),
        },
        { role: "user", content: brief },
      ],
    });

    const gen = extractJson(r.content);
    if (!gen) return fail("The AI returned an unusable draft. Try again or reword the brief.", 502);

    const sections = gen.sections
      .slice(0, 12)
      .map((s, i) => ({
        id: String(s.id || `sec-${i + 1}`).slice(0, 40),
        title: String(s.title || `Section ${i + 1}`).slice(0, 80),
        kind: s.kind === "list" ? ("list" as const) : ("text" as const),
        content: s.content ? String(s.content).slice(0, 2000) : undefined,
        items: Array.isArray(s.items) ? s.items.map((x) => String(x).slice(0, 300)).slice(0, 20) : undefined,
      }));

    const n = await db.proposal.count({ where: { userId: user.id } });
    const proposal = await db.proposal.create({
      data: {
        userId: user.id,
        title: gen.title.slice(0, 160),
        clientName: gen.clientName?.slice(0, 120) || null,
        projectName: gen.projectName?.slice(0, 120) || null,
        note: gen.note?.slice(0, 2000) || null,
        noteAuthor: user.name || null,
        fee: { structure: gen.feeStructure || "Fixed Price", baseFee: Number(gen.baseFee) || 0, gstPct: 18 },
        sections,
        terms: Array.isArray(gen.terms) ? gen.terms.map((t) => String(t).slice(0, 600)).slice(0, 30) : [],
        code: `CB-P-${new Date().getFullYear()}-${String(n + 1).padStart(3, "0")}`,
      },
    });
    return ok({ proposal }, { status: 201 });
  } catch (e) {
    const m = (e as Error).message || "";
    if (/leaked|403|api key/i.test(m)) return fail("AI generation needs a working AI key (Admin → Settings).", 502);
    return fail("AI generation failed. Try again.", 502);
  }
}
