import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

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
  const skills = await db.skill.findMany({
    where: { global: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { installs: true } } },
  });
  return ok({ skills });
}

export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) return fail("Name is required");
  const slug = String(body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  const skill = await db.skill.create({
    data: {
      slug,
      name,
      description: body.description ? String(body.description) : null,
      category: body.category ? String(body.category) : "general",
      instructions: body.instructions ? String(body.instructions) : null,
      enabled: body.enabled !== false,
      global: true,
    },
  });
  return ok({ skill }, { status: 201 });
}
