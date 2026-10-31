import type { ReactNode } from "react";
import Link from "next/link";
import { FileSignature, ShieldCheck, Sparkles, Zap } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <section className="relative py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-dotted text-zinc-300 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_75%)] dark:text-zinc-700" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-2 lg:items-center lg:px-8">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between rounded-[2.5rem] bg-gradient-to-br from-brand-600 to-brand-800 p-10 text-white shadow-2xl shadow-brand-600/20 lg:flex">
          <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] bg-dotted-sm text-white/10" />
          <Link href="/" className="relative flex items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <FileSignature className="h-5 w-5" />
            </span>
            ContractBuddy
          </Link>
          <div className="relative space-y-6">
            <h2 className="text-3xl font-semibold leading-tight">
              The contract workspace for builders and their clients.
            </h2>
            <ul className="space-y-3 text-brand-100">
              {[
                { icon: Sparkles, t: "Draft professional contracts in minutes" },
                { icon: Zap, t: "Send a secure signing link — no client account" },
                { icon: ShieldCheck, t: "Legally-binding, audit-verified signatures" },
              ].map((f) => (
                <li key={f.t} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                    <f.icon className="h-4 w-4" />
                  </span>
                  {f.t}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative text-sm text-brand-200">
            “Signed my first project before the kickoff call.” — a happy freelancer
          </p>
        </div>

        {/* Form panel */}
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-[2rem] border border-zinc-200/70 bg-white/80 p-8 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
            <div className="mt-7">{children}</div>
            <div className="mt-6 text-center text-sm text-zinc-500">
              {footer}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Field({
  label,
  type = "text",
  placeholder,
  name,
  hint,
  href,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  name: string;
  hint?: string;
  href?: string;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
        {hint && href && (
          <Link href={href} className="text-xs font-medium text-brand-600 hover:underline">
            {hint}
          </Link>
        )}
      </div>
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
