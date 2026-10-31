"use client";

import { useEffect, useState } from "react";
import { KeyRound, Save, Search, Check, Mail, RotateCcw, Send } from "lucide-react";
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

      <SmtpCard />
    </div>
  );
}

// ── SMTP: admin-managed mail server (overrides the .env defaults) ─
type SmtpCfg = { host: string; port: number; secure: boolean; user: string; pass: string; from: string };

function SmtpCard() {
  const [cfg, setCfg] = useState<SmtpCfg>({ host: "", port: 587, secure: false, user: "", pass: "", from: "" });
  const [overridden, setOverridden] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [testTo, setTestTo] = useState("");

  useEffect(() => {
    apiGet<{ override: Partial<SmtpCfg> | null; effective: SmtpCfg }>("/api/admin/smtp").then((r) => {
      if (r.ok && r.data) {
        setCfg(r.data.effective);
        setOverridden(Boolean(r.data.override));
      }
      setLoaded(true);
    });
  }, []);

  async function save() {
    setBusy(true);
    setMsg(null);
    const r = await apiSend("/api/admin/smtp", "POST", { ...cfg, port: Number(cfg.port) || 587 });
    setBusy(false);
    setMsg(r.ok ? "SMTP settings saved." : r.error || "Save failed");
    if (r.ok) setOverridden(true);
  }

  async function clear() {
    setBusy(true);
    await apiSend("/api/admin/smtp", "POST", { clear: true });
    const r = await apiGet<{ effective: SmtpCfg }>("/api/admin/smtp");
    if (r.ok && r.data) setCfg(r.data.effective);
    setOverridden(false);
    setBusy(false);
    setMsg("Reset to the environment defaults.");
  }

  async function test() {
    if (!testTo.includes("@")) return;
    setBusy(true);
    setMsg(null);
    const r = await apiSend("/api/admin/smtp", "PUT", { to: testTo });
    setBusy(false);
    setMsg(r.ok ? `Test email sent to ${testTo}.` : r.error || "Send failed");
  }

  const input = "h-10 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-brand-500";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-brand-400" />
        <h3 className="font-medium text-zinc-100">SMTP mail server</h3>
        {overridden && <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] text-brand-300">admin override active</span>}
      </div>
      <p className="mt-1 text-sm text-zinc-400">Used for OTPs, notices and every templated email. Leave the password as •••• to keep the stored one.</p>

      {!loaded ? (
        <p className="mt-4 text-sm text-zinc-500">Loading…</p>
      ) : (
        <>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <input className={input} placeholder="smtp.host.com" value={cfg.host} onChange={(e) => setCfg({ ...cfg, host: e.target.value })} />
            <div className="flex gap-2">
              <input className="h-10 w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-brand-500" type="number" placeholder="587" value={cfg.port} onChange={(e) => setCfg({ ...cfg, port: Number(e.target.value) })} />
              <button
                onClick={() => setCfg({ ...cfg, secure: !cfg.secure })}
                className={`h-10 flex-1 rounded-lg border px-3 text-sm transition ${cfg.secure ? "border-brand-500/60 bg-brand-600/15 text-brand-200" : "border-zinc-700 text-zinc-400"}`}
                title="465 = usually ON (SSL), 587 = usually OFF (STARTTLS)"
              >
                {cfg.secure ? "Secure (SSL) ON" : "Secure (STARTTLS) OFF"}
              </button>
            </div>
            <input className={input} placeholder="SMTP username" value={cfg.user} onChange={(e) => setCfg({ ...cfg, user: e.target.value })} />
            <input className={input} type="password" placeholder="SMTP password" value={cfg.pass} onChange={(e) => setCfg({ ...cfg, pass: e.target.value })} />
            <input className={input} placeholder="from@email.com (sender address)" value={cfg.from} onChange={(e) => setCfg({ ...cfg, from: e.target.value })} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={save} disabled={busy || !cfg.host || !cfg.user} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              <Save className="h-4 w-4" /> Save SMTP
            </button>
            <button onClick={clear} disabled={busy || !overridden} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-brand-500/50 disabled:opacity-40">
              <RotateCcw className="h-3.5 w-3.5" /> Reset to env
            </button>
            <div className="ml-auto flex items-center gap-2">
              <input className="h-9 w-52 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-emerald-500" type="email" placeholder="Send a test to…" value={testTo} onChange={(e) => setTestTo(e.target.value.trim())} />
              <button onClick={test} disabled={busy || !testTo.includes("@")} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                <Send className="h-3.5 w-3.5" /> Test
              </button>
            </div>
          </div>
          {msg && <p className="mt-3 text-sm text-emerald-300">{msg}</p>}
        </>
      )}
    </div>
  );
}
