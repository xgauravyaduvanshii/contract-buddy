"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers, FileUp, ArrowRight, Zap, Check, Send, FileSignature, Trash2, Sparkles, Settings2,
} from "lucide-react";
import { apiGet, apiSend } from "@/lib/client";
import { Modal, ErrorNote, Spinner, Pill, EmptyBox, inputCls } from "./ui";

type Profile = {
  niches: string[] | null;
  pricingModel: string | null;
  terms: Record<string, unknown> | null;
  business: Record<string, unknown> | null;
  onboardedAt: string | null;
};

type Row = {
  id: string;
  title: string;
  client: string | null;
  status: string;
  signedAt: string | null;
  clauseCount: number;
  updatedAt: string;
};

type ProposalRow = { id: string; title: string; clientName: string | null; code: string | null; fee: { baseFee?: number } | null };

const NICHES = [
  "Brand & Graphic Design", "UI/UX Design", "Product Design (SaaS)", "Interior Design", "Motion Design",
  "Packaging Design", "Illustration", "Visual Design", "Video Editing", "Social Media Design",
  "Presentation Design", "3D / CGI", "Web Design (No-Code)", "Typography / Lettering", "Photography",
  "AR / VR Design", "Exhibition Design", "Retainer Agreement",
];

const PRICING = [
  { id: "FIXED", name: "Fixed Rate", sub: "One project, one price", icon: FileUp },
  { id: "MILESTONE", name: "Milestone-based", sub: "Payment tied to phases", icon: Zap },
  { id: "RETAINER", name: "Monthly Retainer", sub: "Ongoing monthly work", icon: Layers },
];

const TERM_GROUPS: { key: string; label: string; options: (string | number)[] }[] = [
  { key: "revisionRounds", label: "Revision rounds per phase", options: [1, 2, 3, "Unlimited"] },
  { key: "terminationFee", label: "If client cancels after kickoff?", options: ["Advance non-refundable", "50% of total fee", "30% of total fee", "No kill fee"] },
  { key: "ipTransfer", label: "IP transfers to client", options: ["On final payment", "On project completion", "On signing"] },
  { key: "latePenalty", label: "Late payment penalty", options: ["1%/month after 7 days", "1.5%/month after 7 days", "2%/month after 7 days", "No penalty"] },
  { key: "feedbackWindow", label: "Client feedback window", options: ["2 business days", "3 business days", "5 business days", "1 week"] },
];

export function ContractHome() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0); // 0 = not started, 1..3 wizard
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [propOpen, setPropOpen] = useState(false);

  // wizard draft
  const [niches, setNiches] = useState<string[]>([]);
  const [pricing, setPricing] = useState("FIXED");
  const [terms, setTerms] = useState<Record<string, string | number>>({ revisionRounds: 2, terminationFee: "Advance non-refundable", ipTransfer: "On final payment", latePenalty: "1.5%/month after 7 days", feedbackWindow: "3 business days" });
  const [business, setBusiness] = useState({ city: "", pan: "", gstin: "", upi: "", bankAccount: "", ifsc: "" });

  const load = useCallback(() => {
    Promise.all([
      apiGet<{ profile: Profile | null }>("/api/builder-profile"),
      apiGet<{ contracts: Row[] }>("/api/contracts"),
    ])
      .then(([p, c]) => {
        if (p.ok) setProfile(p.data?.profile || null);
        if (c.ok && c.data) setRows(c.data.contracts);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const onboarded = !!profile?.onboardedAt;

  async function finishSetup() {
    setBusy(true);
    setError(null);
    const r = await apiSend("/api/builder-profile", "PUT", {
      niches,
      pricingModel: pricing,
      terms: { ...terms, revisionDays: 5, extraRevisionFee: 2000 },
      business: Object.fromEntries(Object.entries(business).filter(([, v]) => String(v).trim())),
      onboarded: true,
    });
    setBusy(false);
    if (r.ok) {
      setProfile({ ...(profile || ({} as Profile)), niches, pricingModel: pricing, terms, business, onboardedAt: new Date().toISOString() });
      setStep(0);
    } else setError(r.error || "Could not save setup");
  }

  async function startContract(title: string, proposalId?: string) {
    setBusy(true);
    setError(null);
    const r = await apiSend<{ contract: { id: string } }>("/api/contracts", "POST", { title, proposalId: proposalId || null });
    setBusy(false);
    if (r.ok && r.data) router.push(`/dashboard/contracts/${r.data.contract.id}`);
    else setError(r.error || "Could not start the contract");
  }

  async function remove(id: string) {
    if (!confirm("Delete this contract?")) return;
    await apiSend(`/api/contracts/${id}`, "DELETE");
    setRows((x) => x.filter((c) => c.id !== id));
  }

  if (loading) return <div className="flex flex-1 items-center justify-center"><Spinner label="Loading Contract Builder…" /></div>;

  // ── One-time onboarding wizard ──────────────────────────────
  if (step > 0) {
    const progress = (step / 3) * 100;
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-zinc-800 px-5 py-3.5 text-sm">
          <span className="text-zinc-500">Contract Builder</span> <span className="text-zinc-700">›</span> <span className="font-medium text-white">Setup</span>
          <span className="float-right text-xs text-zinc-500">Step {step} of 3</span>
        </div>
        <div className="mx-auto max-w-2xl px-5 py-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-600/15 px-3 py-1 text-xs font-medium text-brand-300">
            <Zap className="h-3.5 w-3.5" /> One-time setup
          </span>
          <h1 className="mt-3 text-2xl font-semibold text-white">Tell ContractBuddy how you work</h1>
          <p className="mt-1 text-sm text-zinc-400">Answer once. We pre-fill every contract you create after this — forever.</p>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
          </div>

          {error && <div className="mt-4"><ErrorNote text={error} /></div>}

          <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
            {step === 1 && (
              <>
                <p className="text-xs uppercase tracking-widest text-zinc-500">Step 1 of 3</p>
                <h2 className="mt-1 text-lg font-semibold text-white">What type of designer are you?</h2>
                <p className="mt-0.5 text-sm text-zinc-400">Select all that apply — you can create contracts for any of your chosen niches.</p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {NICHES.map((n) => {
                    const on = niches.includes(n);
                    return (
                      <button
                        key={n}
                        onClick={() => setNiches((x) => (on ? x.filter((y) => y !== n) : [...x, n]))}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition ${
                          on ? "border-brand-500 bg-brand-600/15 text-brand-200" : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                        }`}
                      >
                        {on ? <Check className="h-3.5 w-3.5 shrink-0" /> : <span className="h-3.5 w-3.5 shrink-0" />}
                        <span className="truncate">{n}</span>
                      </button>
                    );
                  })}
                </div>
                <h2 className="mt-8 text-lg font-semibold text-white">How do you typically price your work?</h2>
                <p className="mt-0.5 text-sm text-zinc-400">Sets the default payment structure in every new contract.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {PRICING.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPricing(p.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        pricing === p.id ? "border-brand-500 bg-brand-600/10" : "border-zinc-700 hover:border-zinc-500"
                      }`}
                    >
                      <p.icon className={`h-5 w-5 ${pricing === p.id ? "text-brand-400" : "text-zinc-500"}`} />
                      <p className="mt-2 text-sm font-semibold text-zinc-100">{p.name}</p>
                      <p className="text-xs text-zinc-500">{p.sub}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-xs uppercase tracking-widest text-zinc-500">Step 2 of 3</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Your default contract terms</h2>
                <p className="mt-0.5 text-sm text-zinc-400">These become the defaults for every new contract. You can override them per contract anytime.</p>
                <div className="mt-5 space-y-5">
                  {TERM_GROUPS.map((g) => (
                    <div key={g.key} className="border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
                      <p className="mb-2 text-sm font-medium text-zinc-200">{g.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {g.options.map((o) => (
                          <button
                            key={String(o)}
                            onClick={() => setTerms((t) => ({ ...t, [g.key]: o }))}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                              terms[g.key] === o ? "bg-brand-600 text-white" : "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
                            }`}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <p className="text-xs uppercase tracking-widest text-zinc-500">Step 3 of 3</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Your business details</h2>
                <p className="mt-0.5 text-sm text-zinc-400">These are pre-filled in every contract. Never enter your PAN or bank details again.</p>
                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-300">Your city *</span>
                    <input value={business.city} onChange={(e) => setBusiness({ ...business, city: e.target.value })} placeholder="Start typing — e.g. Mumbai…" className={`${inputCls} mt-1.5`} />
                    <span className="mt-1 block text-xs text-zinc-500">Used as default jurisdiction city in all contracts</span>
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-zinc-300">PAN number</span>
                      <input value={business.pan} onChange={(e) => setBusiness({ ...business, pan: e.target.value.toUpperCase() })} maxLength={10} placeholder="AAAAA0000A" className={`${inputCls} mt-1.5`} />
                      <span className="mt-1 block text-xs text-zinc-500">10 characters — 5 letters, 4 digits, 1 letter</span>
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-zinc-300">GST number (if registered)</span>
                      <input value={business.gstin} onChange={(e) => setBusiness({ ...business, gstin: e.target.value.toUpperCase() })} maxLength={15} placeholder="22AAAAA0000A1Z5" className={`${inputCls} mt-1.5`} />
                      <span className="mt-1 block text-xs text-zinc-500">15 characters — state code + PAN + suffix</span>
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-300">UPI ID</span>
                    <input value={business.upi} onChange={(e) => setBusiness({ ...business, upi: e.target.value })} placeholder="yourname@okhdfcbank" className={`${inputCls} mt-1.5`} />
                    <span className="mt-1 block text-xs text-zinc-500">format: name@bank — e.g. urmate@okaxisbank</span>
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-zinc-300">Bank account number</span>
                      <input value={business.bankAccount} onChange={(e) => setBusiness({ ...business, bankAccount: e.target.value.replace(/\D/g, "") })} maxLength={16} placeholder="XXXXXXXXXXXXXXXX" className={`${inputCls} mt-1.5`} />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-zinc-300">IFSC code</span>
                      <input value={business.ifsc} onChange={(e) => setBusiness({ ...business, ifsc: e.target.value.toUpperCase() })} maxLength={11} placeholder="HDFC0000123" className={`${inputCls} mt-1.5`} />
                    </label>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border border-emerald-400 p-0.5" />
                    <p>Tax and payment details are optional — you can add them later. They stay private to your account and pre-fill only your contracts.</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setStep((s) => s - 1)} disabled={step === 1} className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 disabled:opacity-0">
              ← Back
            </button>
            {step < 3 ? (
              <button onClick={() => setStep((s) => s + 1)} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700">
                Continue →
              </button>
            ) : (
              <button onClick={finishSetup} disabled={busy || !business.city.trim()} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50">
                {busy ? <Loader /> : <><Check className="h-4 w-4" /> Start building contracts</>}
              </button>
            )}
          </div>
          {step === 3 && <p className="mt-2 text-center text-xs text-zinc-600">Your city is required — everything else is optional.</p>}
        </div>
      </div>
    );
  }

  // ── Start screen + history ─────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b border-zinc-800 px-5 py-3.5 text-sm">
        <span className="text-zinc-500">Contract Builder</span> <span className="text-zinc-700">›</span> <span className="font-medium text-white">New contract</span>
        {onboarded && (
          <button onClick={() => setStep(1)} className="float-right inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-brand-300">
            <Settings2 className="h-3.5 w-3.5" /> Edit setup
          </button>
        )}
      </div>

      <div className="mx-auto max-w-4xl px-5 py-10">
        {!onboarded ? (
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">Start your contract here</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">Set up how you work once — every future contract is pre-filled with your terms.</p>
            <button onClick={() => setStep(1)} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-700">
              <Zap className="h-4 w-4" /> One-time setup (2 minutes)
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-center text-2xl font-semibold text-white sm:text-3xl">Start your contract here</h1>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setPropOpen(true)}
                className="group rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 text-left transition hover:border-brand-500/50"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/25">
                  <Layers className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-semibold text-white">Generate with your proposal</h3>
                <p className="mt-1 text-sm text-zinc-400">Pull the client, scope and fee from an approved proposal.</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-brand-400 opacity-0 transition group-hover:opacity-100">Pick a proposal <ArrowRight className="h-3 w-3" /></span>
              </button>
              <button
                onClick={() => setAskOpen(true)}
                className="group rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 text-left transition hover:border-brand-500/50"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-950 text-zinc-300">
                  <FileUp className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-semibold text-white">Describe your contract</h3>
                <p className="mt-1 text-sm text-zinc-400">Tell the assistant what this contract is for — it asks the rest.</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-brand-400 opacity-0 transition group-hover:opacity-100">Start chatting <ArrowRight className="h-3 w-3" /></span>
              </button>
            </div>
          </>
        )}

        {error && <div className="mt-6"><ErrorNote text={error} /></div>}

        <div className="mt-12">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Your contracts</h2>
          {rows.length === 0 ? (
            <EmptyBox icon={<FileSignature className="h-6 w-6" />} title="No contracts yet" sub="Run the one-time setup, then generate a contract from a proposal or a quick chat." />
          ) : (
            <div className="space-y-2">
              {rows.map((c) => (
                <Link key={c.id} href={`/dashboard/contracts/${c.id}`} className="group flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 transition hover:border-brand-500/40">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400"><FileSignature className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-zinc-100">{c.title}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {c.client ? `${c.client} · ` : ""}{c.clauseCount ? `${c.clauseCount} clauses · ` : ""}{new Date(c.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  {c.signedAt && <Pill tone="green"><Check className="mr-1 h-3 w-3" />Signed</Pill>}
                  <Pill tone={c.status === "DRAFT" ? "zinc" : c.status === "SENT" ? "amber" : "green"}>{c.status}</Pill>
                  <button
                    onClick={(e) => { e.preventDefault(); remove(c.id); }}
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

      {askOpen && (
        <Modal title="What's this contract for?" subtitle="One line is enough — the assistant will ask for the rest." onClose={() => setAskOpen(false)}>
          <textarea
            autoFocus
            rows={3}
            id="contract-brief"
            placeholder="Logo + brand guidelines for Stackby, ₹75,000 fixed, June 15 to Aug 8…"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
          />
          <button
            onClick={() => {
              const el = document.getElementById("contract-brief") as HTMLTextAreaElement;
              const v = el.value.trim();
              if (v.length >= 5) startContract(v.slice(0, 80));
            }}
            disabled={busy}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? <Spinner label="Starting…" /> : <><Sparkles className="h-4 w-4" /> Start the contract assistant</>}
          </button>
        </Modal>
      )}

      {propOpen && <ProposalPicker onClose={() => setPropOpen(false)} busy={busy} onPick={(p) => startContract(`${p.title} — contract`, p.id)} />}
    </div>
  );
}

function Loader() {
  return <Spinner label="Saving…" />;
}

function ProposalPicker({ onClose, onPick, busy }: { onClose: () => void; busy: boolean; onPick: (p: ProposalRow) => void }) {
  const [props, setProps] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    apiGet<{ proposals: ProposalRow[] }>("/api/proposals").then((r) => {
      if (r.ok && r.data) setProps(r.data.proposals);
      setLoading(false);
    });
  }, []);
  useEffect(load, [load]);
  return (
    <Modal title="Generate with your proposal" subtitle="Pick a proposal — its client, scope and fee seed the contract." onClose={onClose}>
      {loading ? (
        <Spinner />
      ) : props.length === 0 ? (
        <EmptyBox icon={<Send className="h-6 w-6" />} title="No proposals yet" sub="Create one in the Proposal Builder first." />
      ) : (
        <div className="space-y-2">
          {props.map((p) => (
            <button
              key={p.id}
              onClick={() => onPick(p)}
              disabled={busy}
              className="flex w-full items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-left transition hover:border-brand-500/50 disabled:opacity-50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-100">{p.title}</p>
                <p className="truncate text-xs text-zinc-500">{p.code}{p.clientName ? ` · ${p.clientName}` : ""}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-zinc-500" />
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
