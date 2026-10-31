import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { ensureDocTemplates } from "@/lib/doc-templates";

const templateSchema = z.object({
  kind: z.enum(["PROPOSAL", "CONTRACT"]),
  name: z.string().trim().min(1, "Name is required").max(120),
  badge: z.string().trim().max(40).optional().nullable(),
  description: z.string().trim().max(600).optional().nullable(),
  priceHint: z.string().trim().max(60).optional().nullable(),
  tone: z.string().trim().max(20).optional(),
  tags: z.array(z.string().max(60)).max(10).optional().nullable(),
  sections: z
    .array(z.object({ id: z.string(), title: z.string(), kind: z.enum(["text", "list"]), content: z.string().optional(), items: z.array(z.string()).optional() }))
    .max(30)
    .optional(),
  fee: z.object({ structure: z.string(), baseFee: z.number().min(0) }).optional().nullable(),
  terms: z.array(z.string().max(600)).max(30).optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    await ensureDocTemplates();
    const kind = req.nextUrl.searchParams.get("kind");
    const templates = await db.docTemplate.findMany({
      where: {
        OR: [{ userId: null }, { userId: user.id }],
        ...(kind === "PROPOSAL" || kind === "CONTRACT" ? { kind } : {}),
      },
      orderBy: [{ kind: "asc" }, { createdAt: "asc" }],
    });
    return ok({ templates });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = templateSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message || "Invalid input");
    const d = parsed.data;
    const template = await db.docTemplate.create({
      data: {
        key: `u-${user.id.slice(-6)}-${Date.now().toString(36)}`,
        userId: user.id,
        kind: d.kind,
        name: d.name,
        badge: d.badge || null,
        description: d.description || null,
        priceHint: d.priceHint || null,
        tone: d.tone || "brand",
        tags: d.tags ?? [],
        sections: d.sections ?? [],
        fee: d.fee ?? undefined,
        terms: d.terms ?? undefined,
      },
    });
    return ok({ template }, { status: 201 });
  } catch {
    return fail("Unauthorized", 401);
  }
}
