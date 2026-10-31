import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

async function guard() {
  try {
    return await requireUser();
  } catch {
    return null;
  }
}

const KINDS = ["PROFILE", "PREFERENCE", "PROJECT", "FEEDBACK", "NOTE"];

export async function GET() {
  const user = await guard();
  if (!user) return fail("Unauthorized", 401);
  const [memories, me] = await Promise.all([
    db.memory.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    db.user.findUnique({
      where: { id: user.id },
      select: { memoryAutoGen: true, memoryRetrieval: true },
    }),
  ]);
  return ok({
    memories,
    settings: { autoGenerate: me?.memoryAutoGen ?? true, retrieval: me?.memoryRetrieval ?? true },
  });
}

export async function POST(req: NextRequest) {
  const user = await guard();
  if (!user) return fail("Unauthorized", 401);
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim().slice(0, 60);
  const bodyText = String(body.body || "").trim().slice(0, 300);
  const kind = KINDS.includes(String(body.kind)) ? String(body.kind) : "NOTE";
  if (!title || !bodyText) return fail("Title and body are required");
  const count = await db.memory.count({ where: { userId: user.id } });
  if (count >= 40) return fail("Memory limit reached (40 cards). Delete some first.", 400);
  const memory = await db.memory.create({
    data: { userId: user.id, kind, title, body: bodyText, source: "USER" },
  });
  return ok({ memory });
}
