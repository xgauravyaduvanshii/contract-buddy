import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// POST toggles a skill install for the current user.
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const skill = await db.skill.findFirst({
      where: { id, enabled: true, OR: [{ global: true }, { userId: user.id }] },
    });
    if (!skill) return fail("Skill not found", 404);
    if (skill.global) return ok({ installed: true, note: "Global skills are always available" });

    const existing = await db.userSkill.findUnique({
      where: { userId_skillId: { userId: user.id, skillId: id } },
    });
    if (existing) {
      await db.userSkill.delete({ where: { id: existing.id } });
      return ok({ installed: false });
    }
    await db.userSkill.create({ data: { userId: user.id, skillId: id } });
    return ok({ installed: true });
  } catch {
    return fail("Unauthorized", 401);
  }
}
