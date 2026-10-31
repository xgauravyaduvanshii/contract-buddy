"use client";

import { useCallback, useEffect, useState } from "react";
import { Wand2, Plug, Palette, User as UserIcon, Check, Plus, Trash2 } from "lucide-react";
import { apiGet, apiSend } from "@/lib/client";

type User = { id: string; email: string; name: string | null; role: string };
type Skill = { id: string; name: string; description: string | null; category: string; installed: boolean; global: boolean };
type Plugin = { id: string; name: string; description: string | null };
type DS = { id: string; name: string; tokens: Record<string, string>; global: boolean };

const TABS = [
  { id: "skills", label: "Skills", icon: Wand2 },
  { id: "plugins", label: "Plugins", icon: Plug },
  { id: "design", label: "Design system", icon: Palette },
  { id: "account", label: "Account", icon: UserIcon },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsView({ user }: { user: User }) {
  const [tab, setTab] = useState<TabId>("skills");

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">Manage your skills, plugins, contract design systems and account.</p>

        <div className="mt-6 flex gap-1 border-b border-zinc-800">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                tab === t.id ? "border-brand-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "skills" && <SkillsTab />}
          {tab === "plugins" && <PluginsTab />}
          {tab === "design" && <DesignTab />}
          {tab === "account" && <AccountTab user={user} />}
        </div>
      </div>
    </div>
  );
}

function SkillsTab() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(() => {
    apiGet<{ skills: Skill[] }>("/api/skills").then((r) => r.ok && r.data && setSkills(r.data.skills));
  }, []);
  useEffect(load, [load]);

  async function toggle(s: Skill) {
    setBusy(s.id);
    await apiSend(`/api/skills/${s.id}/install`, "POST");
    load();
    setBusy(null);
  }

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-400">Install skills so ContractBuddy can automatically apply them when relevant.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {skills.map((s) => (
          <div key={s.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-medium text-zinc-100">{s.name}</h3>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-brand-400">{s.category}</p>
                {s.description && <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{s.description}</p>}
              </div>
              {s.global ? (
                <span className="shrink-0 rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">Always on</span>
              ) : (
                <button
                  onClick={() => toggle(s)}
                  disabled={busy === s.id}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    s.installed ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-brand-600 text-white hover:bg-brand-700"
                  }`}
                >
                  {s.installed ? "Installed" : "Install"}
                </button>
              )}
            </div>
          </div>
        ))}
        {skills.length === 0 && <p className="text-sm text-zinc-500">No skills available yet.</p>}
      </div>
    </div>
  );
}

function PluginsTab() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  useEffect(() => {
    apiGet<{ plugins: Plugin[] }>("/api/plugins").then((r) => r.ok && r.data && setPlugins(r.data.plugins));
  }, []);
  return (
    <div>
      <p className="mb-4 text-sm text-zinc-400">Plugins are enabled workspace-wide by your admin. Available integrations:</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {plugins.map((p) => (
          <div key={p.id} className="flex items-start justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div>
              <h3 className="font-medium text-zinc-100">{p.name}</h3>
              {p.description && <p className="mt-1 text-sm text-zinc-400">{p.description}</p>}
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
              <Check className="h-3 w-3" /> On
            </span>
          </div>
        ))}
        {plugins.length === 0 && <p className="text-sm text-zinc-500">No plugins enabled.</p>}
      </div>
    </div>
  );
}

function DesignTab() {
  const [systems, setSystems] = useState<DS[]>([]);
  const [name, setName] = useState("");
  const [colors, setColors] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    apiGet<{ systems: (DS & { userId: string | null })[] }>("/api/design-systems").then((r) => {
      if (r.ok && r.data) setSystems(r.data.systems.map((s) => ({ ...s, global: s.userId === null })));
    });
  }, []);
  useEffect(load, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const tokens: Record<string, string> = {};
    colors
      .split(/[,\n]/)
      .map((c) => c.trim())
      .filter(Boolean)
      .forEach((c, i) => (tokens[`color${i + 1}`] = c));
    await apiSend<{ system: DS }>("/api/design-systems", "POST", { name, tokens: { palette: tokens } });
    setName("");
    setColors("");
    setBusy(false);
    load();
  }

  async function remove(id: string) {
    await apiSend(`/api/design-systems/${id}`, "DELETE");
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <p className="mb-4 text-sm text-zinc-400">Design systems tell the AI how to style your contracts — colors, typography and tone.</p>
        <div className="space-y-3">
          {systems.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div>
                <h3 className="font-medium text-zinc-100">{s.name}</h3>
                <div className="mt-2 flex gap-1.5">
                  {Object.entries(s.tokens?.palette || {})
                    .slice(0, 6)
                    .map(([k, v]) => (
                      <span key={k} className="h-5 w-5 rounded-full border border-zinc-700" style={{ background: String(v) }} />
                    ))}
                </div>
              </div>
              {!s.global && (
                <button onClick={() => remove(s.id)} className="text-zinc-600 hover:text-brand-400" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {systems.length === 0 && <p className="text-sm text-zinc-500">No design systems yet.</p>}
        </div>
      </div>
      <form onSubmit={create} className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-3 font-medium text-zinc-100">New design system</h3>
        <label className="block">
          <span className="text-sm text-zinc-300">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="My brand" className="mt-1.5 h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none focus:border-brand-500" />
        </label>
        <label className="mt-3 block">
          <span className="text-sm text-zinc-300">Brand colors (comma-separated hex)</span>
          <input value={colors} onChange={(e) => setColors(e.target.value)} placeholder="#dc2626, #0b0b0f, #f87171" className="mt-1.5 h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none focus:border-brand-500" />
        </label>
        <button type="submit" disabled={busy || !name.trim()} className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50">
          <Plus className="h-4 w-4" /> Save design system
        </button>
      </form>
    </div>
  );
}

function AccountTab({ user }: { user: User }) {
  return (
    <div className="max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600/20 text-lg font-semibold text-brand-300">
          {(user.name || user.email).slice(0, 1).toUpperCase()}
        </span>
        <div>
          <h3 className="text-lg font-medium text-zinc-100">{user.name || "Unnamed"}</h3>
          <p className="text-sm text-zinc-400">{user.email}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-brand-400">{user.role}</p>
        </div>
      </div>
      <p className="mt-5 text-sm text-zinc-500">
        Manage your subscriptions and security via the sidebar. To reset your password, use the forgot-password flow from the sign-in page.
      </p>
    </div>
  );
}
