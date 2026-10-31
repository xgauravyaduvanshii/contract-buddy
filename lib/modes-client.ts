// Client-safe mode metadata (mirrors lib/chat-modes.ts labels).
export type ModeId = "AUTO" | "ASK" | "PLAN" | "AGENT" | "EXPERT";

export const MODES: { id: ModeId; label: string; desc: string; emoji: string }[] = [
  { id: "AUTO", label: "Auto", desc: "Automatically routes to the best mode for your request.", emoji: "⚡" },
  { id: "ASK", label: "Ask", desc: "Direct answers and explanations.", emoji: "💬" },
  { id: "PLAN", label: "Plan", desc: "Turns a goal into a structured project/contract plan.", emoji: "🗺️" },
  { id: "AGENT", label: "Agent", desc: "Builds the actual contract draft and artefacts.", emoji: "🤖" },
  { id: "EXPERT", label: "Expert", desc: "Assembles a parallel AI expert team for high-quality output.", emoji: "🧑‍🤝‍🧑" },
];

export const MODE_LABEL: Record<ModeId, string> = Object.fromEntries(
  MODES.map((m) => [m.id, m.label]),
) as Record<ModeId, string>;
