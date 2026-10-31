import type { Metadata } from "next";
import { Code2, Handshake, ShieldCheck, Target } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About us",
  description:
    "ContractBuddy is on a mission to make professional, legally-binding contracts effortless for every builder and their client.",
};

const values = [
  {
    icon: Target,
    title: "Clarity first",
    body: "Every contract should be understood by both sides before anyone signs. We design for plain, guided terms.",
  },
  {
    icon: ShieldCheck,
    title: "Trust by default",
    body: "Tamper-proof audit trails and secure signing aren't add-ons — they're the foundation of everything we build.",
  },
  {
    icon: Handshake,
    title: "Client-side delight",
    body: "Your client shouldn't need an account or a download. Signing should take seconds, on any device.",
  },
  {
    icon: Code2,
    title: "Built by builders",
    body: "Our team has freelanced, shipped agencies and chased signatures. We built the tool we always wanted.",
  },
];

const stats = [
  { value: "12k+", label: "Builders onboard" },
  { value: "180k+", label: "Contracts signed" },
  { value: "140+", label: "Countries" },
  { value: "4.9/5", label: "Average rating" },
];

const team = [
  { name: "Maya Chen", role: "Co-founder & CEO", initials: "MC" },
  { name: "Rohan Patel", role: "Co-founder & CTO", initials: "RP" },
  { name: "Lena Fischer", role: "Head of Product", initials: "LF" },
  { name: "Kwame Mensah", role: "Head of Legal Ops", initials: "KM" },
];

export default function AboutPage() {
  return (
    <div>
      <PageHero
        eyebrow="About us"
        title="We're making the handshake as solid as the contract"
        subtitle="ContractBuddy exists so that great project work starts on a clear, signed page — not an ambiguous DM."
      />

      <Container className="pb-8">
        <div className="grid gap-10 rounded-[2.5rem] border border-zinc-200/70 bg-white/70 p-8 backdrop-blur md:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Our story</h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-300">
              ContractBuddy started when two freelancers lost a lucrative project
              because the client never signed the agreement that was sitting in a
              shared doc. We realised the tools builders used to write code were
              miles ahead of the tools they used to close work.
            </p>
            <p className="mt-3 text-zinc-600 dark:text-zinc-300">
              So we built a workspace where a developer, designer or agency can
              turn a scoped project into a polished contract, send it with one
              link, and get a legally-binding signature before the first commit.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-3xl bg-gradient-to-br from-brand-50 to-white p-6 text-center dark:from-brand-950/40 dark:to-zinc-900"
              >
                <p className="text-3xl font-semibold text-brand-700 dark:text-brand-300">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>

      <section className="py-20">
        <Container>
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            What we believe
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <Card key={v.title}>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                  <v.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {v.body}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            The people behind ContractBuddy
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m) => (
              <div
                key={m.name}
                className="flex flex-col items-center rounded-3xl border border-zinc-200/70 bg-white/70 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-semibold text-white">
                  {m.initials}
                </span>
                <h3 className="mt-4 font-semibold">{m.name}</h3>
                <p className="text-sm text-zinc-500">{m.role}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-col items-center gap-4 rounded-[2.5rem] bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-14 text-center text-white">
            <h3 className="text-2xl font-semibold sm:text-3xl">
              Want to build the future of client work?
            </h3>
            <p className="max-w-xl text-brand-100">
              We&apos;re always talking to developers, designers and legal minds who
              care about doing deals the right way.
            </p>
            <Button
              href="/contact"
              className="!bg-white !text-brand-700 hover:!bg-brand-50"
              size="lg"
            >
              Get in touch
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
