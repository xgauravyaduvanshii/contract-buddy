"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, X, Wand2, Plug } from "lucide-react";
import { apiGet, apiSend } from "@/lib/client";

type Skill = { id: string; name: string; description: string | null; category: string; instructions: string | null; enabled: boolean; _count?: { installs: number } };
type Plugin = { id: string; name: string; description: string | null; enabled: boolean };

export function SkillsSection() {
  return <Catalog kind="skills" />;
}
export function PluginsSection() {
  return <Catalog kind="plugins" />;
}

function Catalog({ kind }: { kind: "skills" | "plugins" }) {
  const isSkill = kind === "skills";
  const [items, setItems] = useState<(Skill | Plugin)[]>([]);
  const [show, setShow] = useState(false);
  const load = useCallback(() => {
    apiGet<{ skills?: Skill[]; plugins?: Plugin[] }>(isSkill ? "/api/admin/skills" : "/api/admin/plugins").then((r) => {
      if (r.ok && r.data) setItems((r.data.skills || r.data.plugins || []) as (Skill | Plugin)[]);
    });
  }, [isSkill]);
  useEffect(load, [load]);

  async function toggle(id: string, enabled: boolean) {
    await apiSend(`/api/admin/${kind}/${id}`, "PATCH", { enabled: !enabled });
    load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this item?")) return;
    await apiSend(`/api/admin/${kind}/${id}`, "DELETE");
    load();
  }

  const field = "mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-500";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {isSkill
            ? "Global skills are always available to users. Add instructions so the AI applies them automatically."
            : "Enabled plugins become selectable in every user's + menu."}
        </p>
        <button onClick={() => setShow(true)} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> New {isSkill ? "skill" : "plugin"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => {
          const enabled = (it as { enabled: boolean }).enabled;
          const installs = (it as Skill)._count?.installs;
          return (
            <div key={it.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/15 text-brand-400">
                    {isSkill ? <Wand2 className="h-4 w-4" /> : <Plug className="h-4 w-4" />}
                  </span>
                  <div>
                    <h3 className="font-medium text-zinc-100">{it.name}</h3>
                    {isSkill && installs != null && <p className="text-[11px] text-zinc-500">{installs} installs</p>}
                  </div>
                </div>
                <button onClick={() => remove(it.id)} className="text-zinc-600 hover:text-brand-400"><Trash2 className="h-4 w-4" /></button>
              </div>
              {it.description && <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{it.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs ${enabled ? "text-emerald-400" : "text-zinc-500"}`}>{enabled ? "Enabled" : "Disabled"}</span>
                <button onClick={() => toggle(it.id, enabled)} className={`rounded-full px-3 py-1 text-xs font-medium ${enabled ? "bg-zinc-800 text-zinc-300" : "bg-brand-600 text-white"}`}>
                  {enabled ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && <p className="text-sm text-zinc-500">Nothing yet.</p>}
      </div>

      {show && (
        <CatalogForm
          kind={kind}
          field={field}
          onClose={() => setShow(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}

function CatalogForm({ kind, field, onClose, onSaved }: { kind: "skills" | "plugins"; field: string; onClose: () => void; onSaved: () => void }) {
  const isSkill = kind === "skills";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await apiSend(`/api/admin/${kind}`, "POST", { name, description, instructions: isSkill ? instructions : undefined });
    setBusy(false);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-7 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"><X className="h-5 w-5" /></button>
        <h2 className="text-lg font-semibold text-white">New {isSkill ? "skill" : "plugin"}</h2>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block"><span className="text-sm text-zinc-300">Name</span><input value={name} onChange={(e) => setName(e.target.value)} required className={field} /></label>
          <label className="block"><span className="text-sm text-zinc-300">Description</span><input value={description} onChange={(e) => setDescription(e.target.value)} className={field} /></label>
          {isSkill && (
            <label className="block"><span className="text-sm text-zinc-300">Instructions (what the AI should do)</span><textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={5} className={field} placeholder="When drafting NDAs, always include…" /></label>
          )}
          <button type="submit" disabled={busy || !name.trim()} className="w-full rounded-full bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            {busy ? "Saving…" : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}
