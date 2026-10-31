import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export const contractSchema = z.object({
  title: z.string().trim().min(1).max(160),
  client: z.string().trim().max(120).optional().nullable(),
  projectId: z.string().max(40).optional().nullable(),
  jurisdiction: z.string().trim().max(60).optional().nullable(),
  clauses: z.array(z.object({ n: z.number(), title: z.string().max(120), text: z.string().max(6000) })).max(40).optional().nullable(),
  fees: z
    .object({ fee: z.number().min(0), gstPct: z.number().min(0).max(100), gst: z.number().min(0), grand: z.number().min(0), advance: z.number().min(0).optional(), currency: z.string().length(3).optional() })
    .optional()
    .nullable(),
  status: z.enum(["DRAFT", "SENT", "VIEWED", "SIGNED", "VOID"]).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const contracts = await db.contract.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true, title: true, client: true, status: true, jurisdiction: true, fees: true,
        signedAt: true, projectId: true, proposalId: true, updatedAt: true, clauses: true, chat: true,
      },
    });
    const list = contracts.map((c) => ({
      ...c,
      clauseCount: Array.isArray(c.clauses) ? (c.clauses as unknown[]).length : 0,
      hasChat: Array.isArray(c.chat) ? (c.chat as unknown[]).length > 0 : false,
      clauses: undefined,
      chat: undefined,
    }));
    return ok({ contracts: list });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const brief = typeof body.brief === "string" ? body.brief.trim() : "";
    const parsed = contractSchema.partial({ title: true }).safeParse(body);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message || "Invalid input");
    const d = parsed.data;
    const proposalId = typeof body.proposalId === "string" ? body.proposalId : null;
    const title = d.title || (brief ? brief.slice(0, 80) : "");
    if (!title) return fail("A title or brief is required");
    if (d.projectId) {
      const p = await db.project.findFirst({ where: { id: d.projectId, userId: user.id } });
      if (!p) d.projectId = null;
    }
    if (proposalId) {
      const pr = await db.proposal.findFirst({ where: { id: proposalId, userId: user.id } });
      if (!pr) return fail("Linked proposal not found");
    }
    const contract = await db.contract.create({
      data: {
        userId: user.id,
        title,
        client: d.client || null,
        projectId: d.projectId || null,
        proposalId,
        jurisdiction: d.jurisdiction || "India",
        clauses: d.clauses ?? undefined,
        fees: d.fees ?? undefined,
        chat: [],
      },
    });
    return ok({ contract }, { status: 201 });
  } catch {
    return fail("Unauthorized", 401);
  }
}
