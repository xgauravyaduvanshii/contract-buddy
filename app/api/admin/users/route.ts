import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    const s = (e as { status?: number }).status;
    return fail(s === 403 ? "Forbidden" : "Unauthorized", s || 401);
  }
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const users = await db.user.findMany({
    where: q
      ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, email: true, name: true, image: true, role: true, provider: true,
      suspended: true, emailVerified: true, createdAt: true,
      _count: { select: { projects: true, threads: true, contracts: true } },
    },
  });
  return ok({ users });
}
