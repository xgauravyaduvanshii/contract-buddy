"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, FolderKanban, Settings, Plus, FileSignature, LogOut, ShieldCheck, MessageSquare,
  Star, Pencil, Archive, Trash2, Undo2, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { apiGet, apiSend } from "@/lib/client";

type Thread = { id: string; title: string; starred: boolean; updatedAt: string };
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
  const [collapsed, setCollapsed] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [deleted, setDeleted] = useState<Thread | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(localStorage.getItem("cb_sidebar_collapsed") === "1");
    setOpen(localStorage.getItem("cb_sidebar_recent") !== "0");
  }, []);

  useEffect(() => {
    let alive = true;
    apiGet<{ threads: Thread[] }>("/api/threads").then((r) => {
      if (alive && r.ok && r.data) setThreads(r.data.threads);
    });
    return () => {
      alive = false;
    };
  }, [pathname]);

  function toggleCollapse() {
    setCollapsed((c) => {
      localStorage.setItem("cb_sidebar_collapsed", c ? "0" : "1");
      return !c;
    });
  }

  function toggleOpen() {
    setOpen((o) => {
      localStorage.setItem("cb_sidebar_recent", o ? "0" : "1");
      return !o;
    });
  }

  async function patchThread(id: string, patch: Record<string, unknown>) {
    await apiSend(`/api/threads/${id}`, "PATCH", patch);
    const r = await apiGet<{ threads: Thread[] }>("/api/threads");
    if (r.ok && r.data) setThreads(r.data.threads);
    router.refresh();
  }

  async function removeThread(t: Thread) {
    await apiSend(`/api/threads/${t.id}`, "DELETE");
    setThreads((list) => list.filter((x) => x.id !== t.id));
    setDeleted(t);
    router.refresh();
  }

  async function undoDelete() {
    if (!deleted) return;
    await apiSend(`/api/threads/${deleted.id}/restore`, "POST");
    setDeleted(null);
    const r = await apiGet<{ threads: Thread[] }>("/api/threads");
    if (r.ok && r.data) setThreads(r.data.threads);
    router.refresh();
  }

  async function commitRename(id: string) {
    const title = renameVal.trim();
    setRenaming(null);
    if (title) await patchThread(id, { title });
  }

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST", credentials: "same-origin" });
    router.push("/");
    router.refresh();
  }

  const active = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  // ── Collapsed rail ──────────────────────────────────────────
  if (collapsed) {
    return (
      <aside className="hidden w-16 shrink-0 md:block">
        <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col items-center rounded-3xl border border-zinc-800 bg-zinc-900/70 p-3 backdrop-blur">
          <button onClick={toggleCollapse} title="Expand sidebar" className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <FileSignature className="h-5 w-5" />
          </button>
          <button onClick={() => router.push("/dashboard")} title="New chat" className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600/15 text-brand-300 transition hover:bg-brand-600/25">
            <Plus className="h-4 w-4" />
          </button>
          <nav className="flex flex-col items-center gap-1.5">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                title={n.label}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                  active(n.href) ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
              >
                <n.icon className="h-4 w-4" />
              </Link>
            ))}
          </nav>
          <button onClick={toggleCollapse} title="Expand" className="mt-2 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200">
            <ChevronsRight className="h-4 w-4" />
          </button>
          <div className="mt-auto flex flex-col items-center gap-2">
            {user.role === "ADMIN" && (
              <Link href="/admin" title="Admin panel" className="flex h-9 w-9 items-center justify-center rounded-xl text-brand-300 transition hover:bg-brand-950/40">
                <ShieldCheck className="h-4 w-4" />
              </Link>
            )}
            <span title={user.name || user.email} className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600/20 text-sm font-semibold text-brand-300">
              {(user.name || user.email).slice(0, 1).toUpperCase()}
            </span>
          </div>
        </div>
      </aside>
    );
  }

  // ── Expanded sidebar ────────────────────────────────────────
  return (
    <aside className="hidden w-64 shrink-0 md:block">
      <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 backdrop-blur">
        <div className="mb-4 flex items-center justify-between px-1">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <FileSignature className="h-5 w-5" />
            </span>
            ContractBuddy
          </Link>
          <button onClick={toggleCollapse} title="Collapse sidebar" className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200">
            <ChevronsLeft className="h-4 w-4" />
          </button>
        </div>

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

        <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-zinc-800 pt-3">
          <button
            onClick={toggleOpen}
            className="mb-2 flex w-full items-center justify-between px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            Recent chats <span className="text-zinc-600">{open ? "–" : "+"}</span>
          </button>
          {open && (
            <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto scrollbar-slim pr-1">
              {threads.length === 0 && <p className="px-3 py-2 text-xs text-zinc-600">No chats yet.</p>}
              {threads.map((t) =>
                renaming === t.id ? (
                  <input
                    key={t.id}
                    autoFocus
                    value={renameVal}
                    onChange={(e) => setRenameVal(e.target.value)}
                    onBlur={() => commitRename(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(t.id);
                      if (e.key === "Escape") setRenaming(null);
                    }}
                    className="w-full rounded-lg border border-brand-500/50 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 outline-none"
                  />
                ) : (
                  <div key={t.id} className="group flex items-center gap-1 rounded-lg pr-1 transition hover:bg-zinc-800/60">
                    <Link
                      href={`/dashboard?thread=${t.id}`}
                      className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-sm text-zinc-400 transition group-hover:text-zinc-200"
                    >
                      {t.starred ? (
                        <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                      ) : (
                        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate">{t.title || "Untitled"}</span>
                    </Link>
                    <div className="hidden items-center gap-0.5 group-hover:flex">
                      <button
                        title={t.starred ? "Unfavorite" : "Favorite"}
                        onClick={() => patchThread(t.id, { starred: !t.starred })}
                        className={`flex h-6 w-6 items-center justify-center rounded-md hover:bg-zinc-700 ${t.starred ? "text-amber-400" : "text-zinc-500"}`}
                      >
                        <Star className={`h-3 w-3 ${t.starred ? "fill-amber-400" : ""}`} />
                      </button>
                      <button
                        title="Rename"
                        onClick={() => {
                          setRenaming(t.id);
                          setRenameVal(t.title);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-700"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        title="Archive"
                        onClick={() => patchThread(t.id, { archived: true })}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-700"
                      >
                        <Archive className="h-3 w-3" />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => removeThread(t)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-700 hover:text-brand-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {deleted && (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-300">
            <Undo2 className="h-3.5 w-3.5 shrink-0 text-brand-400" />
            <span className="min-w-0 flex-1 truncate">&ldquo;{deleted.title}&rdquo; deleted</span>
            <button onClick={undoDelete} className="shrink-0 rounded-md bg-brand-600 px-2 py-1 font-medium text-white hover:bg-brand-700">
              Undo
            </button>
          </div>
        )}

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
