import "server-only";
import { db } from "@/lib/db";
import type { ProposalSection } from "@/lib/builder-types";

// Global (userId = null) document templates, upserted by key on first use.
type Seed = {
  key: string;
  kind: "PROPOSAL" | "CONTRACT";
  badge: string;
  name: string;
  description: string;
  priceHint: string;
  tone: string;
  tags: string[];
  fee: { structure: string; baseFee: number };
  sections: ProposalSection[];
  terms: string[];
};

const sec = (id: string, title: string, kind: "text" | "list", v: string | string[]): ProposalSection =>
  kind === "text" ? { id, title, kind, content: v as string } : { id, title, kind, items: v as string[] };

const overview = (t: string) =>
  sec("overview", "Project Overview", "text", t);

const SEEDS: Seed[] = [
  {
    key: "prop-brand-identity", kind: "PROPOSAL", badge: "CUSTOM SCOPED", name: "Brand Identity", tone: "amber",
    description: "Full brand identity project — logo, color system, typography, guidelines.",
    priceHint: "₹45,000–₹1,20,000", fee: { structure: "Fixed Price", baseFee: 75000 },
    tags: ["Project Overview", "Scope of Work", "Deliverables", "Timeline", "Investment"],
    sections: [
      overview("A complete brand identity system: logo, color system, typography, and a concise brand guidelines document. This engagement covers the full visual foundation."),
      sec("scope", "Scope of Work", "list", ["Logo Design — 3 distinct directions, refined to 2 rounds", "Color System — primary, secondary, and neutral palette", "Typography System — display and body face with full type scale", "Brand Guidelines PDF — 20–30 pages covering all elements", "Figma source file with organised components and styles"]),
      sec("deliverables", "Deliverables", "list", ["Final logo pack (SVG, PNG, PDF)", "Brand guidelines document", "Figma source file"]),
      sec("timeline", "Timeline", "text", "4–6 weeks from kickoff, with weekly check-ins and two formal review rounds."),
      sec("investment", "Investment", "text", "Fixed price covering all scope items. 50% advance to start, 50% on delivery."),
    ],
    terms: ["Client owns all final files upon receipt of full payment.", "If project is cancelled after work begins, advance payment is non-refundable.", "Both parties agree to keep project details confidential.", "This agreement is governed by Indian law and the IT Act 2000.", "Invoices unpaid after 7 days incur a 2% monthly late fee.", "Up to 2 rounds of revisions included. One round – one consolidated feedback document. Additional revisions: ₹2,000/round."],
  },
  {
    key: "prop-uiux-design", kind: "PROPOSAL", badge: "MILESTONE-BASED", name: "UI/UX Design", tone: "blue",
    description: "End-to-end product design with discovery, wireframes, and high-fidelity UI.",
    priceHint: "₹60,000–₹2,00,000", fee: { structure: "Milestone", baseFee: 90000 },
    tags: ["Project Overview", "Scope of Work", "Milestones", "Timeline", "Investment"],
    sections: [
      overview("End-to-end product design: discovery and research, information architecture, wireframes, and a high-fidelity UI system ready for handoff to engineering."),
      sec("scope", "Scope of Work", "list", ["Discovery workshop + user flows", "Low-fidelity wireframes for all key screens", "High-fidelity UI with a reusable component library", "Interactive prototype for stakeholder review", "Developer handoff documentation"]),
      sec("milestones", "Milestones", "list", ["M1 — Discovery & flows (20%)", "M2 — Wireframes (30%)", "M3 — High-fidelity UI (40%)", "M4 — Handoff & QA support (10%)"]),
      sec("timeline", "Timeline", "text", "6–8 weeks across three design milestones with review gates."),
      sec("investment", "Investment", "text", "Milestone billing — each phase invoiced on sign-off of that milestone."),
    ],
    terms: ["Payment per milestone; work on the next milestone starts after payment.", "Client owns all final files upon receipt of full payment.", "Two revision rounds per milestone included.", "Scope changes are quoted separately before starting."],
  },
  {
    key: "prop-social-retainer", kind: "PROPOSAL", badge: "RETAINER", name: "Social Media Retainer", tone: "green",
    description: "Monthly social media design package with defined post counts and revision policy.",
    priceHint: "₹12,000–₹35,000/mo", fee: { structure: "Monthly Retainer", baseFee: 18000 },
    tags: ["Monthly Scope", "Deliverables", "Revision Policy", "Timeline", "Investment"],
    sections: [
      overview("A monthly retainer keeping the feed consistently designed: posts, stories, and campaign creatives within a defined volume."),
      sec("scope", "Monthly Scope", "list", ["Up to 12 feed posts / month", "Up to 8 story frames / month", "1 campaign creative set / month", "Template library so the team can self-serve"]),
      sec("deliverables", "Deliverables", "list", ["Source files (Figma / Canva)", "Exported ready-to-post assets", "Monthly content calendar handoff"]),
      sec("revisions", "Revision Policy", "text", "One consolidated feedback round per batch; additional rounds billed hourly."),
      sec("investment", "Investment", "text", "Flat monthly fee, billed on the 1st. Unused volume does not roll over."),
    ],
    terms: ["30-day rolling engagement; cancel with 15 days notice.", "Retainer fee is due at the start of each month.", "Priority turnaround included for approved campaigns."],
  },
  {
    key: "prop-logo-package", kind: "PROPOSAL", badge: "FIXED PACKAGE", name: "Logo Package", tone: "purple",
    description: "Fixed-scope logo design with 3 concepts and a complete brand starter kit.",
    priceHint: "₹15,000–₹40,000", fee: { structure: "Fixed Price", baseFee: 25000 },
    tags: ["Project Overview", "Scope of Work", "Deliverables", "Timeline"],
    sections: [
      overview("A focused logo engagement: three strong concepts, one refinement track, and everything needed to start using the mark."),
      sec("scope", "Scope of Work", "list", ["3 initial logo concepts", "2 refinement rounds on the chosen direction", "Primary, secondary, and monochrome lockups", "Brand starter sheet (colors + type)"]),
      sec("deliverables", "Deliverables", "list", ["SVG, PDF, PNG (transparent)", "Light and dark variants", "Usage one-pager"]),
      sec("timeline", "Timeline", "text", "2–3 weeks from kickoff."),
    ],
    terms: ["50% advance to start, 50% on delivery.", "Final files released after full payment.", "Two revision rounds included."],
  },
  {
    key: "prop-website-design", kind: "PROPOSAL", badge: "MILESTONE-BASED", name: "Website Design", tone: "red",
    description: "Website design proposal with page-by-page scope and launch support.",
    priceHint: "₹50,000–₹1,50,000", fee: { structure: "Milestone", baseFee: 80000 },
    tags: ["Project Overview", "Scope of Work", "Pages", "Timeline", "Investment"],
    sections: [
      overview("A marketing website designed page by page — home, service pages, and about — with a mobile-first design system and launch support."),
      sec("scope", "Scope of Work", "list", ["Up to 6 unique page designs", "Mobile-first responsive layouts", "Design system (type, color, components)", "Basic on-page SEO structure", "Launch support with the developer"]),
      sec("pages", "Pages", "list", ["Home", "Services (template)", "About", "Contact", "Blog index"]),
      sec("timeline", "Timeline", "text", "4–5 weeks: wireframes in week 1, design by week 3, handoff by week 4."),
    ],
    terms: ["Milestone payments: 30% advance, 40% on design sign-off, 30% on handoff.", "Content and images to be provided by the client.", "Two revision rounds per page included."],
  },
  {
    key: "prop-packaging-design", kind: "PROPOSAL", badge: "FIXED PACKAGE", name: "Packaging Design", tone: "amber",
    description: "Product packaging design for D2C brands with dieline-ready artwork.",
    priceHint: "₹30,000–₹90,000", fee: { structure: "Fixed Price", baseFee: 55000 },
    tags: ["Project Overview", "Scope of Work", "Deliverables", "Print Support"],
    sections: [
      overview("Shelf-ready packaging design: structure-aware artwork on supplied dielines, print-ready files, and a mockup kit for launch content."),
      sec("scope", "Scope of Work", "list", ["2 packaging variants (sizes or flavors)", "Dieline-ready artwork with bleed and finish layers", "FSSAI/regulatory info layout", "3D mockups for marketing"]),
      sec("deliverables", "Deliverables", "list", ["Print-ready PDFs (CMYK, outlined)", "Source AI/Figma files", "Mockup pack"]),
      sec("support", "Print Support", "text", "One pre-press proof review with the printer included."),
    ],
    terms: ["50% advance, 50% before final file release.", "Printer proofing charges (if any) borne by client.", "One proof-round revision included."],
  },
  {
    key: "contract-service", kind: "CONTRACT", badge: "FIXED PROJECT", name: "Design Service Agreement", tone: "brand",
    description: "Core freelance design contract — scope, payment, IP transfer, termination.",
    priceHint: "13 clauses", fee: { structure: "Fixed Price", baseFee: 75000 },
    tags: ["Parties", "Scope", "Fees", "IP", "Termination"],
    sections: [
      sec("parties", "Parties and Effective Date", "text", "This Agreement is made between the Designer and the Client, starting on the specified date and lasting until completed or terminated."),
      sec("scope", "Scope of Work", "text", "The Designer will deliver the services listed in Schedule A. Any additional work is quoted and approved in writing before starting."),
      sec("outofscope", "Out of Scope", "text", "Anything not listed in Schedule A is out of scope, including development, content writing, and stock asset licenses unless stated."),
      sec("fees", "Fees and Payment", "text", "The Client pays the fee listed in Schedule A: advance on signing, balance on completion. Invoices are payable within the feedback window."),
      sec("ip", "Intellectual Property", "text", "All rights in the final deliverables transfer to the Client on full payment. The Designer may display the work in their portfolio."),
      sec("termination", "Termination", "text", "Either party may terminate with written notice. On cancellation after kickoff, the advance is non-refundable and completed milestones are payable."),
    ],
    terms: [],
  },
  {
    key: "contract-retainer", kind: "CONTRACT", badge: "MONTHLY", name: "Retainer Agreement", tone: "green",
    description: "Ongoing monthly design retainer with volume, rollover, and pause terms.",
    priceHint: "Monthly fee", fee: { structure: "Monthly Retainer", baseFee: 18000 },
    tags: ["Monthly Scope", "Pausing", "Payment", "IP"],
    sections: [
      sec("parties", "Parties and Term", "text", "This retainer runs month to month between the Designer and the Client from the effective date."),
      sec("volume", "Monthly Scope", "text", "The monthly fee covers the volume defined each month in writing. Unused volume does not roll over beyond one month."),
      sec("payment", "Payment", "text", "The fee is invoiced on the 1st of each month and payable within 7 days."),
      sec("pause", "Pausing and Cancellation", "text", "Either party may pause or cancel with 15 days written notice."),
      sec("ip", "Intellectual Property", "text", "Deliverables transfer to the Client upon payment for the month in which they were created."),
    ],
    terms: [],
  },
  {
    key: "contract-nda", kind: "CONTRACT", badge: "STANDALONE", name: "Mutual NDA", tone: "blue",
    description: "Two-way confidentiality agreement for early client conversations.",
    priceHint: "Free to pair", fee: { structure: "Fixed Price", baseFee: 0 },
    tags: ["Confidentiality", "Term", "Exclusions"],
    sections: [
      sec("parties", "Parties", "text", "This NDA is between the Designer and the Client, effective on the signing date."),
      sec("obligation", "Confidentiality", "text", "Each party will keep the other's disclosed business, product, and client information confidential and use it only for the engagement."),
      sec("exclusions", "Exclusions", "text", "Information already public, independently developed, or lawfully received from a third party is not confidential."),
      sec("term", "Term", "text", "Obligations survive for 2 years after the engagement ends."),
    ],
    terms: [],
  },
  {
    key: "contract-website", kind: "CONTRACT", badge: "FIXED PROJECT", name: "Website Project Contract", tone: "purple",
    description: "Website build contract with milestones, launch, and maintenance terms.",
    priceHint: "Milestone billing", fee: { structure: "Milestone", baseFee: 80000 },
    tags: ["Milestones", "Launch", "Warranty", "Hosting"],
    sections: [
      sec("parties", "Parties and Effective Date", "text", "This Agreement is made between the Designer and the Client, starting on the specified date."),
      sec("scope", "Scope and Milestones", "text", "Work proceeds in the milestones listed in Schedule A. Each milestone is signed off before the next begins."),
      sec("fees", "Fees and Payment", "text", "Milestone invoices are payable within the feedback window. Late payments pause the project."),
      sec("launch", "Launch and Warranty", "text", "A 30-day bug-fix warranty starts at launch, covering defects in the delivered work, not new requests."),
      sec("hosting", "Hosting and Access", "text", "Client provides and pays for hosting and domains. Credentials remain the Client's property."),
    ],
    terms: [],
  },
];

export async function ensureDocTemplates() {
  for (const s of SEEDS) {
    await db.docTemplate.upsert({
      where: { key: s.key },
      update: {
        kind: s.kind, badge: s.badge, name: s.name, description: s.description,
        priceHint: s.priceHint, tone: s.tone, tags: s.tags, sections: s.sections,
        fee: s.fee, terms: s.terms, userId: null,
      },
      create: {
        key: s.key, kind: s.kind, badge: s.badge, name: s.name, description: s.description,
        priceHint: s.priceHint, tone: s.tone, tags: s.tags, sections: s.sections,
        fee: s.fee, terms: s.terms, userId: null,
      },
    });
  }
}
