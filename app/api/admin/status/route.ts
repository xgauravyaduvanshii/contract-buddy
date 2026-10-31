import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { listModels } from "@/lib/xrouter";
import { getAllSettings } from "@/lib/settings";
import { isSmtpConfigured } from "@/lib/env";

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

  const [users, projects, threads, messages, contracts, notices, skills, plugins] = await Promise.all([
    db.user.count(),
    db.project.count(),
    db.chatThread.count(),
    db.chatMessage.count(),
    db.contract.count(),
    db.notice.count({ where: { active: true } }),
    db.skill.count({ where: { enabled: true } }),
    db.plugin.count({ where: { enabled: true } }),
  ]);

  let modelsOk = false;
  let modelCount = 0;
  try {
    const m = await listModels();
    modelsOk = true;
    modelCount = m.length;
  } catch {
    /* upstream unreachable */
  }

  const settings = await getAllSettings();

  return ok({
    counts: { users, projects, threads, messages, contracts, activeNotices: notices, skills, plugins },
    health: {
      database: "connected",
      smtp: isSmtpConfigured ? "configured" : "unconfigured",
      xrouter: modelsOk ? "reachable" : "unreachable",
      modelCount,
      apiKeySet: settings.apiKeySet,
      baseUrl: settings.baseUrl,
    },
  });
}
