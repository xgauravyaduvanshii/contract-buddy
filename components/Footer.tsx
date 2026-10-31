import Link from "next/link";
import { AtSign, Globe, MessageCircle } from "lucide-react";
import { Logo } from "./Logo";
import { Container } from "./ui/Container";
import { footerNav } from "./nav-config";

export function Footer() {
  return (
    <footer className="px-4 pb-6 pt-10 sm:px-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-zinc-200/70 bg-gradient-to-b from-white to-zinc-50 shadow-xl shadow-zinc-900/5 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
        <Container className="py-12">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
            <div className="col-span-2">
              <Logo />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Build, send and e-sign project contracts in minutes. The
                contract workspace built for developers, freelancers and the
                clients they work with.
              </p>
              <div className="mt-5 flex gap-2">
                {[AtSign, Globe, MessageCircle].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-zinc-700 dark:text-zinc-400"
                    aria-label="social link"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {footerNav.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-foreground">
                  {col.title}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-zinc-500 transition-colors hover:text-brand-600 dark:text-zinc-400"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-zinc-200/70 pt-6 text-sm text-zinc-500 sm:flex-row dark:border-zinc-800">
            <p>© 2026 ContractBuddy. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-brand-600">
                Terms
              </Link>
              <Link href="/terms" className="hover:text-brand-600">
                Privacy
              </Link>
              <Link href="/contact" className="hover:text-brand-600">
                Contact
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
