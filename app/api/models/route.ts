import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { listModels, type ModelInfo } from "@/lib/xrouter";
import { getEnabledModels } from "@/lib/settings";
import { ok, fail } from "@/lib/api";

// Very short cache: the model catalog rarely changes but we don't want to
// hit the upstream on every request.
const modelCache: { at: number; data: ModelInfo[] } = { at: 0, data: [] };
const CACHE_MS = 5 * 60 * 1000;

async function loadModels(): Promise<ModelInfo[]> {
  if (Date.now() - modelCache.at < CACHE_MS && modelCache.data.length) {
    return modelCache.data;
  }
  const data = await listModels();
  modelCache.at = Date.now();
  modelCache.data = data;
  return data;
}

export async function GET(req: NextRequest) {
  try {
    await requireUser();
  } catch {
    return fail("Unauthorized", 401);
  }

  const showAll = req.nextUrl.searchParams.get("all") === "1";
  let models: ModelInfo[] = [];
  try {
    models = await loadModels();
  } catch (e) {
    return fail(`Failed to load models: ${(e as Error).message}`, 502);
  }

  const enabled = await getEnabledModels(); // null => all allowed

  const decorated = models.map((m) => ({
    ...m,
    enabled: enabled === null ? true : enabled.includes(m.id),
  }));

  const data = showAll ? decorated : decorated.filter((m) => m.enabled);
  return ok({ count: data.length, models: data });
}

