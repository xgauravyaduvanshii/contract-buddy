import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

const sectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(["text", "list"]),
  content: z.string().optional(),
  items: z.array(z.string()).optional(),
});

export const proposalBodySchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  clientName: z.string().trim().max(120).optional().nullable(),
  projectName: z.string().trim().max(120).optional().nullable(),
  note: z.string().trim().max(2000).optional().nullable(),
  noteAuthor: z.string().trim().max(80).optional().nullable(),
  currency: z.string().trim().length(3).optional(),
  fee: z.object({ structure: z.string(), baseFee: z.number().min(0), gstPct: z.number().min(0).max(100) }).optional().nullable(),
  sections: z.array(sectionSchema).max(30).optional(),
  offers: z
    .array(z.object({ id: z.string(), title: z.string(), desc: z.string().optional(), price: z.number().min(0), strike: z.number().min(0).optional(), discountPct: z.number().min(0).max(100).optional() }))
    .max(12)
    .optional()
    .nullable(),
  terms: z.array(z.string().max(600)).max(30).optional().nullable(),
  style: z.object({ font: z.enum(["Sans", "Serif", "Mono"]), titleColor: z.string(), background: z.string(), accent: z.string() }).optional().nullable(),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}([T ].*)?$/).optional().nullable(),
  projectId: z.string().max(40).optional().nullable(),
  templateKey: z.string().max(60).optional().nullable(),
  status: z.enum(["DRAFT", "SENT", "VIEWED", "ACCEPTED", "SIGNED"]).optional(),
});

async function nextCode(userId: string) {
  const n = await db.proposal.count({ where: { userId } });
  return `CB-P-${new Date().getFullYear()}-${String(n + 1).padStart(3, "0")}`;
}

export async function GET() {
  try {
    const user = await requireUser();
    const proposals = await db.proposal.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true, title: true, clientName: true, projectName: true, code: true, status: true,
        currency: true, fee: true, validUntil: true, templateKey: true, updatedAt: true, projectId: true,
      },
    });
    return ok({ proposals });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = proposalBodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message || "Invalid input");
    const d = parsed.data;
    if (d.projectId) {
      const p = await db.project.findFirst({ where: { id: d.projectId, userId: user.id } });
      if (!p) d.projectId = null;
    }
    const proposal = await db.proposal.create({
      data: {
        userId: user.id,
        title: d.title,
        clientName: d.clientName || null,
        projectName: d.projectName || null,
        note: d.note || null,
        noteAuthor: d.noteAuthor || null,
        currency: d.currency || "INR",
        fee: d.fee ?? undefined,
        sections: d.sections ?? [],
        offers: d.offers ?? undefined,
        terms: d.terms ?? undefined,
        style: d.style ?? undefined,
        projectId: d.projectId || null,
        templateKey: d.templateKey || null,
        code: await nextCode(user.id),
        validUntil: d.validUntil ? new Date(d.validUntil) : null,
      },
    });
    return ok({ proposal }, { status: 201 });
  } catch {
    return fail("Unauthorized", 401);
  }
}
