import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const systems = await db.designSystem.findMany({
      where: { OR: [{ userId: user.id }, { userId: null }] },
      orderBy: [{ userId: "asc" }, { name: "asc" }],
    });
    return ok({ systems });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    if (!name) return fail("Design system name is required");
    const system = await db.designSystem.create({
      data: {
        userId: user.id,
        name,
        tokens: (body.tokens && typeof body.tokens === "object" ? body.tokens : {}) as never,
      },
    });
    return ok({ system }, { status: 201 });
  } catch {
    return fail("Unauthorized", 401);
  }
}
