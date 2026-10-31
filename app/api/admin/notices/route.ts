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
  const notices = await db.notice.findMany({ orderBy: { createdAt: "desc" } });
  return ok({ notices });
}

export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const nbody = String(body.body || "").trim();
  if (!title || !nbody) return fail("Title and body are required");
  const kinds = ["WELCOME", "UPDATE", "INFO", "MAINTENANCE"];
  const notice = await db.notice.create({
    data: {
      title,
      body: nbody,
      kind: kinds.includes(body.kind) ? body.kind : "INFO",
      active: Boolean(body.active),
    },
  });
  return ok({ notice }, { status: 201 });
}
