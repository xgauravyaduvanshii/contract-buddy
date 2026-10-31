"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "./ui/Button";
import { mainNav } from "./nav-config";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border border-zinc-200/70 bg-white/70 px-4 py-2.5 shadow-lg shadow-zinc-900/5 backdrop-blur-xl sm:px-5 dark:border-zinc-800 dark:bg-zinc-900/70">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-foreground dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button href="/signin" variant="ghost" size="sm">
            Sign in
          </Button>
          <Button href="/signup" size="sm">
            Get started
          </Button>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 lg:hidden dark:border-zinc-700 dark:text-zinc-200"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="mx-auto mt-2 max-w-7xl rounded-3xl border border-zinc-200/70 bg-white/95 p-4 shadow-xl backdrop-blur-xl lg:hidden dark:border-zinc-800 dark:bg-zinc-900/95">
          <nav className="flex flex-col gap-1">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            <Button href="/signin" variant="outline" size="md">
              Sign in
            </Button>
            <Button href="/signup" size="md">
              Get started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
