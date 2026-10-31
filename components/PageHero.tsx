import type { ReactNode } from "react";
import { Container } from "./ui/Container";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-0 bg-dotted text-zinc-300 [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_70%)] dark:text-zinc-700" />
      <Container className="relative py-20 text-center sm:py-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
          {eyebrow}
        </p>
        <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
          {subtitle}
        </p>
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </section>
  );
}
