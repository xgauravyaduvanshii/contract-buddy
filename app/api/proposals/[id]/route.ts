import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { proposalBodySchema } from "../route";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const proposal = await db.proposal.findFirst({ where: { id, userId: user.id } });
    if (!proposal) return fail("Not found", 404);
    return ok({ proposal });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await db.proposal.findFirst({ where: { id, userId: user.id } });
    if (!existing) return fail("Not found", 404);
    const parsed = proposalBodySchema.partial().safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message || "Invalid input");
    const d = parsed.data;
    const proposal = await db.proposal.update({
      where: { id },
      data: {
        title: d.title,
        clientName: d.clientName,
        projectName: d.projectName,
        note: d.note,
        noteAuthor: d.noteAuthor,
        currency: d.currency,
        fee: d.fee ?? undefined,
        sections: d.sections ?? undefined,
        offers: d.offers ?? undefined,
        terms: d.terms ?? undefined,
        style: d.style ?? undefined,
        projectId: d.projectId === undefined ? undefined : d.projectId || null,
        status: d.status,
        validUntil: d.validUntil === undefined ? undefined : d.validUntil ? new Date(d.validUntil) : null,
      },
    });
    return ok({ proposal });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await db.proposal.findFirst({ where: { id, userId: user.id } });
    if (!existing) return fail("Not found", 404);
    await db.proposal.delete({ where: { id } });
    return ok({ deleted: true });
  } catch {
    return fail("Unauthorized", 401);
  }
}
