import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_TEMPLATES } from "../lib/email-templates";

const db = new PrismaClient();

async function main() {
  // 1) Email templates (upsert so admin edits aren't overwritten by re-seed)
  for (const t of DEFAULT_TEMPLATES) {
    await db.emailTemplate.upsert({
      where: { key: t.key },
      create: { key: t.key, name: t.name, subject: t.subject, html: t.html, text: t.text },
      update: {},
    });
  }

  // 2) Admin user
  const adminEmail = "admin@contractbuddy.com";
  const adminHash = await bcrypt.hash("Admin@12345", 12);
  await db.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "ContractBuddy Admin",
      role: "ADMIN",
      provider: "CREDENTIALS",
      emailVerified: true,
      passwordHash: adminHash,
    },
    update: { role: "ADMIN" },
  });

  // 3) Demo user
  const demoEmail = "demo@contractbuddy.com";
  const demoHash = await bcrypt.hash("Demo@12345", 12);
  await db.user.upsert({
    where: { email: demoEmail },
    create: {
      email: demoEmail,
      name: "Alex Rivera",
      role: "USER",
      provider: "CREDENTIALS",
      emailVerified: true,
      passwordHash: demoHash,
    },
    update: {},
  });

  // 4) Sample global skills
  const skills = [
    { slug: "contract-drafting", name: "Contract Drafting", category: "Legal", description: "Draft client-ready project contracts with standard clauses.", instructions: "Structure contracts with scope, deliverables, timeline, payment terms, IP and termination clauses." },
    { slug: "web-search", name: "Web Search", category: "Research", description: "Search the live web for supporting information.", instructions: "Use the search tool to gather citations before answering." },
    { slug: "image-gen", name: "Image Generation", category: "Creative", description: "Generate images and visuals on demand.", instructions: "When asked for a visual, call the image generation tool." },
  ];
  for (const s of skills) {
    await db.skill.upsert({
      where: { slug: s.slug },
      create: { ...s, enabled: true, global: true },
      update: {},
    });
  }

  // 5) Sample plugins
  const plugins = [
    { key: "web_search", name: "Web Search", description: "Live web results inside chat." },
    { key: "web_fetch", name: "Web Fetch", description: "Read and extract page content." },
    { key: "image_gen", name: "Image Generation", description: "Generate images from prompts." },
    { key: "file_analysis", name: "File Analysis", description: "Understand uploaded files and images." },
  ];
  for (const p of plugins) {
    await db.plugin.upsert({
      where: { key: p.key },
      create: { ...p, enabled: true },
      update: {},
    });
  }

  // 6) Welcome notice (shown in the in-app notice panel)
  const existing = await db.notice.findFirst({ where: { active: true } });
  if (!existing) {
    await db.notice.create({
      data: {
        title: "👋 Welcome to ContractBuddy",
        body: "Draft, send and e-sign project contracts in minutes. Explore the new AI dashboard — pick a mode (Ask, Plan, Agent or Expert) and let ContractBuddy assemble the right contract for your project.",
        kind: "WELCOME",
        active: true,
      },
    });
    await db.notice.create({
      data: {
        title: "🚀 New: Expert mode",
        body: "Expert mode assembles an AI engineering-team of specialists that collaborate in parallel to produce high-quality contracts.",
        kind: "UPDATE",
        active: true,
      },
    });
  }

  console.log("✅ Seeded: templates, admin@contractbuddy.com / Admin@12345, demo@contractbuddy.com / Demo@12345, skills, plugins, notices");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
