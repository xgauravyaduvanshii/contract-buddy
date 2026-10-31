import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unread = items.filter((n) => !n.read).length;
    return ok({ notifications: items, unread });
  } catch (e) {
    if ((e as { status?: number }).status) return fail("Unauthorized", 401);
    throw e;
  }
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const all = Boolean(body?.all);
  if (all) {
    await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
    return ok({ updated: true });
  }
  if (body?.id) {
    await db.notification.update({ where: { id: String(body.id) }, data: { read: true } });
  }
  return ok({ updated: true });
}

