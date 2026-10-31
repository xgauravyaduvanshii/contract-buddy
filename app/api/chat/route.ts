import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { chatCompletion, webSearch, webFetch, generateImage, type ChatMessage as XRMsg } from "@/lib/xrouter";
import {
  type Mode,
  ROUTER_MODEL,
  systemPrompt,
  classifyMode,
  runExpertTeam,
} from "@/lib/chat-modes";
import { buildContext } from "@/lib/chat-context";
import { getEnabledModels } from "@/lib/settings";

const DEFAULT_MODEL = "gemini/gemini-2.5-flash";

type ToolReq = {
  webSearch?: boolean;
  webFetch?: string[];
  imageGen?: string;
};

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return fail("Unauthorized", 401);
  }

  const body = await req.json().catch(() => ({}));
  const message = String(body.message || "").trim();
  if (!message) return fail("Message is required");

  const wantMode = (String(body.mode || "AUTO").toUpperCase() as Mode);
  const mode: Mode = (["ASK", "PLAN", "AGENT", "EXPERT", "AUTO"] as const).includes(wantMode) ? wantMode : "AUTO";
  const projectId = body.projectId ? String(body.projectId) : null;
  const designSystemId = body.designSystemId ? String(body.designSystemId) : null;
  const skillIds: string[] = Array.isArray(body.skillIds) ? body.skillIds.map(String) : [];
  const attachmentIds: string[] = Array.isArray(body.attachmentIds) ? body.attachmentIds.map(String) : [];
  const tools: ToolReq = body.tools || {};
  const threadId: string | null = body.threadId ? String(body.threadId) : null;

  // Validate chosen model against the admin allow-list (if any)
  const allow = await getEnabledModels();
  let model = String(body.model || DEFAULT_MODEL);
  if (allow && allow.length && !allow.includes(model)) model = allow.includes(DEFAULT_MODEL) ? DEFAULT_MODEL : allow[0];

  // Resolve/create the thread
  let thread = threadId
    ? await db.chatThread.findFirst({ where: { id: threadId, userId: user.id } })
    : null;
  if (!thread) {
    thread = await db.chatThread.create({
      data: {
        userId: user.id,
        projectId,
        mode,
        model,
        title: message.slice(0, 60) + (message.length > 60 ? "…" : ""),
      },
    });
  } else if (thread.title === "New chat" || !thread.title) {
    await db.chatThread.update({ where: { id: thread.id }, data: { title: message.slice(0, 60) } });
  }

  // History (oldest → newest) for the conversation
  const history = await db.chatMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
    take: 24,
  });

  // Build context from project / skills / design system / files
  const ctx = await buildContext({
    userId: user.id,
    projectId: projectId ?? thread.projectId,
    designSystemId,
    skillIds,
    attachmentIds,
  });

  // ── Tool execution ──────────────────────────────────────────
  const toolLog: { tool: string; detail: string }[] = [];
  const toolContext: string[] = [];
  try {
    if (tools.webSearch) {
      const r = await webSearch(message, 5);
      toolLog.push({ tool: "web_search", detail: `searched: ${message.slice(0, 60)}` });
      toolContext.push(`# Web search results:\n${JSON.stringify(r.results).slice(0, 4000)}`);
    }
    if (Array.isArray(tools.webFetch)) {
      for (const u of tools.webFetch.slice(0, 3)) {
        const r = await webFetch(String(u));
        toolLog.push({ tool: "web_fetch", detail: String(u) });
        toolContext.push(`# Fetched ${r.title || u}:\n${String(r.content || "").slice(0, 4000)}`);
      }
    }
  } catch (e) {
    toolLog.push({ tool: "error", detail: (e as Error).message.slice(0, 120) });
  }

  const effectiveContext = [ctx.context, toolContext.join("\n\n")].filter(Boolean).join("\n\n");

  // ── Resolve AUTO → concrete mode ────────────────────────────
  let resolvedMode: Mode = mode;
  if (mode === "AUTO") resolvedMode = await classifyMode(ROUTER_MODEL, message);

  const xrHistory: XRMsg[] = history
    .filter((h) => h.role !== "SYSTEM")
    .map((h) => ({
      role: h.role === "ASSISTANT" ? ("assistant" as const) : ("user" as const),
      content: h.content,
    }));

  let content = "";
  let thinking: string | null = null;

  try {
    if (resolvedMode === "EXPERT") {
      const team = await runExpertTeam(model, message, effectiveContext, req.signal);
      const synthMessages: XRMsg[] = [
        { role: "system", content: systemPrompt("EXPERT") + (effectiveContext ? `\n\n${effectiveContext}` : "") },
        ...xrHistory,
        {
          role: "user",
          content: `Request:\n"""${message}"""\n\nExpert team input:\n${team.thinking}\n\nSynthesize one polished, ready-to-use result.`,
        },
      ];
      const r = await chatCompletion({ model, messages: synthMessages, temperature: 0.4, maxTokens: 3000, signal: req.signal });
      content = r.content;
      thinking = `Expert team consulted:\n${team.thinking}`;
      toolLog.unshift({ tool: "expert_team", detail: team.contributions.map((c) => c.role).join(", ") });
    } else {
      const messages: XRMsg[] = [
        {
          role: "system",
          content:
            systemPrompt(resolvedMode) +
            (effectiveContext ? `\n\n--- REFERENCE CONTEXT ---\n${effectiveContext}` : ""),
        },
        ...xrHistory,
        { role: "user", content: message },
      ];
      const r = await chatCompletion({
        model,
        messages,
        temperature: resolvedMode === "AGENT" || resolvedMode === "PLAN" ? 0.5 : 0.7,
        maxTokens: 3000,
        signal: req.signal,
      });
      content = r.content;
      thinking = r.reasoning;
    }
  } catch (e) {
    const msg = (e as Error).message || "Model request failed";
    // Surface a friendly, actionable message instead of a raw 500.
    if (/leaked|403|PERMISSION_DENIED|api key/i.test(msg)) {
      return fail(
        "The AI provider rejected the current API key (it may be invalid or reported leaked). Add a working key in Admin → Settings → AI Provider.",
        502,
      );
    }
    return fail(`AI provider error: ${msg.replace(/^XRouter .*?: /, "").slice(0, 200)}`, 502);
  }

  // ── Optional image generation tool ──────────────────────────
  if (tools.imageGen) {
    try {
      const img = await generateImage({ model: "ag/gemini-3.1-flash-image", prompt: tools.imageGen });
      const url = img.data?.[0]?.url;
      if (url) toolLog.push({ tool: "image_gen", detail: url });
    } catch (e) {
      toolLog.push({ tool: "image_gen", detail: (e as Error).message.slice(0, 120) });
    }
  }

  // ── Persist ─────────────────────────────────────────────────
  const [userMsg, assistantMsg] = await Promise.all([
    db.chatMessage.create({
      data: {
        threadId: thread.id,
        userId: user.id,
        role: "USER",
        content: message,
        mode: resolvedMode,
      },
    }),
    db.chatMessage.create({
      data: {
        threadId: thread.id,
        userId: user.id,
        role: "ASSISTANT",
        content,
        mode: resolvedMode,
        thinking,
        toolCalls: toolLog.length ? (toolLog as never) : undefined,
      },
    }),
  ]);

  await db.chatThread.update({
    where: { id: thread.id },
    data: { mode: resolvedMode, model, updatedAt: new Date() },
  });

  return ok({
    threadId: thread.id,
    mode: resolvedMode,
    model,
    userMessage: { id: userMsg.id, role: "USER", content: message },
    assistantMessage: {
      id: assistantMsg.id,
      role: "ASSISTANT",
      content,
      thinking,
      toolCalls: toolLog,
    },
  });
}
