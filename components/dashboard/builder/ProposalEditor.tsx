"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Download, Eye, Pencil, Plus, Trash2, Check, Loader2, ImagePlus, Send,
} from "lucide-react";
import { apiGet, apiSend, apiUpload } from "@/lib/client";
import type { ProposalSection, ProposalOffer, ProposalFee, ProposalStyle } from "@/lib/builder-types";
import { DEFAULT_STYLE, inr } from "@/lib/builder-types";
import { BuilderHeader, ErrorNote, Spinner, Field, inputCls, textareaCls, ghostBtn } from "./ui";

type Doc = {
  id: string;
  title: string;
  clientName: string | null;
  projectName: string | null;
  logoUrl: string | null;
  note: string | null;
  noteAuthor: string | null;
  status: string;
  currency: string;
  code: string | null;
  fee: ProposalFee | null;
  sections: ProposalSection[];
  offers: ProposalOffer[];
  terms: string[];
  style: ProposalStyle;
  validUntil: string | null;
  createdAt: string;
};

const FONT_CSS: Record<string, string> = {
  Sans: "ui-sans-serif, system-ui, sans-serif",
  Serif: "ui-serif, Georgia, 'Times New Roman', serif",
  Mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const ACCENT_SWATCHES = ["#F59E0B", "#3B82F6", "#22C55E", "#EF4444", "#8B5CF6", "#111111"];

export function ProposalEditor({ id }: { id: string }) {
  const router = useRouter();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"IDLE" | "SAVING" | "SAVED">("IDLE");
  const [preview, setPreview] = useState(false);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(() => {
    apiGet<{ proposal: Record<string, unknown> }>(`/api/proposals/${id}`).then((r) => {
      if (!r.ok || !r.data) {
        setError(r.error || "Could not load this proposal");
        return;
      }
      const p = r.data.proposal;
      setDoc({
        id: String(p.id),
        title: String(p.title || ""),
        clientName: (p.clientName as string) ?? null,
        projectName: (p.projectName as string) ?? null,
        logoUrl: (p.logoUrl as string) ?? null,
        note: (p.note as string) ?? null,
        noteAuthor: (p.noteAuthor as string) ?? null,
        status: String(p.status || "DRAFT"),
        currency: String(p.currency || "INR"),
        code: (p.code as string) ?? null,
        fee: (p.fee as ProposalFee) ?? null,
        sections: Array.isArray(p.sections) ? (p.sections as ProposalSection[]) : [],
        offers: Array.isArray(p.offers) ? (p.offers as ProposalOffer[]) : [],
        terms: Array.isArray(p.terms) ? (p.terms as string[]) : [],
        style: (p.style as ProposalStyle) ?? DEFAULT_STYLE,
        validUntil: p.validUntil ? String(p.validUntil).slice(0, 10) : null,
        createdAt: String(p.createdAt),
      });
    });
  }, [id]);

  useEffect(load, [load]);

  function mutate(fn: (d: Doc) => void) {
    setDoc((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    dirtyRef.current = true;
  }

  // Debounced autosave whenever the doc changes
  useEffect(() => {
    if (!doc || !dirtyRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      dirtyRef.current = false;
      setSaveState("SAVING");
      const r = await apiSend(`/api/proposals/${id}`, "PATCH", {
        title: doc.title,
        clientName: doc.clientName,
        projectName: doc.projectName,
        note: doc.note,
        noteAuthor: doc.noteAuthor,
        status: doc.status,
        currency: doc.currency,
        fee: doc.fee,
        sections: doc.sections,
        offers: doc.offers,
        terms: doc.terms,
        style: doc.style,
        validUntil: doc.validUntil,
      });
      setSaveState(r.ok ? "SAVED" : "IDLE");
      if (!r.ok) setError(r.error || "Autosave failed — your latest edits are not stored.");
    }, 900);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [doc, id]);

  const totals = useMemo(() => {
    const base = doc?.fee?.baseFee || 0;
    const pct = doc?.fee?.gstPct ?? 18;
    const gst = Math.round((base * pct) / 100);
    return { base, gst, grand: base + gst };
  }, [doc?.fee]);

  async function uploadLogo(file: File) {
    const form = new FormData();
    form.set("file", file);
    const r = await apiUpload<{ attachment: { url: string } }>("/api/uploads", form);
    if (r.ok && r.data) mutate((d) => { d.logoUrl = r.data!.attachment.url; });
  }

  async function sendToClient() {
    mutate((d) => { d.status = "SENT"; });
  }

  if (error && !doc) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <ErrorNote text={error} />
        <button onClick={() => router.push("/dashboard/proposals")} className={`${ghostBtn} mt-4`}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
      </div>
    );
  }
  if (!doc) {
    return <div className="flex flex-1 items-center justify-center"><Spinner label="Opening proposal…" /></div>;
  }

  const paper = { background: doc.style.background, color: doc.style.titleColor, fontFamily: FONT_CSS[doc.style.font] || FONT_CSS.Sans };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <style>{`@media print { body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute !important; left: 0; top: 0; width: 100%; max-height: none !important; overflow: visible !important; } }`}</style>
      <BuilderHeader
        crumb="Proposal Builder"
        title={doc.title || "Untitled proposal"}
        onCrumbClick={() => router.push("/dashboard/proposals")}
        actions={
          <>
            <span className="mr-1 inline-flex items-center gap-1 text-[11px] text-zinc-500">
              {saveState === "SAVING" ? <Loader2 className="h-3 w-3 animate-spin" /> : saveState === "SAVED" ? <Check className="h-3 w-3 text-emerald-400" /> : null}
              {saveState === "SAVING" ? "Saving…" : saveState === "SAVED" ? "Saved" : "Autosaves"}
            </span>
            <button onClick={() => window.print()} className={ghostBtn}><Download className="h-3.5 w-3.5" /> Export PDF</button>
            <button onClick={() => setPreview((p) => !p)} className={ghostBtn}>
              {preview ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {preview ? "Edit" : "Preview"}
            </button>
            {doc.status === "DRAFT" && (
              <button onClick={sendToClient} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700">
                <Send className="h-3.5 w-3.5" /> Send to client
              </button>
            )}
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${doc.status === "DRAFT" ? "bg-zinc-800 text-zinc-400" : "bg-amber-500/15 text-amber-300"}`}>
              {doc.status === "DRAFT" ? "Draft" : doc.status === "SENT" ? "Awaiting client approval" : doc.status}
            </span>
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* ── Document canvas ── */}
        <div className="print-area min-h-0 flex-1 overflow-y-auto bg-zinc-950/60 p-4 sm:p-8 scrollbar-slim">
          <div className="mx-auto max-w-2xl space-y-4">
            {/* Header card */}
            <div className="rounded-2xl p-6 shadow-xl sm:p-8" style={paper}>
              <div className="flex items-start justify-between">
                {doc.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={doc.logoUrl} alt="Logo" className="h-10 w-auto rounded-lg object-contain" />
                ) : (
                  !preview && (
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed px-3 py-2 text-xs opacity-60" style={{ borderColor: doc.style.titleColor }}>
                      <ImagePlus className="h-3.5 w-3.5" /> Add logo
                      <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                    </label>
                  )
                )}
                <span className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase" style={{ background: `${doc.style.titleColor}12`, color: doc.style.titleColor }}>
                  {doc.status === "DRAFT" ? "Draft" : doc.status}
                </span>
              </div>
              <p className="mt-6 text-xs opacity-70">Prepared for <span className="font-semibold">{doc.clientName || "the client"}</span></p>
              <p className="text-xs opacity-70">Prepared by <span className="font-semibold">{doc.noteAuthor || "ContractBuddy"}</span></p>
              <Editable value={doc.title} preview={preview} onChange={(v) => mutate((d) => { d.title = v; })} className="mt-2 text-2xl font-bold sm:text-3xl" placeholder="Proposal title" />
              {doc.projectName && <p className="mt-1 text-sm opacity-70">{doc.projectName}</p>}
              <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4 text-xs sm:grid-cols-4" style={{ borderColor: `${doc.style.titleColor}1a` }}>
                <Meta label="Proposal ID" value={doc.code || "—"} />
                <Meta label="Valid until" value={doc.validUntil ? new Date(doc.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
                <Meta label="Date" value={new Date(doc.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
                <Meta label="Total" value={totals.grand ? inr(totals.grand) : "—"} accent={doc.style.accent} />
              </div>
            </div>

            {/* Sections */}
            {doc.sections.map((s, si) => (
              <div key={s.id || si} className="rounded-2xl p-6 shadow-xl sm:p-8" style={paper}>
                <div className="flex items-center justify-between">
                  <Editable value={s.title} preview={preview} onChange={(v) => mutate((d) => { d.sections[si].title = v; })} className="text-xs font-semibold uppercase tracking-widest opacity-60" />
                  {!preview && (
                    <button onClick={() => mutate((d) => { d.sections.splice(si, 1); })} className="opacity-30 transition hover:opacity-70" title="Remove section">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="mt-3">
                  {s.kind === "text" ? (
                    <EditableArea value={s.content || ""} preview={preview} onChange={(v) => mutate((d) => { d.sections[si].content = v; })} placeholder="Write a short overview…" />
                  ) : (
                    <div className="space-y-2">
                      {(s.items || []).map((item, ii) => (
                        <div key={ii} className="flex items-start gap-2">
                          <Check className="mt-1 h-3.5 w-3.5 shrink-0" style={{ color: doc.style.accent }} />
                          <Editable value={item} preview={preview} onChange={(v) => mutate((d) => { d.sections[si].items![ii] = v; })} className="flex-1 text-sm" placeholder="Deliverable…" />
                          {!preview && (
                            <button onClick={() => mutate((d) => { d.sections[si].items!.splice(ii, 1); })} className="mt-0.5 opacity-30 hover:opacity-70">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      {!preview && (
                        <button onClick={() => mutate((d) => { d.sections[si].items = [...(d.sections[si].items || []), ""]; })} className="ml-5 inline-flex items-center gap-1 text-xs opacity-50 transition hover:opacity-90">
                          <Plus className="h-3 w-3" /> Add item
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {!preview && doc.sections.length < 12 && (
              <button
                onClick={() => mutate((d) => { d.sections.push({ id: `sec-${Date.now()}`, title: "New Section", kind: "text", content: "" }); })}
                className="w-full rounded-2xl border border-dashed border-zinc-700 py-3 text-sm text-zinc-500 transition hover:border-brand-500/50 hover:text-brand-300"
              >
                + Add section
              </button>
            )}

            {/* Offers */}
            {(doc.offers.length > 0 || !preview) && (
              <div className="rounded-2xl p-6 shadow-xl sm:p-8" style={paper}>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-60">Bonus offers</p>
                <div className="mt-3 space-y-3">
                  {doc.offers.map((o, oi) => (
                    <div key={o.id} className="rounded-xl border p-4" style={{ borderColor: `${doc.style.titleColor}1a` }}>
                      <div className="flex items-start justify-between gap-2">
                        <Editable value={o.title} preview={preview} onChange={(v) => mutate((d) => { d.offers[oi].title = v; })} className="text-sm font-semibold" />
                        {!preview && (
                          <button onClick={() => mutate((d) => { d.offers.splice(oi, 1); })} className="opacity-30 hover:opacity-70"><Trash2 className="h-3.5 w-3.5" /></button>
                        )}
                      </div>
                      <Editable value={o.desc || ""} preview={preview} onChange={(v) => mutate((d) => { d.offers[oi].desc = v; })} className="mt-1 text-xs opacity-60" placeholder="What's included…" />
                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-sm font-bold" style={{ color: doc.style.accent }}>
                          {inr(Number(doc.offers[oi].price) || 0)}
                        </span>
                        {!!o.strike && o.strike > o.price && <span className="text-xs line-through opacity-40">{inr(o.strike)}</span>}
                        {!!o.discountPct && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: doc.style.accent }}>{o.discountPct}% off</span>}
                        {!preview && (
                          <input
                            type="number"
                            value={o.price || ""}
                            onChange={(e) => mutate((d) => { d.offers[oi].price = Number(e.target.value) || 0; })}
                            className="ml-auto h-7 w-24 rounded-lg border bg-transparent px-2 text-xs outline-none"
                            style={{ borderColor: `${doc.style.titleColor}22` }}
                            placeholder="Price"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  {!preview && (
                    <button
                      onClick={() => mutate((d) => { d.offers.push({ id: `off-${Date.now()}`, title: "Add-on", desc: "", price: 0 }); })}
                      className="w-full rounded-xl border border-dashed py-2.5 text-xs opacity-50 transition hover:opacity-90"
                      style={{ borderColor: `${doc.style.titleColor}33` }}
                    >
                      + Add another offer
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Terms */}
            {(doc.terms.length > 0 || !preview) && (
              <div className="rounded-2xl p-6 shadow-xl sm:p-8" style={paper}>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-60">Terms &amp; Conditions</p>
                <div className="mt-3 space-y-2">
                  {doc.terms.map((t, ti) => (
                    <div key={ti} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 shrink-0 opacity-50">{ti + 1}.</span>
                      <EditableArea value={t} preview={preview} onChange={(v) => mutate((d) => { d.terms[ti] = v; })} rows={2} />
                      {!preview && (
                        <button onClick={() => mutate((d) => { d.terms.splice(ti, 1); })} className="mt-1 opacity-30 hover:opacity-70"><Trash2 className="h-3 w-3" /></button>
                      )}
                    </div>
                  ))}
                  {!preview && (
                    <button onClick={() => mutate((d) => { d.terms.push(""); })} className="ml-5 inline-flex items-center gap-1 text-xs opacity-50 hover:opacity-90">
                      <Plus className="h-3 w-3" /> Add term
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Personal note */}
            {(doc.note || !preview) && (
              <div className="rounded-2xl border-l-4 p-6 shadow-xl" style={{ ...paper, borderLeftColor: doc.style.accent }}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: doc.style.accent }}>
                  A note from {doc.noteAuthor || "the designer"}
                </p>
                <EditableArea value={doc.note || ""} preview={preview} onChange={(v) => mutate((d) => { d.note = v; })} className="mt-2 italic" placeholder="Really excited to work on this with you…" />
              </div>
            )}

            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-5 text-center text-xs text-zinc-500">
              {doc.status === "DRAFT" || doc.status === "SENT" ? "Approval will appear here once the client approves via the shared link." : `Client ${doc.status.toLowerCase()} — recorded.`}
            </div>
          </div>
        </div>

        {/* ── Right properties panel ── */}
        {!preview && (
          <aside className="shrink-0 space-y-6 overflow-y-auto border-t border-zinc-800 bg-zinc-900/60 p-5 scrollbar-slim lg:w-80 lg:border-l lg:border-t-0">
            <Panel title="Proposal">
              <Field label="Status">
                <select value={doc.status} onChange={(e) => mutate((d) => { d.status = e.target.value; })} className={inputCls}>
                  {["DRAFT", "SENT", "VIEWED", "ACCEPTED", "SIGNED"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Project">
                <input value={doc.projectName || ""} onChange={(e) => mutate((d) => { d.projectName = e.target.value; })} className={inputCls} placeholder="Design Project" />
              </Field>
              <Field label="Client">
                <input value={doc.clientName || ""} onChange={(e) => mutate((d) => { d.clientName = e.target.value; })} className={inputCls} placeholder="Stackby" />
              </Field>
              <Field label="Fee Structure">
                <select value={doc.fee?.structure || "Fixed Price"} onChange={(e) => mutate((d) => { d.fee = { structure: e.target.value, baseFee: d.fee?.baseFee || 0, gstPct: d.fee?.gstPct ?? 18 }; })} className={inputCls}>
                  {["Fixed Price", "Milestone", "Monthly Retainer"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Amount (base fee)">
                <input
                  type="number"
                  value={doc.fee?.baseFee || ""}
                  onChange={(e) => mutate((d) => { d.fee = { structure: d.fee?.structure || "Fixed Price", baseFee: Number(e.target.value) || 0, gstPct: d.fee?.gstPct ?? 18 }; })}
                  className={inputCls}
                  placeholder="75000"
                />
              </Field>
              <p className="text-xs text-zinc-500">Total {inr(totals.grand)} incl. GST {totals.gst ? `(${doc.fee?.gstPct ?? 18}% = ${inr(totals.gst)})` : ""}</p>
              <Field label="Expiry Date">
                <input type="date" value={doc.validUntil || ""} onChange={(e) => mutate((d) => { d.validUntil = e.target.value || null; })} className={inputCls} />
              </Field>
              <Field label="Currency">
                <select value={doc.currency} onChange={(e) => mutate((d) => { d.currency = e.target.value; })} className={inputCls}>
                  {["INR", "USD", "EUR", "GBP", "AED"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </Panel>

            <Panel title="Style">
              <Field label="Font">
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-950 p-1">
                  {(["Sans", "Serif", "Mono"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => mutate((d) => { d.style = { ...d.style, font: f }; })}
                      className={`rounded-lg py-1.5 text-xs font-medium transition ${doc.style.font === f ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-200"}`}
                      style={{ fontFamily: FONT_CSS[f] }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </Field>
              <ColorField label="Title Color" value={doc.style.titleColor} onChange={(v) => mutate((d) => { d.style = { ...d.style, titleColor: v }; })} />
              <ColorField label="Background" value={doc.style.background} onChange={(v) => mutate((d) => { d.style = { ...d.style, background: v }; })} />
              <ColorField label="Accent Color" value={doc.style.accent} onChange={(v) => mutate((d) => { d.style = { ...d.style, accent: v }; })} />
              <div className="flex gap-1.5">
                {ACCENT_SWATCHES.map((c) => (
                  <button key={c} onClick={() => mutate((d) => { d.style = { ...d.style, accent: c }; })} className={`h-6 w-6 rounded-full border-2 transition ${doc.style.accent === c ? "scale-110 border-white" : "border-transparent hover:scale-105"}`} style={{ background: c }} />
                ))}
              </div>
            </Panel>

            <Panel title="Logo">
              {doc.logoUrl ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={doc.logoUrl} alt="Logo" className="h-10 w-auto rounded-lg border border-zinc-800 bg-zinc-950 p-1 object-contain" />
                  <button onClick={() => mutate((d) => { d.logoUrl = null; })} className="text-xs text-zinc-500 hover:text-brand-400">Remove</button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-3 text-xs text-zinc-500 transition hover:border-brand-500/50 hover:text-brand-300">
                  <ImagePlus className="h-4 w-4" /> Upload logo
                  <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                </label>
              )}
            </Panel>

            <Panel title="Payment">
              <Field label="Method">
                <select defaultValue="UPI / Bank Transfer" className={inputCls}>
                  {["UPI / Bank Transfer", "Cheque", "Stripe / Razorpay", "Advance + Milestones"].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
            </Panel>
          </aside>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p className="opacity-50">{label}</p>
      <p className="mt-0.5 font-semibold" style={accent ? { color: accent } : undefined}>{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950 p-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-400">{label}</p>
        <input value={value} onChange={(e) => onChange(e.target.value)} className="h-6 w-full bg-transparent text-xs text-zinc-300 outline-none" />
      </div>
    </div>
  );
}

// Inline single-line editable (renders as plain text in preview).
function Editable({
  value,
  onChange,
  preview,
  className = "",
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  preview: boolean;
  className?: string;
  placeholder?: string;
}) {
  if (preview) return <p className={`${className} whitespace-pre-wrap`}>{value || placeholder || "—"}</p>;
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-transparent outline-none placeholder:opacity-40 ${className}`}
    />
  );
}

// Auto-growing multi-line editable.
function EditableArea({
  value,
  onChange,
  preview,
  className = "",
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  preview: boolean;
  className?: string;
  placeholder?: string;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [value, preview]);
  if (preview) return <p className={`${className} whitespace-pre-wrap leading-relaxed`}>{value || "—"}</p>;
  return (
    <textarea
      ref={ref}
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full resize-none bg-transparent leading-relaxed outline-none placeholder:opacity-40 ${className} ${textareaCls.replace("bg-zinc-950", "bg-transparent").replace("border-zinc-700", "border-transparent").replace("px-3.5", "px-1").replace("py-2.5", "py-1")}`}
    />
  );
}
