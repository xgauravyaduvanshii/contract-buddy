"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutTemplate, Plus, Eye, Pencil, Copy, Trash2, ArrowRight, FileText, ListChecks,
} from "lucide-react";
import { apiGet, apiSend } from "@/lib/client";
import type { ProposalSection } from "@/lib/builder-types";
import { Modal, ErrorNote, Spinner, EmptyBox, Pill, toneDot, inputCls, textareaCls, ghostBtn } from "./ui";

type Tmpl = {
  id: string;
  key: string;
  kind: string;
  name: string;
  badge: string | null;
  description: string | null;
  priceHint: string | null;
  tone: string;
  tags: string[] | null;
  sections: ProposalSection[];
  fee: { structure?: string; baseFee?: number } | null;
  terms: string[] | null;
  userId: string | null;
};

const KIND_META = {
  PROPOSAL: { label: "Proposal Templates", blurb: "Reusable starting points for the Proposal Builder.", route: "/dashboard/proposals" },
  CONTRACT: { label: "Contract Templates", blurb: "Clause presets that seed the Contract Builder.", route: "/dashboard/contracts" },
} as const;

export function TemplatesView({ kind }: { kind: "PROPOSAL" | "CONTRACT" }) {
  const router = useRouter();
  const meta = KIND_META[kind];
  const [templates, setTemplates] = useState<Tmpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Tmpl | null>(null);
  const [creating, setCreating] = useState(false);
  const [previewing, setPreviewing] = useState<Tmpl | null>(null);
  const [busy, setBusy] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    apiGet<{ templates: Tmpl[] }>(`/api/templates?kind=${kind}`).then((r) => {
      if (!alive) return;
      if (r.ok && r.data) setTemplates(r.data.templates);
      else setError(r.error || "Could not load templates");
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [kind, nonce]);

  const reload = () => setNonce((n) => n + 1);

  async function duplicate(t: Tmpl) {
    setBusy(true);
    const r = await apiSend<{ template: Tmpl }>(`/api/templates/${t.id}/duplicate`, "POST");
    setBusy(false);
    if (r.ok) reload();
    else setError(r.error || "Could not duplicate");
  }

  async function remove(t: Tmpl) {
    if (!confirm(`Delete "${t.name}"?`)) return;
    const r = await apiSend(`/api/templates/${t.id}`, "DELETE");
    if (!r.ok) setError(r.error || "Could not delete");
    reload();
  }

  async function startFromTemplate(t: Tmpl) {
    setBusy(true);
    setError(null);
    if (kind === "PROPOSAL") {
      const r = await apiSend<{ proposal: { id: string } }>("/api/proposals", "POST", {
        title: t.name,
        sections: t.sections,
        terms: t.terms ?? [],
        fee: t.fee?.structure ? { structure: t.fee.structure, baseFee: t.fee.baseFee || 0, gstPct: 18 } : undefined,
        templateKey: t.key,
      });
      if (r.ok && r.data) router.push(`/dashboard/proposals/${r.data.proposal.id}`);
      else setError(r.error || "Could not start from the template");
    } else {
      const clauses = t.sections.map((s, i) => ({ n: i + 1, title: s.title, text: s.content || (s.items || []).join(" ") }));
      const r = await apiSend<{ contract: { id: string } }>("/api/contracts", "POST", {
        title: `${t.name} — contract`,
        clauses,
        fees: t.fee?.baseFee ? { fee: t.fee.baseFee, gstPct: 18, gst: Math.round(t.fee.baseFee * 0.18), grand: Math.round(t.fee.baseFee * 1.18), currency: "INR" } : undefined,
      });
      if (r.ok && r.data) router.push(`/dashboard/contracts/${r.data.contract.id}`);
      else setError(r.error || "Could not start from the template");
    }
    setBusy(false);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b border-zinc-800 px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="text-zinc-500">Templates</span>
            <span className="text-zinc-700">›</span>
            <span className="font-medium text-white">{meta.label}</span>
          </div>
          <div className="ml-auto flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/70 p-1">
            <button
              onClick={() => router.push("/dashboard/templates?kind=proposal")}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition ${kind === "PROPOSAL" ? "bg-brand-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Proposals
            </button>
            <button
              onClick={() => router.push("/dashboard/templates?kind=contract")}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition ${kind === "CONTRACT" ? "bg-brand-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Contracts
            </button>
          </div>
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700">
            <Plus className="h-3.5 w-3.5" /> New template
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-8">
        <p className="mb-5 text-sm text-zinc-400">{meta.blurb}</p>
        {error && <div className="mb-4"><ErrorNote text={error} /></div>}

        {loading ? (
          <Spinner />
        ) : templates.length === 0 ? (
          <EmptyBox icon={<LayoutTemplate className="h-6 w-6" />} title="No templates yet" sub="Create one or duplicate a global template to make it yours." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <div key={t.id} className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-brand-500/40">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${toneDot(t.tone)}`} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{t.badge || "TEMPLATE"}</span>
                  {t.userId ? <Pill tone="brand">yours</Pill> : <Pill>global</Pill>}
                </div>
                <h3 className="mt-2 font-semibold text-white">{t.name}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-xs text-zinc-400">{t.description}</p>
                {t.priceHint && <p className="mt-2 text-sm font-semibold text-brand-400">{t.priceHint}</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  {(t.tags || []).slice(0, 3).map((g) => (
                    <span key={g} className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{g}</span>
                  ))}
                  {(t.tags || []).length > 3 && <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">+{t.tags!.length - 3}</span>}
                </div>
                <div className="mt-4 flex items-center gap-1 border-t border-zinc-800 pt-3">
                  <button onClick={() => setPreviewing(t)} title="Preview" className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"><Eye className="h-3.5 w-3.5" /></button>
                  <button
                    onClick={() => (t.userId ? setEditing(t) : duplicate(t))}
                    title={t.userId ? "Edit" : "Global templates are read-only — duplicate to edit"}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => duplicate(t)} title="Duplicate" className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"><Copy className="h-3.5 w-3.5" /></button>
                  {t.userId && (
                    <button onClick={() => remove(t)} title="Delete" className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-brand-400"><Trash2 className="h-3.5 w-3.5" /></button>
                  )}
                  <button
                    onClick={() => startFromTemplate(t)}
                    disabled={busy}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-brand-500/50 hover:text-brand-300 disabled:opacity-50"
                  >
                    Use <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(creating || editing) && (
        <TemplateEditorModal
          kind={kind}
          template={editing}
          busy={busy}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={async (payload) => {
            setBusy(true);
            const r = editing
              ? await apiSend(`/api/templates/${editing.id}`, "PATCH", payload)
              : await apiSend<{ template: Tmpl }>("/api/templates", "POST", payload);
            setBusy(false);
            if (!r.ok) {
              setError(r.error || "Could not save the template");
              return;
            }
            setCreating(false);
            setEditing(null);
            reload();
          }}
        />
      )}

      {previewing && (
        <Modal title={previewing.name} subtitle={previewing.description || undefined} onClose={() => setPreviewing(null)} wide>
          <div className="space-y-3">
            {previewing.sections.map((s) => (
              <div key={s.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{s.title}</p>
                {s.kind === "text" ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">{s.content}</p>
                ) : (
                  <ul className="mt-1.5 space-y-1 text-sm text-zinc-300">
                    {(s.items || []).map((it, i) => (
                      <li key={i} className="flex gap-2"><ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" /> {it}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {(previewing.terms || []).length > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Terms</p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-sm text-zinc-300">
                  {(previewing.terms || []).map((t, i) => <li key={i}>{t}</li>)}
                </ol>
              </div>
            )}
            <div className="flex justify-end pt-1">
              <button onClick={() => { const t = previewing; setPreviewing(null); startFromTemplate(t); }} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50">
                Use this template <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

type Draft = {
  name: string;
  badge: string;
  description: string;
  priceHint: string;
  tone: string;
  sections: { id: string; title: string; kind: "text" | "list"; content: string; itemsText: string }[];
  termsText: string;
};

function TemplateEditorModal({
  kind,
  template,
  onClose,
  onSave,
  busy,
}: {
  kind: "PROPOSAL" | "CONTRACT";
  template: Tmpl | null;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}) {
  const [draft, setDraft] = useState<Draft>(() =>
    template
      ? {
          name: template.name,
          badge: template.badge || "",
          description: template.description || "",
          priceHint: template.priceHint || "",
          tone: template.tone || "brand",
          sections: (template.sections || []).map((s) => ({
            id: s.id,
            title: s.title,
            kind: s.kind,
            content: s.content || "",
            itemsText: (s.items || []).join("\n"),
          })),
          termsText: (template.terms || []).join("\n"),
        }
      : {
          name: "",
          badge: kind === "PROPOSAL" ? "FIXED PACKAGE" : "FIXED PROJECT",
          description: "",
          priceHint: "",
          tone: "brand",
          sections: [{ id: "overview", title: kind === "PROPOSAL" ? "Project Overview" : "Parties", kind: "text", content: "", itemsText: "" }],
          termsText: "",
        },
  );

  function set<K extends keyof Draft>(key: K, v: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: v }));
  }

  async function submit() {
    if (!draft.name.trim()) return;
    await onSave({
      kind,
      name: draft.name.trim(),
      badge: draft.badge.trim() || null,
      description: draft.description.trim() || null,
      priceHint: draft.priceHint.trim() || null,
      tone: draft.tone,
      tags: draft.sections.map((s) => s.title).slice(0, 10),
      sections: draft.sections.map((s) => ({
        id: s.id,
        title: s.title || "Section",
        kind: s.kind,
        content: s.kind === "text" ? s.content : undefined,
        items: s.kind === "list" ? s.itemsText.split("\n").map((x) => x.trim()).filter(Boolean) : undefined,
      })),
      terms: draft.termsText.split("\n").map((x) => x.trim()).filter(Boolean),
    });
  }

  return (
    <Modal title={template ? "Edit template" : "New template"} subtitle="Sections become the starting content when this template is used." onClose={onClose} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">Name *</span>
          <input value={draft.name} onChange={(e) => set("name", e.target.value)} className={`${inputCls} mt-1.5`} placeholder="Brand Identity — Premium" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">Badge</span>
          <input value={draft.badge} onChange={(e) => set("badge", e.target.value)} className={`${inputCls} mt-1.5`} placeholder="FIXED PACKAGE" />
        </label>
      </div>
      <label className="mt-4 block">
        <span className="text-sm font-medium text-zinc-300">Description</span>
        <input value={draft.description} onChange={(e) => set("description", e.target.value)} className={`${inputCls} mt-1.5`} placeholder="What is this template for?" />
      </label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">Price hint</span>
          <input value={draft.priceHint} onChange={(e) => set("priceHint", e.target.value)} className={`${inputCls} mt-1.5`} placeholder="₹45,000–₹1,20,000" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">Accent dot</span>
          <select value={draft.tone} onChange={(e) => set("tone", e.target.value)} className={`${inputCls} mt-1.5`}>
            {["brand", "amber", "blue", "green", "purple", "red"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-300">Sections</span>
          <button
            onClick={() => set("sections", [...draft.sections, { id: `sec-${Date.now()}`, title: "New Section", kind: "text", content: "", itemsText: "" }])}
            className={ghostBtn}
          >
            <Plus className="h-3 w-3" /> Add section
          </button>
        </div>
        <div className="space-y-3">
          {draft.sections.map((s, i) => (
            <div key={s.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="flex items-center gap-2">
                <input value={s.title} onChange={(e) => set("sections", draft.sections.map((x, xi) => (xi === i ? { ...x, title: e.target.value } : x)))} className="h-8 min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 text-sm text-zinc-100 outline-none focus:border-brand-500" />
                <button
                  onClick={() => set("sections", draft.sections.map((x, xi) => (xi === i ? { ...x, kind: x.kind === "text" ? "list" : "text" } : x)))}
                  className="rounded-lg border border-zinc-700 px-2 py-1 text-[10px] uppercase text-zinc-400 hover:text-zinc-200"
                  title="Toggle paragraph / bullet list"
                >
                  {s.kind}
                </button>
                <button onClick={() => set("sections", draft.sections.filter((_, xi) => xi !== i))} className="text-zinc-600 hover:text-brand-400"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              {s.kind === "text" ? (
                <textarea
                  value={s.content}
                  onChange={(e) => set("sections", draft.sections.map((x, xi) => (xi === i ? { ...x, content: e.target.value } : x)))}
                  rows={3}
                  placeholder="Paragraph content…"
                  className={`${textareaCls} mt-2`}
                />
              ) : (
                <textarea
                  value={s.itemsText}
                  onChange={(e) => set("sections", draft.sections.map((x, xi) => (xi === i ? { ...x, itemsText: e.target.value } : x)))}
                  rows={4}
                  placeholder="One bullet per line…"
                  className={`${textareaCls} mt-2`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {kind === "PROPOSAL" && (
        <label className="mt-5 block">
          <span className="text-sm font-medium text-zinc-300">Terms (one per line)</span>
          <textarea value={draft.termsText} onChange={(e) => set("termsText", e.target.value)} rows={4} placeholder={"Client owns final files on full payment.\nTwo revision rounds included."} className={`${textareaCls} mt-1.5`} />
        </label>
      )}

      <div className="mt-6 flex justify-end gap-2 border-t border-zinc-800 pt-4">
        <button onClick={onClose} className="rounded-full px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Cancel</button>
        <button onClick={submit} disabled={busy || !draft.name.trim()} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50">
          {busy ? <Spinner label="Saving…" /> : <><FileText className="h-4 w-4" /> {template ? "Save changes" : "Create template"}</>}
        </button>
      </div>
    </Modal>
  );
}
