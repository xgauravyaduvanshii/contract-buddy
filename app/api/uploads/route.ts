import { NextRequest } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

// POST multipart/form-data: file=..., projectId?=..., kind?=FILE|IMAGE
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("No file provided");
    if (file.size > MAX_BYTES) return fail("File too large (max 15 MB)");

    const projectId = form.get("projectId")?.toString() || null;
    const kindRaw = form.get("kind")?.toString();
    const isImage = (file.type || "").startsWith("image/");
    const kind = kindRaw === "IMAGE" || isImage ? "IMAGE" : "FILE";

    const buf = Buffer.from(await file.arrayBuffer());
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const fname = `${crypto.randomUUID()}-${safe}`;

    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, fname), buf);

    const url = `/uploads/${fname}`;
    const attachment = await db.attachment.create({
      data: {
        userId: user.id,
        projectId: projectId || null,
        kind: kind as never,
        name: file.name,
        url,
        mimeType: file.type || null,
        size: file.size,
      },
    });
    return ok({ attachment }, { status: 201 });
  } catch (e) {
    if ((e as { status?: number }).status === 401) return fail("Unauthorized", 401);
    return fail("Upload failed", 500);
  }
}
