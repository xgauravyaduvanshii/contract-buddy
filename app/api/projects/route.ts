import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const projects = await db.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { attachments: true, contracts: true, threads: true } } },
    });
    return ok({ projects });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    if (!name) return fail("Project name is required");
    const project = await db.project.create({
      data: { userId: user.id, name, goal: body.goal ? String(body.goal) : null },
    });
    return ok({ project }, { status: 201 });
  } catch {
    return fail("Unauthorized", 401);
  }
}
