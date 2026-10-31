import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  Clock,
  Code2,
  FileSignature,
  PenLine,
  Quote,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const features = [
  {
    icon: PenLine,
    title: "Build contracts that close",
    body: "Drag-and-drop clauses, smart fields and legal-ready templates to draft a professional project contract in minutes — no lawyer required.",
  },
  {
    icon: Send,
    title: "Send to clients instantly",
    body: "Share a secure signing link by email or message. Track views in real time so you always know where your client is.",
  },
  {
    icon: ShieldCheck,
    title: "Legally-binding e-signatures",
    body: "Every signature carries a tamper-proof audit trail, timestamps and identity proof that hold up wherever you work.",
  },
  {
    icon: Zap,
    title: "Automated reminders",
    body: "Unsigned contract? ContractBuddy nudges your client politely so deals don't stall waiting on a signature.",
  },
  {
    icon: FileSignature,
    title: "Reusable templates",
    body: "Save your best contracts as templates. Reuse scope, payment and IP clauses on every new project.",
  },
  {
    icon: Users,
    title: "Built for teams",
    body: "Invite collaborators, set approval roles and keep every client contract organised in one shared workspace.",
  },
];

const steps = [
  {
    title: "Draft your contract",
    body: "Pick a template and fill guided fields for scope, deliverables, timeline and payment terms.",
  },
  {
    title: "Send for signature",
    body: "Generate a secure signing link and send it to your client — no account needed on their side.",
  },
  {
    title: "Get it signed",
    body: "Your client signs in seconds. Both of you get a stamped, binding copy instantly.",
  },
];

const audiences = [
  { icon: Code2, label: "Developers & Engineers" },
  { icon: Building2, label: "Agencies & Studios" },
  { icon: Users, label: "Freelancers & Consultants" },
];

const templates = [
  "Web Development Agreement",
  "Fixed-Price Project Contract",
  "Retainer / Monthly Services",
  "Software SOW",
  "Design & Branding Contract",
  "Independent Contractor Agreement",
];

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/forever",
    tagline: "For solo builders getting their first deal signed.",
    features: ["5 contracts / month", "E-signature", "2 templates", "Audit trail"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    tagline: "For freelancers and devs shipping client work every week.",
    features: [
      "Unlimited contracts",
      "Custom templates",
      "Auto reminders",
      "Branded signing pages",
      "Payments add-ons",
    ],
    cta: "Start 14-day trial",
    highlight: true,
  },
  {
    name: "Team",
    price: "$49",
    period: "/month",
    tagline: "For agencies managing many clients and collaborators.",
    features: ["Everything in Pro", "Team workspace & roles", "Approval flows", "Priority support"],
    cta: "Talk to us",
    highlight: false,
  },
];

const testimonials = [
  {
    quote:
      "I used to lose days chasing clients for signatures. Now a project is contracted and signed before the kickoff call.",
    name: "Aarav Mehta",
    role: "Full-stack Freelancer",
  },
  {
    quote:
      "Our agency runs every client agreement through ContractBuddy. The audit trail alone saved us during a dispute.",
    name: "Sofia Ramirez",
    role: "Studio Owner",
  },
  {
    quote:
      "As a contractor, sending a clean, professional contract makes me look bigger than I am. Clients sign faster.",
    name: "Daniel Okoro",
    role: "Software Consultant",
  },
];

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 bg-dotted text-zinc-300 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)] dark:text-zinc-700" />
        <div className="animate-float-slow pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-brand-300/40 blur-[120px] dark:bg-brand-800/30" />

        <Container className="relative grid items-center gap-14 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300">
              <Sparkles className="h-3.5 w-3.5" />
              Contracts & e-signatures for builders
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Turn project chats into{" "}
              <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                signed contracts
              </span>{" "}
              in minutes.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
              ContractBuddy helps developers, freelancers and agencies build a
              professional contract, send it to the client, and collect a
              legally-binding signature — so the work starts on a solid page, not
              a vague message.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button href="/signup" size="lg">
                Create your first contract
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="/signin" variant="outline" size="lg">
                Sign in
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
              {audiences.map((a) => (
                <div
                  key={a.label}
                  className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400"
                >
                  <a.icon className="h-4 w-4 text-brand-500" />
                  {a.label}
                </div>
              ))}
            </div>
          </div>

          {/* Mock contract signing card */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-tr from-brand-500/20 via-transparent to-accent/20 blur-2xl" />
            <Card className="relative !p-0">
              <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-950">
                    <FileSignature className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      Web Development Agreement
                    </p>
                    <p className="text-xs text-zinc-500">
                      Pending client signature
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                  <Clock className="h-3 w-3" /> Viewing
                </span>
              </div>

              <div className="space-y-3 px-6 py-5">
                {[
                  { k: "Client", v: "Northwind Studio" },
                  { k: "Scope", v: "Marketing site + CMS" },
                  { k: "Total", v: "$8,400" },
                  { k: "Timeline", v: "6 weeks" },
                ].map((row) => (
                  <div
                    key={row.k}
                    className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 text-sm dark:bg-zinc-800/60"
                  >
                    <span className="text-zinc-500">{row.k}</span>
                    <span className="font-medium">{row.v}</span>
                  </div>
                ))}
              </div>

              <div className="mx-6 mb-6 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50 p-5 dark:border-brand-900 dark:bg-brand-950/30">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-medium text-brand-700 dark:text-brand-300">
                      Signature
                    </p>
                    <p className="mt-1 font-[cursive] text-2xl text-foreground">
                      Alex Rivera
                    </p>
                  </div>
                  <BadgeCheck className="h-7 w-7 text-accent" />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Signed &amp; sealed · Oct 30, 2026 · audit-verified
                </p>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {/* TRUST BAR */}
      <Container>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 rounded-3xl border border-zinc-200/70 bg-white/60 px-8 py-6 text-sm text-zinc-500 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/40">
          <span className="font-semibold uppercase tracking-widest text-zinc-400">
            Trusted by 12,000+ builders
          </span>
          {["Northwind", "Pixelforge", "Kite Labs", "Basalt", "Loop&Co"].map(
            (b) => (
              <span key={b} className="font-semibold text-zinc-600 dark:text-zinc-300">
                {b}
              </span>
            )
          )}
        </div>
      </Container>

      {/* FEATURES */}
      <section id="features" className="scroll-mt-28 py-24">
        <Container>
          <SectionHeading
            eyebrow="Everything you need"
            title="From first draft to final signature"
            subtitle="One workspace to write, share, sign and store every client contract."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title}>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {f.body}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-28 py-8">
        <Container>
          <div className="relative rounded-[2.5rem] bg-dotted-sm text-zinc-300 dark:text-zinc-700">
            <div className="rounded-[2.5rem] bg-gradient-to-b from-white to-zinc-50 px-6 py-16 dark:from-zinc-900 dark:to-zinc-950">
              <SectionHeading
                eyebrow="How it works"
                title="Three steps to a signed deal"
                subtitle="No downloads. No account required for your client."
              />
              <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
                {steps.map((s, i) => (
                  <div
                    key={s.title}
                    className="relative rounded-3xl border border-zinc-200/70 bg-white/80 p-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-lg font-semibold text-white shadow-md shadow-brand-600/30">
                      {i + 1}
                    </span>
                    <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {s.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* TEMPLATES */}
      <section id="templates" className="scroll-mt-28 py-24">
        <Container>
          <SectionHeading
            eyebrow="Templates"
            title="Start from a contract that already works"
            subtitle="Legal-reviewed starting points for the way builders actually get paid."
          />
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {templates.map((t) => (
              <span
                key={t}
                className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-brand-400 hover:text-brand-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {t}
              </span>
            ))}
          </div>
        </Container>
      </section>

      {/* PRICING */}
      <section id="pricing" className="scroll-mt-28 py-16">
        <Container>
          <SectionHeading
            eyebrow="Pricing"
            title="Simple plans that scale with your clients"
            subtitle="Start free. Upgrade when the deals start rolling in."
          />
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-3xl border p-7 transition ${
                  p.highlight
                    ? "border-brand-500 bg-white shadow-2xl shadow-brand-600/10 ring-1 ring-brand-500 dark:bg-zinc-900"
                    : "border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/50"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold">{p.price}</span>
                  <span className="text-sm text-zinc-500">{p.period}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {p.tagline}
                </p>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  href="/signup"
                  variant={p.highlight ? "primary" : "outline"}
                  className="mt-8 w-full"
                >
                  {p.cta}
                </Button>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24">
        <Container>
          <SectionHeading
            eyebrow="Loved by builders"
            title="Contracts that close, clients that trust you"
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="flex flex-col">
                <Quote className="h-8 w-8 text-brand-200 dark:text-brand-800" />
                <div className="mt-2 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  “{t.quote}”
                </p>
                <div className="mt-6">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <Container>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-16 text-center shadow-2xl shadow-brand-600/30">
            <div className="pointer-events-none absolute inset-0 bg-dotted-sm text-white/20" />
            <div className="relative">
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Your next project deserves a real contract.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-brand-100">
                Create an account, pick a template and send your first contract
                for signature before your next standup.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button
                  href="/signup"
                  size="lg"
                  className="!bg-white !text-brand-700 hover:!bg-brand-50"
                >
                  Get started free
                </Button>
                <Button
                  href="/contact"
                  size="lg"
                  variant="ghost"
                  className="!text-white hover:!bg-white/10"
                >
                  Talk to our team
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">{subtitle}</p>
      )}
    </div>
  );
}
