import "server-only";
import { chatCompletion, type ChatMessage } from "./xrouter";

export type Mode = "ASK" | "PLAN" | "AGENT" | "EXPERT" | "AUTO";

// A fast, broadly-available default used for routing/classification.
export const ROUTER_MODEL = "ag/gemini-3.8-flash-tiered";

export const MODE_LABELS: Record<Mode, string> = {
  ASK: "Ask",
  PLAN: "Plan",
  AGENT: "Agent",
  EXPERT: "Expert",
  AUTO: "Auto",
};

export const MODE_DESCRIPTIONS: Record<Mode, string> = {
  ASK: "Direct answers and explanations.",
  PLAN: "Turns a goal into a structured project/contract plan.",
  AGENT: "Builds the actual contract draft and artefacts.",
  EXPERT: "Assembles a parallel AI expert team for high-quality output.",
  AUTO: "Automatically routes to the best mode for your request.",
};

function basePersona(): string {
  return "You are ContractBuddy, an assistant for developers, freelancers and agencies who draft and send project contracts to clients for signature. Be concise, practical and professional.";
}

export function systemPrompt(mode: Mode): string {
  switch (mode) {
    case "ASK":
      return `${basePersona()} Answer the user's question directly and accurately. Use short paragraphs and lists.`;
    case "PLAN":
      return `${basePersona()} Produce a clear, step-by-step PLAN: scope, deliverables, milestones, timeline, payment schedule, risks, and the contract clauses needed. Output as structured markdown.`;
    case "AGENT":
      return `${basePersona()} Act as an autonomous agent: draft a complete, ready-to-send CONTRACT with parties, scope, deliverables, timeline, payment terms, IP, confidentiality, termination, and signature blocks. Output clean markdown with clear headings.`;
    case "EXPERT":
      return `${basePersona()} You will synthesize input from multiple domain experts into one polished, high-quality contract.`;
    case "AUTO":
      return systemPrompt("ASK");
  }
}

// ── AUTO: classify which mode best fits the request ──────────
export async function classifyMode(
  model: string,
  userText: string,
): Promise<Mode> {
  const prompt = `Decide the best mode for this user request. Reply with ONLY one word: ASK, PLAN, AGENT, or EXPERT.
- ASK: a question / explanation.
- PLAN: they want a plan / breakdown / proposal structure.
- AGENT: they want you to build/draft an actual contract or document.
- EXPERT: complex, high-stakes, multi-domain contract work.
Request: """${userText.slice(0, 600)}"""`;
  try {
    const res = await chatCompletion({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      maxTokens: 8,
    });
    const t = res.content.toUpperCase().trim();
    if (t.includes("EXPERT")) return "EXPERT";
    if (t.includes("AGENT")) return "AGENT";
    if (t.includes("PLAN")) return "PLAN";
    return "ASK";
  } catch {
    return "ASK";
  }
}

// ── EXPERT: assemble a parallel team of specialist personas ──
type Expert = { role: string; focus: string };
const EXPERT_TEAM: Expert[] = [
  { role: "Contract Lawyer", focus: "Enforceable clauses, liability, termination, governing law." },
  { role: "Commercial Lead", focus: "Pricing, payment schedule, scope and change control." },
  { role: "Delivery Engineer", focus: "Realistic milestones, deliverables, acceptance criteria, timeline." },
  { role: "Client Experience", focus: "Plain-language clarity so the client signs confidently." },
];

export async function runExpertTeam(
  model: string,
  userText: string,
  context: string,
  signal?: AbortSignal,
): Promise<{ contributions: { role: string; notes: string }[]; thinking: string }> {
  const parts = await Promise.all(
    EXPERT_TEAM.map(async (e) => {
      const messages: ChatMessage[] = [
        { role: "system", content: `You are the ${e.role} on a contract team. Your focus: ${e.focus}. Give concise, specific recommendations for this project.` },
        { role: "user", content: `Project request:\n"""${userText}"""\n${context ? `Context:\n${context}\n` : ""}Provide your key inputs (max 6 bullets).` },
      ];
      try {
        const r = await chatCompletion({ model, messages, temperature: 0.4, maxTokens: 700, signal });
        return { role: e.role, notes: r.content };
      } catch {
        return { role: e.role, notes: "(expert unavailable)" };
      }
    }),
  );
  const thinking = parts
    .map((p) => `**${p.role}**\n${p.notes}`)
    .join("\n\n");
  return { contributions: parts, thinking };
}
