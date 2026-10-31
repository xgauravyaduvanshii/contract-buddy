import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
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
  const requests = await db.emailChangeRequest.findMany({
    where: { status: { in: ["PENDING", "VERIFIED"] } },
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  return ok({ requests });
}
