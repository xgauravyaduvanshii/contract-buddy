import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function GET() {
  try {
    await requireUser();
  } catch {
    return fail("Unauthorized", 401);
  }
  const notices = await db.notice.findMany({
    where: { active: true },
    orderBy: { publishedAt: "desc" },
  });
  return ok({ notices });
}

