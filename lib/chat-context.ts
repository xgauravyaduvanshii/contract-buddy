import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "./db";

// ── Skill / design-system / project / attachment context ──────
// The chat route assembles a single rich "context" string so the
// model can automatically use installed skills, the project brief,
// the chosen design system (for contract styling) and any files.

const TEXT_MIME = /^(text\/|application\/(json|xml|x-yaml|yaml|javascript|typescript)|.*\/(json|xml|yaml))/i;
const MAX_FILE_CHARS = 8000;

export type AttachRef = { id?: string; name?: string; url?: string; kind?: string; dataUrl?: string };

export type BuiltContext = {
  context: string;
  files: { name: string; text: string | null }[];
  designTokens: Record<string, unknown> | null;
  skillNames: string[];
};

async function readUpload(url: string): Promise<string | null> {
  try {
    // uploads are stored under public/uploads and served at /uploads/*
    if (!url.startsWith("/uploads/")) return null;
    const rel = url.replace(/^\/uploads\//, "");
    const file = path.join(process.cwd(), "public", "uploads", rel);
    const buf = await readFile(file, "utf-8");
    return buf.slice(0, MAX_FILE_CHARS);
  } catch {
    return null;
  }
}

export async function buildContext(opts: {
  userId: string;
  projectId?: string | null;
  designSystemId?: string | null;
  skillIds?: string[];
  attachmentIds?: string[];
}): Promise<BuiltContext> {
  const chunks: string[] = [];
  const files: { name: string; text: string | null }[] = [];
  let designTokens: Record<string, unknown> | null = null;
  const skillNames: string[] = [];

  // Project brief + its attachments
  if (opts.projectId) {
    const project = await db.project.findFirst({
      where: { id: opts.projectId, userId: opts.userId },
      include: { attachments: { take: 20 } },
    });
    if (project) {
      chunks.push(
        `# Linked project: ${project.name}\nGoal: ${project.goal || "(not stated)"}\n` +
          (project.attachments.length
            ? `Project files: ${project.attachments.map((a) => a.name).join(", ")}`
            : ""),
      );
    }
  }

  // Design system (styling guidance for contracts)
  if (opts.designSystemId) {
    const ds = await db.designSystem.findFirst({
      where: { id: opts.designSystemId, OR: [{ userId: opts.userId }, { userId: null }] },
    });
    if (ds) {
      designTokens = (ds.tokens as Record<string, unknown>) ?? {};
      chunks.push(
        `# Design system "${ds.name}" (apply to any contract/document styling — colours, typography, spacing, tone):\n` +
          JSON.stringify(designTokens, null, 2),
      );
    }
  }

  // Skills: user-installed + global, optionally narrowed to picked ids
  const skillWhere: Record<string, unknown> = { enabled: true };
  skillWhere.OR = [{ global: true }, { userId: opts.userId }];
  if (opts.skillIds && opts.skillIds.length) skillWhere.id = { in: opts.skillIds };
  const installed = await db.userSkill.findMany({
    where: { userId: opts.userId },
    select: { skillId: true },
  });
  const installedIds = new Set(installed.map((i) => i.skillId));
  const skills = await db.skill.findMany({ where: skillWhere, take: 40 });
  const usable = skills.filter((s) => s.global || installedIds.has(s.id) || opts.skillIds?.includes(s.id));
  for (const s of usable) {
    skillNames.push(s.name);
    if (s.instructions) chunks.push(`# Skill "${s.name}" — follow when relevant:\n${s.instructions}`);
  }

  // Per-message attachments: read text files for real understanding
  if (opts.attachmentIds && opts.attachmentIds.length) {
    const atts = await db.attachment.findMany({
      where: { id: { in: opts.attachmentIds }, userId: opts.userId },
    });
    for (const a of atts) {
      const isText = a.mimeType ? TEXT_MIME.test(a.mimeType) : a.name.endsWith(".md") || a.name.endsWith(".txt");
      const text = isText ? await readUpload(a.url) : null;
      files.push({ name: a.name, text });
    }
    if (files.length) {
      chunks.push(
        `# Attached files this message:\n${files
          .map((f) => `- ${f.name}${f.text ? "\n```\n" + f.text + "\n```" : " (binary/image — reference by name)"}`)
          .join("\n")}`,
      );
    }
  }

  return { context: chunks.join("\n\n"), files, designTokens, skillNames };
}
