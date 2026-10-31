"use client";

import { useEffect, useState } from "react";
import { KeyRound, Save, Search, Check } from "lucide-react";
import { apiGet, apiSend } from "@/lib/client";

type Settings = { apiKeySet: boolean; apiKeyPreview: string; baseUrl: string; enabledModels: string[] | null };
type Model = { id: string; name: string; provider: string; enabled: boolean };

export function SettingsSection() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"all" | "custom">("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiGet<{ settings: Settings }>("/api/admin/settings").then((r) => {
      if (r.ok && r.data) {
        const s = r.data.settings;
        setSettings(s);
        setMode(s.enabledModels === null ? "all" : "custom");
        setSelected(new Set(s.enabledModels ?? []));
      }
    });
    apiGet<{ models: Model[] }>("/api/models?all=1").then((r) => {
      if (r.ok && r.data) setModels(r.data.models);
    });
  }, []);

  const filtered = models.filter((m) => (q ? m.id.toLowerCase().includes(q.toLowerCase()) : true)).slice(0, 200);

  async function saveKey() {
    if (!apiKey.trim()) return;
    setBusy(true);
    await apiSend("/api/admin/settings", "POST", { apiKey: apiKey.trim() });
    const r = await apiGet<{ settings: Settings }>("/api/admin/settings");
    if (r.ok && r.data) setSettings(r.data.settings);
    setApiKey("");
    setBusy(false);
    flash();
  }

  async function saveModels() {
    setBusy(true);
    const payload = mode === "all" ? null : Array.from(selected);
    await apiSend("/api/admin/settings", "POST", { enabledModels: payload });
    setBusy(false);
    flash();
  }

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-brand-400" />
          <h3 className="font-medium text-zinc-100">AI provider API key</h3>
        </div>
        <p className="mt-1 text-sm text-zinc-400">
          {settings?.apiKeySet
            ? `A key is set (${settings.apiKeyPreview}). Paste a new one to replace it.`
            : `No override set — using the environment key (${settings?.apiKeyPreview || "unset"}).`}
        </p>
        <div className="mt-4 flex gap-2">
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="xr_…" className="h-11 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none focus:border-brand-500" />
          <button onClick={saveKey} disabled={busy || !apiKey.trim()} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-medium text-zinc-100">Model availability</h3>
            <p className="mt-1 text-sm text-zinc-400">Choose which models users can select. {models.length} models available.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMode("all")} className={`rounded-full px-4 py-1.5 text-sm ${mode === "all" ? "bg-brand-600 text-white" : "bg-zinc-800 text-zinc-300"}`}>All models</button>
            <button onClick={() => setMode("custom")} className={`rounded-full px-4 py-1.5 text-sm ${mode === "custom" ? "bg-brand-600 text-white" : "bg-zinc-800 text-zinc-300"}`}>Custom</button>
          </div>
        </div>

        {mode === "custom" && (
          <>
            <div className="mt-4 flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-4">
              <Search className="h-4 w-4 text-zinc-500" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search models…" className="h-11 flex-1 bg-transparent text-sm text-zinc-100 outline-none" />
              <span className="text-xs text-zinc-500">{selected.size} selected</span>
            </div>
            <div className="mt-3 max-h-80 space-y-1 overflow-y-auto pr-1">
              {filtered.map((m) => {
                const on = selected.has(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() =>
                      setSelected((s) => {
                        const n = new Set(s);
                        if (n.has(m.id)) n.delete(m.id);
                        else n.add(m.id);
                        return n;
                      })
                    }
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-zinc-800"
                  >
                    <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${on ? "border-brand-500 bg-brand-600" : "border-zinc-700"}`}>
                      {on && <Check className="h-3.5 w-3.5 text-white" />}
                    </span>
                    <span className="truncate text-zinc-200">{m.name}</span>
                    <span className="ml-auto shrink-0 text-xs text-zinc-500">{m.provider}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button onClick={saveModels} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            <Save className="h-4 w-4" /> {saved ? "Saved" : "Apply"}
          </button>
          {mode === "custom" && selected.size === 0 && <span className="text-xs text-amber-400">Note: 0 selected will block all models. Pick at least one.</span>}
        </div>
      </div>
    </div>
  );
}
