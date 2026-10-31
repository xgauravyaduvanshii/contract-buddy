import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { getAllSettings, setApiKey, setEnabledModels, SETTINGS_KEYS } from "@/lib/settings";
import { db } from "@/lib/db";

async function guard() {
  try {
    await requireAdmin();
    return null;
  } catch (e) {
    const s = (e as { status?: number }).status;
    return fail(s === 403 ? "Forbidden" : "Unauthorized", s || 401);
  }
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return ok({ settings: await getAllSettings() });
}

export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));

  if (typeof body.apiKey === "string") {
    const v = body.apiKey.trim();
    if (v) await setApiKey(v);
    else await db.appSetting.deleteMany({ where: { key: SETTINGS_KEYS.apiKey } });
  }
  if (body.enabledModels !== undefined) {
    if (body.enabledModels === null || body.enabledModels === "all") {
      await setEnabledModels(null);
    } else if (Array.isArray(body.enabledModels)) {
      await setEnabledModels(body.enabledModels.map(String));
    }
  }
  return ok({ settings: await getAllSettings() });
}
