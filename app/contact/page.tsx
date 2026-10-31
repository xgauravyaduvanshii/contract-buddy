import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Questions about contracts, e-signatures or your team's workflow? Talk to the ContractBuddy team.",
};

const channels = [
  { icon: Mail, title: "Email us", body: "hello@contractbuddy.com", meta: "Replies within a day" },
  { icon: MessageSquare, title: "Live chat", body: "Chat with our team", meta: "Mon–Fri, 9am–6pm" },
  { icon: Phone, title: "Sales", body: "+1 (415) 555-0132", meta: "Enterprise & teams" },
  { icon: MapPin, title: "HQ", body: "548 Market St, San Francisco", meta: "California, USA" },
];

export default function ContactPage() {
  return (
    <div>
      <PageHero
        eyebrow="Contact"
        title="Let's talk about how you close work"
        subtitle="Whether you're a solo developer or an agency signing dozens of clients, we're here to help."
      />

      <Container className="pb-24">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Info */}
          <div className="lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              {channels.map((c) => (
                <div
                  key={c.title}
                  className="rounded-3xl border border-zinc-200/70 bg-white/70 p-5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold">{c.title}</h3>
                  <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {c.body}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{c.meta}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-3xl bg-brand-50 p-5 text-sm text-brand-800 dark:bg-brand-950/40 dark:text-brand-200">
              <Clock className="h-5 w-5 shrink-0" />
              Average first response time is under 4 hours during business days.
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="rounded-[2rem] border border-zinc-200/70 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/50">
              <form className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Full name" name="name" placeholder="Alex Rivera" />
                  <Input label="Email" name="email" type="email" placeholder="you@studio.com" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Company" name="company" placeholder="Optional" />
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      I&apos;m a…
                    </span>
                    <select
                      name="role"
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-zinc-700 dark:bg-zinc-950"
                    >
                      <option>Developer / Freelancer</option>
                      <option>Agency / Studio</option>
                      <option>Client hiring builders</option>
                      <option>Other</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    How can we help?
                  </span>
                  <textarea
                    name="message"
                    rows={5}
                    required
                    placeholder="Tell us about your project or question…"
                    className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
                <Button size="lg" className="w-full sm:w-auto">
                  Send message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

function Input({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="mt-1.5 h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-zinc-700 dark:bg-zinc-950"
      />
    </label>
  );
}
