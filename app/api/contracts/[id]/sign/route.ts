import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

type Data = { type: "TYPE" | "DRAW"; value: string };

// Apply the designer's signature (typed name or drawn data-URL) to a contract.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const contract = await db.contract.findFirst({ where: { id, userId: user.id } });
    if (!contract) return fail("Not found", 404);

    const body = (await req.json().catch(() => ({}))) as Partial<Data>;
    const type = body.type === "DRAW" ? "DRAW" : "TYPE";
    const value = String(body.value || "").trim();
    if (!value) return fail("A signature is required");
    if (type === "TYPE" && value.length > 80) return fail("Name is too long");
    if (type === "DRAW" && !value.startsWith("data:image/")) return fail("Invalid signature image");
    if (type === "DRAW" && value.length > 400_000) return fail("Signature image is too large");

    const updated = await db.contract.update({
      where: { id },
      data: { signature: { type, value, at: new Date().toISOString() }, signedAt: new Date() },
    });
    return ok({ signedAt: updated.signedAt, signature: updated.signature });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const contract = await db.contract.findFirst({ where: { id, userId: user.id } });
    if (!contract) return fail("Not found", 404);
    const updated = await db.contract.update({ where: { id }, data: { signature: Prisma.DbNull, signedAt: null } });
    return ok({ signature: updated.signature, signedAt: updated.signedAt });
  } catch {
    return fail("Unauthorized", 401);
  }
}
