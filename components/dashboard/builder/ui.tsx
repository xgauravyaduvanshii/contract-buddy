"use client";

import { X, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export const TONES: Record<string, string> = {
  brand: "bg-brand-500",
  amber: "bg-amber-400",
  blue: "bg-sky-400",
  green: "bg-emerald-400",
  purple: "bg-violet-400",
  red: "bg-rose-400",
};

export function toneDot(tone?: string | null) {
  return TONES[tone || "brand"] || TONES.brand;
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className={`relative flex max-h-[88vh] w-full ${wide ? "max-w-3xl" : "max-w-md"} flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl`}
      >
        <div className="flex items-start justify-between border-b border-zinc-800 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-zinc-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 scrollbar-slim">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      {children && <div className="mt-1.5">{children}</div>}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "h-10 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25";
export const textareaCls =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25";

export function Pill({ children, tone = "zinc" }: { children: ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    zinc: "bg-zinc-800 text-zinc-300",
    brand: "bg-brand-500/15 text-brand-300",
    green: "bg-emerald-500/15 text-emerald-300",
    amber: "bg-amber-500/15 text-amber-300",
    red: "bg-red-500/15 text-red-300",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tones[tone] || tones.zinc}`}>{children}</span>;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-zinc-500">
      <Loader2 className="h-4 w-4 animate-spin" /> {label || "Loading…"}
    </span>
  );
}

export function ErrorNote({ text }: { text: string }) {
  return <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{text}</div>;
}

export function EmptyBox({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/30 p-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600/15 text-brand-400">{icon}</span>
      <h3 className="mt-3 font-medium text-zinc-200">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">{sub}</p>
    </div>
  );
}

// Breadcrumb header used by all builder screens: "Proposal Builder › Title" + actions.
export function BuilderHeader({
  crumb,
  title,
  onCrumbClick,
  actions,
}: {
  crumb: string;
  title: string;
  onCrumbClick?: () => void;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        {onCrumbClick ? (
          <button onClick={onCrumbClick} className="shrink-0 text-zinc-500 transition hover:text-zinc-300">
            {crumb}
          </button>
        ) : (
          <span className="shrink-0 text-zinc-500">{crumb}</span>
        )}
        <span className="shrink-0 text-zinc-700">›</span>
        <span className="truncate font-medium text-white">{title}</span>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}

export const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-brand-500/50 hover:text-brand-300 disabled:opacity-50";
export const solidBtn =
  "inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700 disabled:opacity-50";
