import "server-only";
import { getApiKey, getBaseUrl } from "./settings";

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const [base, key] = await Promise.all([getBaseUrl(), getApiKey()]);
  const res = await fetch(`${base}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`XRouter ${path} failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatResult = {
  content: string;
  reasoning: string | null;
  model: string;
  usage?: Record<string, number>;
};

export async function chatCompletion(opts: {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}): Promise<ChatResult> {
  const data = await call<{
    choices: {
      message: { content: string; reasoning_content?: string };
    }[];
    model?: string;
    usage?: Record<string, number>;
  }>("chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 2048,
    }),
  });
  const msg = data.choices?.[0]?.message;
  return {
    content: msg?.content?.trim() ?? "",
    reasoning: msg?.reasoning_content ?? null,
    model: data.model ?? opts.model,
    usage: data.usage,
  };
}

export type ModelInfo = {
  id: string;
  name: string;
  provider: string;
  features: string[];
  contextWindow: number | null;
};

export async function listModels(): Promise<ModelInfo[]> {
  const data = await call<{
    data: {
      id: string;
      name?: string;
      provider?: string;
      features?: string[];
      contextWindow?: number | null;
    }[];
  }>("models");
  return (data.data || []).map((m) => ({
    id: m.id,
    name: m.name || m.id,
    provider: m.provider || m.id.split("/")[0],
    features: m.features || [],
    contextWindow: m.contextWindow ?? null,
  }));
}

export async function createEmbeddings(model: string, input: string) {
  return call<{ data: { embedding: number[] }[] }>("embeddings", {
    method: "POST",
    body: JSON.stringify({ model, input }),
  });
}

export async function generateImage(opts: {
  model: string;
  prompt: string;
  size?: string;
}) {
  return call<{ data: { url?: string; b64_json?: string }[] }>(
    "images/generations",
    {
      method: "POST",
      body: JSON.stringify({
        model: opts.model,
        prompt: opts.prompt,
        size: opts.size ?? "1024x1024",
        response_format: "url",
      }),
    },
  );
}

export async function webSearch(query: string, maxResults = 5) {
  return call<{ results: unknown[] }>("search", {
    method: "POST",
    body: JSON.stringify({ query, max_results: maxResults }),
  });
}

export async function webFetch(url: string) {
  return call<{ content?: string; title?: string }>("web/fetch", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}
