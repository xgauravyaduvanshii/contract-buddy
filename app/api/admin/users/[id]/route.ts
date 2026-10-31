import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

async function guard() {
  try {
    await requireAdmin();
    return null;
  } catch (e) {
    const s = (e as { status?: number }).status;
    return fail(s === 403 ? "Forbidden" : "Unauthorized", s || 401);
  }
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, name: true, image: true, bio: true, links: true, role: true, provider: true,
      suspended: true, emailVerified: true, createdAt: true, updatedAt: true,
      _count: { select: { projects: true, threads: true, contracts: true, notifications: true } },
    },
  });
  if (!user) return fail("Not found", 404);
  const recentThreads = await db.chatThread.findMany({
    where: { userId: id }, orderBy: { updatedAt: "desc" }, take: 10,
    select: { id: true, title: true, mode: true, updatedAt: true },
  });
  return ok({ user, recentThreads });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name.trim().slice(0, 80) || null;
  if (typeof body.image === "string") data.image = body.image.trim().slice(0, 500) || null;
  if (typeof body.bio === "string") data.bio = body.bio.trim().slice(0, 400) || null;
  if (Array.isArray(body.links)) {
    data.links = body.links
      .slice(0, 12)
      .map((l: unknown) => ({
        label: String((l as { label?: string })?.label || "").trim().slice(0, 40),
        url: String((l as { url?: string })?.url || "").trim().slice(0, 300),
      }))
      .filter((l: { label: string; url: string }) => l.label && l.url);
  }
  if (typeof body.role === "string" && ["USER", "ADMIN"].includes(body.role)) data.role = body.role;
  if (typeof body.suspended === "boolean") data.suspended = body.suspended;
  if (typeof body.emailVerified === "boolean") data.emailVerified = body.emailVerified;
  const user = await db.user.update({ where: { id }, data });
  return ok({ user: { id: user.id, role: user.role, suspended: user.suspended, name: user.name, emailVerified: user.emailVerified, image: user.image, bio: user.bio, links: user.links } });
}
