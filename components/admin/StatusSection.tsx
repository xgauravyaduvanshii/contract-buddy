"use client";

import { useEffect, useState } from "react";
import { Users, FolderKanban, MessageSquare, FileSignature, Megaphone, Wand2, Plug, Database, Mail, Cpu, KeyRound } from "lucide-react";
import { apiGet } from "@/lib/client";

type Status = {
  counts: { users: number; projects: number; threads: number; messages: number; contracts: number; activeNotices: number; skills: number; plugins: number };
  health: { database: string; smtp: string; xrouter: string; modelCount: number; apiKeySet: boolean; baseUrl: string };
};

const CARDS = [
  { key: "users", label: "Users", icon: Users },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "threads", label: "Chats", icon: MessageSquare },
  { key: "messages", label: "Messages", icon: FileSignature },
  { key: "activeNotices", label: "Active notices", icon: Megaphone },
  { key: "skills", label: "Skills", icon: Wand2 },
  { key: "plugins", label: "Plugins", icon: Plug },
  { key: "contracts", label: "Contracts", icon: FileSignature },
] as const;

export function StatusSection() {
  const [data, setData] = useState<Status | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Status>("/api/admin/status").then((r) => {
      if (r.ok && r.data) setData(r.data);
      else setErr(r.error || "Failed to load");
    });
  }, []);

  if (err) return <p className="text-sm text-brand-400">{err}</p>;
  if (!data) return <p className="text-sm text-zinc-500">Loading system status…</p>;

  const health = [
    { label: "Database", value: data.health.database, icon: Database, ok: data.health.database === "connected" },
    { label: "SMTP email", value: data.health.smtp, icon: Mail, ok: data.health.smtp === "configured" },
    { label: "AI provider", value: data.health.xrouter, icon: Cpu, ok: data.health.xrouter === "reachable" },
    { label: "API key", value: data.health.apiKeySet ? "set" : "not set", icon: KeyRound, ok: data.health.apiKeySet },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CARDS.map((c) => (
          <div key={c.key} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <c.icon className="h-5 w-5 text-brand-400" />
            <p className="mt-3 text-2xl font-semibold text-white">{data.counts[c.key]}</p>
            <p className="text-xs text-zinc-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">System health</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {health.map((h) => (
            <div key={h.label} className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${h.ok ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                <h.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-100">{h.label}</p>
                <p className="text-xs text-zinc-500">{h.value}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-600">Base URL: {data.health.baseUrl} · Models available: {data.health.modelCount}</p>
      </div>
    </div>
  );
}
