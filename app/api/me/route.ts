import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return fail("Unauthorized", 401);
  }
  const me = await db.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, image: true, bio: true, links: true, role: true, provider: true, emailVerified: true, createdAt: true },
  });
  return ok({ user: me });
}

export async function PATCH(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return fail("Unauthorized", 401);
  }
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
  if (!Object.keys(data).length) return fail("Nothing to update");
  const me = await db.user.update({
    where: { id: user.id },
    data,
    select: { id: true, name: true, image: true, bio: true, links: true, email: true },
  });
  return ok({ user: me });
}
