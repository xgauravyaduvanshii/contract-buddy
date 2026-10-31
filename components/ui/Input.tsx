"use client";

import type { InputHTMLAttributes } from "react";

export function Input({
  label,
  hint,
  className = "",
  ...rest
}: {
  label: string;
  hint?: React.ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
        {hint}
      </div>
      <input
        {...rest}
        className={`mt-1.5 h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-zinc-700 dark:bg-zinc-950 ${className}`}
      />
    </label>
  );
}

export function FormError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-2.5 text-sm text-brand-600 dark:text-brand-400">
      {msg}
    </div>
  );
}

export function FormNote({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400">
      {msg}
    </div>
  );
}
