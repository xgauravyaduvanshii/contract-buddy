import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { contractSchema } from "../route";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const contract = await db.contract.findFirst({ where: { id, userId: user.id } });
    if (!contract) return fail("Not found", 404);
    const proposal = contract.proposalId
      ? await db.proposal.findUnique({ where: { id: contract.proposalId }, select: { id: true, title: true, code: true } })
      : null;
    return ok({ contract, proposal });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await db.contract.findFirst({ where: { id, userId: user.id } });
    if (!existing) return fail("Not found", 404);
    const body = await req.json().catch(() => ({}));
    const parsed = contractSchema.partial().safeParse(body);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message || "Invalid input");
    const d = parsed.data;
    const contract = await db.contract.update({
      where: { id },
      data: {
        title: d.title,
        client: d.client,
        jurisdiction: d.jurisdiction,
        clauses: d.clauses ?? undefined,
        fees: d.fees ?? undefined,
        status: d.status,
        projectId: d.projectId === undefined ? undefined : d.projectId || null,
        chat: Array.isArray(body.chat) ? body.chat : undefined,
        suggestions: Array.isArray(body.suggestions) ? body.suggestions : undefined,
      },
    });
    return ok({ contract });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await db.contract.findFirst({ where: { id, userId: user.id } });
    if (!existing) return fail("Not found", 404);
    await db.contract.delete({ where: { id } });
    return ok({ deleted: true });
  } catch {
    return fail("Unauthorized", 401);
  }
}
