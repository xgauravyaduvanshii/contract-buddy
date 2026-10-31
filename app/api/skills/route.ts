import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const [skills, installs] = await Promise.all([
      db.skill.findMany({ where: { enabled: true, OR: [{ global: true }, { userId: user.id }] }, orderBy: { name: "asc" } }),
      db.userSkill.findMany({ where: { userId: user.id }, select: { skillId: true } }),
    ]);
    const installed = new Set(installs.map((i) => i.skillId));
    return ok({
      skills: skills.map((s) => ({ ...s, installed: installed.has(s.id) || s.global })),
    });
  } catch {
    return fail("Unauthorized", 401);
  }
}
