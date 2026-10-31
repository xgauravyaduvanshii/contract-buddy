"use client";

import { useEffect, useState } from "react";
import { Mail, RotateCcw, Save } from "lucide-react";
import { apiGet, apiSend } from "@/lib/client";

type Template = { key: string; name: string; category: string; subject: string; html: string; text: string | null; customized: boolean };

export function TemplatesSection() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Template | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiGet<{ templates: Template[] }>("/api/admin/templates").then((r) => {
      if (r.ok && r.data) {
        setTemplates(r.data.templates);
        setActiveKey(r.data.templates[0]?.key ?? null);
      }
    });
  }, []);

  useEffect(() => {
    const t = templates.find((x) => x.key === activeKey);
    // Sync the editable draft when the selected template changes (intentional)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(t ? { ...t } : null);
    setSaved(false);
  }, [activeKey, templates]);

  const grouped = templates.reduce<Record<string, Template[]>>((acc, t) => {
    (acc[t.category] ||= []).push(t);
    return acc;
  }, {});

  async function save() {
    if (!draft) return;
    setBusy(true);
    await apiSend(`/api/admin/templates/${draft.key}`, "PATCH", { subject: draft.subject, html: draft.html, text: draft.text });
    const r = await apiGet<{ templates: Template[] }>("/api/admin/templates");
    if (r.ok && r.data) setTemplates(r.data.templates);
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function reset() {
    if (!draft) return;
    setBusy(true);
    await apiSend(`/api/admin/templates/${draft.key}`, "DELETE");
    const r = await apiGet<{ templates: Template[] }>("/api/admin/templates");
    if (r.ok && r.data) setTemplates(r.data.templates);
    setBusy(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <div className="space-y-4">
        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat}>
            <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{cat}</p>
            <div className="space-y-0.5">
              {list.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveKey(t.key)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                    activeKey === t.key ? "bg-brand-600/15 text-brand-200" : "text-zinc-400 hover:bg-zinc-800/60"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{t.name}</span>
                  {t.customized && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" title="Customized" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {draft && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-zinc-100">{draft.name}</h3>
              <p className="text-xs text-zinc-500">Supports {"{{variables}}"} like {"{{name}}, {{otp}}"}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={reset} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-brand-500/50">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                <Save className="h-3.5 w-3.5" /> {saved ? "Saved" : "Save"}
              </button>
            </div>
          </div>

          <label className="block">
            <span className="text-sm text-zinc-300">Subject</span>
            <input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none focus:border-brand-500" />
          </label>
          <label className="mt-3 block">
            <span className="text-sm text-zinc-300">HTML body</span>
            <textarea value={draft.html} onChange={(e) => setDraft({ ...draft, html: e.target.value })} rows={16} className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-mono text-xs text-zinc-100 outline-none focus:border-brand-500" />
          </label>
        </div>
      )}
    </div>
  );
}
