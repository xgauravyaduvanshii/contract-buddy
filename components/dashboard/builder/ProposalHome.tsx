"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, LayoutGrid, Sparkles, FileText, ArrowRight, Trash2, Wand2 } from "lucide-react";
import { apiGet, apiSend } from "@/lib/client";
import { Modal, ErrorNote, Spinner, Pill, EmptyBox, toneDot, textareaCls } from "./ui";
import type { ProposalSection, ProposalFee } from "@/lib/builder-types";

type Tmpl = {
  id: string;
  key: string;
  name: string;
  badge: string | null;
  description: string | null;
  priceHint: string | null;
  tone: string;
  tags: string[] | null;
  sections: ProposalSection[];
  fee: { structure: string; baseFee: number } | null;
  terms: string[] | null;
  userId: string | null;
};

type Row = {
  id: string;
  title: string;
  code: string | null;
  clientName: string | null;
  status: string;
  updatedAt: string;
  fee: ProposalFee | null;
};

export function ProposalHome() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickOpen, setPickOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    apiGet<{ proposals: Row[] }>("/api/proposals")
      .then((r) => {
        if (r.ok && r.data) setRows(r.data.proposals);
        else setError(r.error || "Could not load proposals");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function startBlank() {
    setBusy(true);
    setError(null);
    const r = await apiSend<{ proposal: { id: string } }>("/api/proposals", "POST", {
      title: "Untitled proposal",
      sections: [
        { id: "overview", title: "Project Overview", kind: "text", content: "" },
        { id: "scope", title: "Scope of Work", kind: "list", items: [] },
        { id: "timeline", title: "Timeline", kind: "text", content: "" },
        { id: "investment", title: "Investment", kind: "text", content: "" },
      ],
    });
    setBusy(false);
    if (r.ok && r.data) router.push(`/dashboard/proposals/${r.data.proposal.id}`);
    else setError(r.error || "Could not create the proposal");
  }

  async function useTemplate(t: Tmpl) {
    setBusy(true);
    setError(null);
    const r = await apiSend<{ proposal: { id: string } }>("/api/proposals", "POST", {
      title: t.name,
      sections: t.sections,
      terms: t.terms ?? [],
      fee: t.fee ? { structure: t.fee.structure, baseFee: t.fee.baseFee, gstPct: 18 } : undefined,
      templateKey: t.key,
    });
    setBusy(false);
    if (r.ok && r.data) router.push(`/dashboard/proposals/${r.data.proposal.id}`);
    else setError(r.error || "Could not start from the template");
  }

  async function remove(id: string) {
    if (!confirm("Delete this proposal?")) return;
    await apiSend(`/api/proposals/${id}`, "DELETE");
    setRows((x) => x.filter((p) => p.id !== id));
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b border-zinc-800 px-5 py-3.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500">Proposal Builder</span>
          <span className="text-zinc-700">›</span>
          <span className="font-medium text-white">New proposal</span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="text-center text-2xl font-semibold text-white sm:text-3xl">How do you want to start? 🤔</h1>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={startBlank}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/70 px-5 py-3 text-sm font-medium text-zinc-100 transition hover:border-brand-500/60 hover:bg-zinc-900 disabled:opacity-50"
          >
            <Plus className="h-4 w-4 text-brand-400" /> Blank proposal
          </button>
          <button
            onClick={() => setPickOpen(true)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/70 px-5 py-3 text-sm font-medium text-zinc-100 transition hover:border-brand-500/60 hover:bg-zinc-900 disabled:opacity-50"
          >
            <LayoutGrid className="h-4 w-4 text-brand-400" /> Start with template
          </button>
          <button
            onClick={() => setAiOpen(true)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-2xl border border-brand-500/40 bg-brand-600/10 px-5 py-3 text-sm font-medium text-brand-200 transition hover:bg-brand-600/20 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" /> Generate with AI
          </button>
        </div>

        {error && (
          <div className="mt-6">
            <ErrorNote text={error} />
          </div>
        )}

        <div className="mt-12">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Your proposals</h2>
          {loading ? (
            <Spinner />
          ) : rows.length === 0 ? (
            <EmptyBox
              icon={<FileText className="h-6 w-6" />}
              title="No proposals yet"
              sub="Start blank, from a template, or let the AI draft one from a one-line brief."
            />
          ) : (
            <div className="space-y-2">
              {rows.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/proposals/${p.id}`}
                  className="group flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 transition hover:border-brand-500/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-zinc-100">{p.title}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {p.code}
                      {p.clientName ? ` · ${p.clientName}` : ""} · {new Date(p.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <Pill tone={p.status === "DRAFT" ? "zinc" : p.status === "ACCEPTED" || p.status === "SIGNED" ? "green" : "amber"}>{p.status}</Pill>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      remove(p.id);
                    }}
                    className="text-zinc-600 opacity-0 transition hover:text-brand-400 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:text-brand-400" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {pickOpen && <TemplatePicker onClose={() => setPickOpen(false)} onUse={useTemplate} busy={busy} />}
      {aiOpen && <AIGenerateModal onClose={() => setAiOpen(false)} busy={busy} onGenerate={async (brief) => {
        setBusy(true);
        const r = await apiSend<{ proposal: { id: string } }>("/api/proposals/generate", "POST", { brief });
        setBusy(false);
        if (r.ok && r.data) router.push(`/dashboard/proposals/${r.data.proposal.id}`);
        else setError(r.error || "AI generation failed");
      }} />}
    </div>
  );
}

function TemplatePicker({ onClose, onUse, busy }: { onClose: () => void; onUse: (t: Tmpl) => void; busy: boolean }) {
  const [templates, setTemplates] = useState<Tmpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Tmpl | null>(null);

  const load = useCallback(() => {
    apiGet<{ templates: Tmpl[] }>("/api/templates?kind=PROPOSAL").then((r) => {
      if (r.ok && r.data) setTemplates(r.data.templates);
      setLoading(false);
    });
  }, []);
  useEffect(load, [load]);

  return (
    <Modal title="Choose a template" subtitle="Pick one to start — you can edit everything after." onClose={onClose} wide>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected?.id === t.id ? "border-brand-500 bg-brand-600/10" : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-600"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${toneDot(t.tone)}`} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{t.badge || "TEMPLATE"}</span>
                  {t.userId && <Pill tone="brand">yours</Pill>}
                </div>
                <h3 className="mt-2 font-semibold text-white">{t.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{t.description}</p>
                {t.priceHint && <p className="mt-2 text-sm font-semibold text-brand-400">{t.priceHint}</p>}
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {(t.tags || []).slice(0, 2).map((g) => (
                    <span key={g} className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{g}</span>
                  ))}
                  {(t.tags || []).length > 2 && (
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">+{(t.tags || []).length - 2}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-4">
            <p className="text-sm text-zinc-500">{selected ? `Selected: ${selected.name}` : "Select a template to continue"}</p>
            <button
              onClick={() => selected && onUse(selected)}
              disabled={!selected || busy}
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-40"
            >
              {busy ? "Creating…" : "Use this template"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

function AIGenerateModal({
  onClose,
  onGenerate,
  busy,
}: {
  onClose: () => void;
  onGenerate: (brief: string) => Promise<void>;
  busy: boolean;
}) {
  const [brief, setBrief] = useState("");
  return (
    <Modal title="Generate with AI" subtitle="Describe the project — the AI drafts a full proposal you can edit." onClose={onClose}>
      <textarea
        autoFocus
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        rows={5}
        placeholder="Brand identity for Stackby, a B2B SaaS in Mumbai. Fixed price around ₹1,00,000, 4-6 weeks, logo + guidelines…"
        className={textareaCls}
      />
      <button
        onClick={() => brief.trim().length >= 8 && onGenerate(brief.trim())}
        disabled={busy || brief.trim().length < 8}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {busy ? <Spinner label="Drafting…" /> : <><Wand2 className="h-4 w-4" /> Generate proposal</>}
      </button>
      <p className="mt-2 text-center text-xs text-zinc-600">Takes ~15-20 seconds. Uses your AI memories for tone and pricing.</p>
    </Modal>
  );
}
