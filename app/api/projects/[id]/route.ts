import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const project = await db.project.findFirst({
      where: { id, userId: user.id },
      include: {
        attachments: { orderBy: { createdAt: "desc" } },
        contracts: { orderBy: { updatedAt: "desc" } },
        threads: { orderBy: { updatedAt: "desc" }, take: 20 },
      },
    });
    if (!project) return fail("Not found", 404);
    return ok({ project });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await db.project.findFirst({ where: { id, userId: user.id } });
    if (!existing) return fail("Not found", 404);
    const body = await req.json().catch(() => ({}));
    const project = await db.project.update({
      where: { id },
      data: {
        name: body.name ? String(body.name) : undefined,
        goal: body.goal !== undefined ? String(body.goal) : undefined,
        status: body.status ? String(body.status) : undefined,
      },
    });
    return ok({ project });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await db.project.findFirst({ where: { id, userId: user.id } });
    if (!existing) return fail("Not found", 404);
    await db.project.delete({ where: { id } });
    return ok({ deleted: true });
  } catch {
    return fail("Unauthorized", 401);
  }
}
