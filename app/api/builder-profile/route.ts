import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

const schema = z.object({
  niches: z.array(z.string().max(60)).max(30).optional().nullable(),
  pricingModel: z.enum(["FIXED", "MILESTONE", "RETAINER"]).optional().nullable(),
  terms: z
    .object({
      revisionRounds: z.union([z.number().int().min(0).max(10), z.literal("Unlimited")]).optional(),
      revisionDays: z.number().int().min(1).max(60).optional(),
      extraRevisionFee: z.number().min(0).max(1000000).optional(),
      terminationFee: z.string().max(60).optional(),
      ipTransfer: z.string().max(60).optional(),
      latePenalty: z.string().max(60).optional(),
      feedbackWindow: z.string().max(60).optional(),
    })
    .optional()
    .nullable(),
  business: z
    .object({
      city: z.string().max(80).optional(),
      pan: z.string().max(20).optional(),
      gstin: z.string().max(20).optional(),
      upi: z.string().max(80).optional(),
      bankAccount: z.string().max(30).optional(),
      ifsc: z.string().max(20).optional(),
    })
    .optional()
    .nullable(),
  onboarded: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await db.builderProfile.findUnique({ where: { userId: user.id } });
    return ok({ profile });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message || "Invalid input");
    const d = parsed.data;
    const profile = await db.builderProfile.upsert({
      where: { userId: user.id },
      update: {
        niches: d.niches ?? undefined,
        pricingModel: d.pricingModel ?? undefined,
        terms: d.terms ?? undefined,
        business: d.business ?? undefined,
        onboardedAt: d.onboarded ? new Date() : undefined,
      },
      create: {
        userId: user.id,
        niches: d.niches ?? [],
        pricingModel: d.pricingModel ?? null,
        terms: d.terms ?? undefined,
        business: d.business ?? undefined,
        onboardedAt: d.onboarded ? new Date() : null,
      },
    });
    return ok({ profile });
  } catch {
    return fail("Unauthorized", 401);
  }
}
