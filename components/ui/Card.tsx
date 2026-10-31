import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-zinc-200/80 bg-white/80 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-600/5 dark:border-zinc-800 dark:bg-zinc-900/60 ${className}`}
    >
      {children}
    </div>
  );
}
