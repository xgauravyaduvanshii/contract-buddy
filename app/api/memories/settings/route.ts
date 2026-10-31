import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return fail("Unauthorized", 401);
  }
  const body = await req.json().catch(() => ({}));
  const data: Record<string, boolean> = {};
  if (typeof body.autoGenerate === "boolean") data.memoryAutoGen = body.autoGenerate;
  if (typeof body.retrieval === "boolean") data.memoryRetrieval = body.retrieval;
  if (!Object.keys(data).length) return fail("Nothing to update");
  const me = await db.user.update({
    where: { id: user.id },
    data,
    select: { memoryAutoGen: true, memoryRetrieval: true },
  });
  return ok({ settings: { autoGenerate: me.memoryAutoGen, retrieval: me.memoryRetrieval } });
}
