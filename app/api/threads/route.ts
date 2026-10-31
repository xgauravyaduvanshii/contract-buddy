import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const threads = await db.chatThread.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, title: true, mode: true, model: true, projectId: true, updatedAt: true },
    });
    return ok({ threads });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const thread = await db.chatThread.create({
      data: {
        userId: user.id,
        title: String(body.title || "New chat"),
        mode: (body.mode as never) || "AUTO",
        model: body.model ? String(body.model) : null,
        projectId: body.projectId ? String(body.projectId) : null,
      },
    });
    return ok({ thread }, { status: 201 });
  } catch {
    return fail("Unauthorized", 401);
  }
}
