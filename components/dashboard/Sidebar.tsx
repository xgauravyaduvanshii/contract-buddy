"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, FolderKanban, Settings, Plus, FileSignature, LogOut, ShieldCheck, MessageSquare,
} from "lucide-react";
import { apiGet } from "@/lib/client";

type Thread = { id: string; title: string; updatedAt: string };
type User = { id: string; email: string; name: string | null; role: string; image: string | null };

const NAV = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ user }: { user: User }) {
  const router = useRouter();
  const pathname = usePathname();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let alive = true;
    apiGet<{ threads: Thread[] }>("/api/threads").then((r) => {
      if (alive && r.ok && r.data) setThreads(r.data.threads);
    });
    return () => {
      alive = false;
    };
  }, [pathname]);

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST", credentials: "same-origin" });
    router.push("/");
    router.refresh();
  }

  const active = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <aside className="hidden w-64 shrink-0 md:block">
      <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 backdrop-blur">
        <Link href="/" className="mb-4 flex items-center gap-2 px-1 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <FileSignature className="h-5 w-5" />
          </span>
          ContractBuddy
        </Link>

        <button
          onClick={() => router.push("/dashboard")}
          className="mb-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> New chat
        </button>

        <nav className="space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                active(n.href)
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              }`}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>

        <div className="mt-4 border-t border-zinc-800 pt-3">
          <button
            onClick={() => setOpen((o) => !o)}
            className="mb-2 flex w-full items-center justify-between px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            Recent chats <span className="text-zinc-600">{open ? "–" : "+"}</span>
          </button>
          {open && (
            <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
              {threads.length === 0 && (
                <p className="px-3 py-2 text-xs text-zinc-600">No chats yet.</p>
              )}
              {threads.map((t) => (
                <Link
                  key={t.id}
                  href={`/dashboard?thread=${t.id}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800/60 hover:text-zinc-200"
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{t.title || "Untitled"}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto pt-3">
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-brand-300 transition hover:bg-brand-950/40"
            >
              <ShieldCheck className="h-4 w-4" /> Admin panel
            </Link>
          )}
          <div className="flex items-center gap-3 rounded-xl bg-zinc-800/60 px-3 py-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600/20 text-sm font-semibold text-brand-300">
              {(user.name || user.email).slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">{user.name || "Account"}</p>
              <p className="truncate text-xs text-zinc-500">{user.email}</p>
            </div>
            <button onClick={signOut} title="Sign out" className="text-zinc-500 hover:text-brand-400">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
