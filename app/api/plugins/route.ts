import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

export async function GET() {
  try {
    await requireUser();
    const plugins = await db.plugin.findMany({ where: { enabled: true }, orderBy: { name: "asc" } });
    return ok({ plugins });
  } catch {
    return fail("Unauthorized", 401);
  }
}
