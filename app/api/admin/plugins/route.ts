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
  const plugins = await db.plugin.findMany({ orderBy: { name: "asc" } });
  return ok({ plugins });
}

export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) return fail("Name is required");
  const key = String(body.key || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  const plugin = await db.plugin.create({
    data: {
      key,
      name,
      description: body.description ? String(body.description) : null,
      enabled: body.enabled !== false,
      config: (body.config && typeof body.config === "object" ? body.config : {}) as never,
    },
  });
  return ok({ plugin }, { status: 201 });
}
