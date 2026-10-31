"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Bot, Check, Download, Loader2, PenLine, Send, Sparkles, ChevronDown, Pencil, X, ShieldCheck,
} from "lucide-react";
import { apiGet, apiSend } from "@/lib/client";
import type { ContractClause, ContractFees, ChatTurn } from "@/lib/builder-types";
import { inr } from "@/lib/builder-types";
import { BuilderHeader, ErrorNote, Spinner, Modal, Pill, ghostBtn } from "./ui";

type Doc = {
  id: string;
  title: string;
  client: string | null;
  status: string;
  jurisdiction: string | null;
  clauses: ContractClause[];
  fees: ContractFees | null;
  chat: ChatTurn[];
  suggestions: string[];
  signature: { type: string; value: string; at: string } | null;
  signedAt: string | null;
};

export function ContractEditor({ id }: { id: string }) {
  const router = useRouter();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [openClause, setOpenClause] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    apiGet<{ contract: Record<string, unknown> }>(`/api/contracts/${id}`).then((r) => {
      if (!r.ok || !r.data) {
        setError(r.error || "Could not load this contract");
        return;
      }
      const c = r.data.contract;
      setDoc({
        id: String(c.id),
        title: String(c.title || ""),
        client: (c.client as string) ?? null,
        status: String(c.status || "DRAFT"),
        jurisdiction: (c.jurisdiction as string) ?? "India",
        clauses: Array.isArray(c.clauses) ? (c.clauses as ContractClause[]) : [],
        fees: (c.fees as ContractFees) ?? null,
        chat: Array.isArray(c.chat) ? (c.chat as ChatTurn[]) : [],
        suggestions: Array.isArray(c.suggestions) ? (c.suggestions as string[]) : [],
        signature: (c.signature as Doc["signature"]) ?? null,
        signedAt: c.signedAt ? String(c.signedAt) : null,
      });
    });
  }, [id]);

  useEffect(load, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [doc?.chat.length, busy]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || busy) return;
    setError(null);
    setInput("");
    setDoc((d) => (d ? { ...d, chat: [...d.chat, { role: "USER", content: msg }], suggestions: [] } : d));
    setBusy(true);
    const r = await apiSend<{
      reply: string;
      suggestions: string[];
      contract: { title: string; client: string | null; clauses: unknown; fees: unknown; status: string };
    }>(`/api/contracts/${id}/message`, "POST", { message: msg });
    setBusy(false);
    if (!r.ok || !r.data) {
      setError(r.error || "The assistant didn't respond. Try again.");
      setDoc((d) => (d ? { ...d, chat: d.chat.slice(0, -1) } : d));
      setInput(msg);
      return;
    }
    const rd = r.data;
    setDoc((d) =>
      d
        ? {
            ...d,
            chat: [...d.chat, { role: "ASSISTANT", content: rd.reply }],
            suggestions: rd.suggestions || [],
            title: rd.contract?.title || d.title,
            client: rd.contract?.client ?? d.client,
            clauses: Array.isArray(rd.contract?.clauses) ? (rd.contract!.clauses as ContractClause[]) : d.clauses,
            fees: (rd.contract?.fees as ContractFees) ?? d.fees,
            status: String(rd.contract?.status || d.status),
          }
        : d,
    );
  }

  async function saveClause(n: number, text: string) {
    const clauses = (doc?.clauses || []).map((c) => (c.n === n ? { ...c, text } : c));
    setDoc((d) => (d ? { ...d, clauses } : d));
    const r = await apiSend(`/api/contracts/${id}`, "PATCH", { clauses });
    if (!r.ok) setError(r.error || "Could not save the clause");
  }

  async function sendToClient() {
    const r = await apiSend(`/api/contracts/${id}`, "PATCH", { status: "SENT" });
    if (r.ok) setDoc((d) => (d ? { ...d, status: "SENT" } : d));
  }

  if (error && !doc) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <ErrorNote text={error} />
        <button onClick={() => router.push("/dashboard/contracts")} className={`${ghostBtn} mt-4`}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
      </div>
    );
  }
  if (!doc) {
    return <div className="flex flex-1 items-center justify-center"><Spinner label="Opening contract…" /></div>;
  }

  const ready = doc.clauses.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <style>{`@media print { body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute !important; left: 0; top: 0; width: 100%; max-height: none !important; overflow: visible !important; } }`}</style>
      <BuilderHeader
        crumb="Contract Builder"
        title={doc.title}
        onCrumbClick={() => router.push("/dashboard/contracts")}
        actions={
          <>
            {doc.signedAt && <Pill tone="green"><Check className="mr-1 h-3 w-3" />You signed</Pill>}
            <button onClick={() => window.print()} className={ghostBtn}><Download className="h-3.5 w-3.5" /> PDF</button>
            {!doc.signedAt && ready && (
              <button onClick={() => setSignOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700">
                <Send className="h-3.5 w-3.5" /> Send
              </button>
            )}
            {doc.signedAt && doc.status === "DRAFT" && (
              <button onClick={sendToClient} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700">
                <Send className="h-3.5 w-3.5" /> Send to client
              </button>
            )}
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${doc.status === "DRAFT" ? "bg-zinc-800 text-zinc-400" : "bg-amber-500/15 text-amber-300"}`}>{doc.status}</span>
          </>
        }
      />

      <div className="grid min-h-0 flex-1 grid-rows-2 gap-0 overflow-hidden lg:grid-cols-2 lg:grid-rows-1">
        {/* ── Left: assistant chat ── */}
        <div className="flex min-h-0 flex-col border-r border-zinc-800">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 scrollbar-slim">
            {doc.chat.length === 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-400">
                <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600/15 text-brand-400"><Bot className="h-4 w-4" /></span>
                Let&apos;s build this contract. Tell me about the project — client name, what you&apos;re delivering, the fee, and the dates. I&apos;ll ask for anything missing, then draft the full clause set on the right.
              </div>
            )}
            {doc.chat.map((t, i) => (
              <div key={i} className={`flex ${t.role === "USER" ? "justify-end" : "justify-start"}`}>
                {t.role === "ASSISTANT" && (
                  <span className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400">
                    <Bot className="h-3.5 w-3.5" />
                  </span>
                )}
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    t.role === "USER" ? "bg-brand-600 text-white" : "border border-zinc-800 bg-zinc-900/70 text-zinc-200"
                  }`}
                >
                  {t.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> The assistant is thinking…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {doc.suggestions.length > 0 && !busy && (
            <div className="flex flex-wrap gap-1.5 px-5 pb-2">
              {doc.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-brand-500/50 hover:text-brand-300"
                >
                  <Sparkles className="h-3 w-3 text-brand-400" /> {s}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-zinc-800 p-4">
            <div className="flex items-end gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/80 p-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder={ready ? "Ask me to adjust anything…" : "Describe the contract…"}
                className="max-h-28 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 scrollbar-none"
              />
              <button
                onClick={() => send(input)}
                disabled={busy || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            {error && <div className="mt-2"><ErrorNote text={error} /></div>}
          </div>
        </div>

        {/* ── Right: live contract preview ── */}
        <div className="print-area flex min-h-0 flex-col bg-zinc-950/60">
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-5 py-3">
            <span className="text-sm font-medium text-zinc-200">Contract preview</span>
            {ready ? <Pill tone="green"><Check className="mr-1 h-3 w-3" />READY</Pill> : <Pill>Collecting details</Pill>}
            {ready && <span className="text-xs text-zinc-500">{doc.clauses.length} clauses</span>}
            <span className="ml-auto text-xs text-zinc-500">TDS 194J · {doc.jurisdiction}</span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5 scrollbar-slim">
            <div className="mx-auto max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
              <h1 className="text-lg font-semibold text-white">{doc.title}</h1>
              <p className="mt-0.5 text-xs text-zinc-500">{doc.client ? `with ${doc.client}` : "client to be confirmed"} · {doc.jurisdiction}</p>
              {doc.fees && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <FeeBox label={`Fee (excl. GST)`} value={inr(doc.fees.fee)} />
                  <FeeBox label={`GST (${doc.fees.gstPct}%)`} value={doc.fees.gst ? inr(doc.fees.gst) : "N/A"} />
                  <FeeBox label="Grand total" value={inr(doc.fees.grand)} strong />
                  <FeeBox label="Jurisdiction" value={doc.jurisdiction || "India"} />
                </div>
              )}
              {doc.fees?.advance ? <p className="mt-2 text-xs text-zinc-500">Advance {inr(doc.fees.advance)} payable on signing.</p> : null}

              <p className="mt-6 mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Contract clauses</p>
              {!ready ? (
                <p className="rounded-xl border border-dashed border-zinc-700 p-4 text-center text-xs text-zinc-500">
                  Answer the assistant&apos;s questions on the left — the clause set appears here when ready.
                </p>
              ) : (
                <div className="space-y-2">
                  {doc.clauses.map((c) => (
                    <div key={c.n} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
                      <div className="flex items-center gap-2 px-3.5 py-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-[10px] text-zinc-400">{c.n}</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-200">{c.title}</span>
                        <button
                          onClick={() => setOpenClause(openClause === c.n ? null : c.n)}
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
                        >
                          <Pencil className="h-3 w-3" /> Edit <ChevronDown className={`h-3 w-3 transition ${openClause === c.n ? "rotate-180" : ""}`} />
                        </button>
                      </div>
                      {openClause === c.n && (
                        <ClauseEditor text={c.text} onSave={(t) => saveClause(c.n, t)} onClose={() => setOpenClause(null)} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {ready && (
                <div className="mt-4 rounded-xl border border-brand-500/25 bg-brand-600/5 px-4 py-2.5 text-[11px] leading-relaxed text-brand-200">
                  <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
                  Indian Contract Act, 1872 · Copyright Act, 1957 (§17 &amp; §19) · IT Act, 2000 (§5 &amp; §10A) · GST · TDS u/s 194J
                </div>
              )}

              {doc.signature && (
                <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Designer signature · {new Date(doc.signedAt || doc.signature.at).toLocaleDateString("en-IN")}</p>
                  {doc.signature.type === "DRAW" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={doc.signature.value} alt="Signature" className="mt-2 h-14 w-auto object-contain" />
                  ) : (
                    <p className="mt-1 font-serif text-2xl italic text-zinc-100">{doc.signature.value}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {signOpen && (
        <SignModal
          onClose={() => setSignOpen(false)}
          onApply={async (type, value) => {
            const r = await apiSend<{ signedAt: string; signature: Doc["signature"] }>(`/api/contracts/${id}/sign`, "POST", { type, value });
            if (r.ok && r.data) {
              setDoc((d) => (d ? { ...d, signedAt: r.data!.signedAt, signature: r.data!.signature } : d));
              setSignOpen(false);
            } else setError(r.error || "Could not apply the signature");
          }}
          defaultName={doc.client ? "The Designer" : "The Designer"}
        />
      )}
    </div>
  );
}

function FeeBox({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2">
      <p className="text-[10px] text-zinc-500">{label}</p>
      <p className={`text-sm ${strong ? "font-semibold text-brand-300" : "text-zinc-200"}`}>{value}</p>
    </div>
  );
}

function ClauseEditor({ text, onSave, onClose }: { text: string; onSave: (t: string) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(text);
  return (
    <div className="border-t border-zinc-800 p-3">
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-xs leading-relaxed text-zinc-200 outline-none focus:border-brand-500 scrollbar-slim" />
      <div className="mt-2 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-full px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-800">Cancel</button>
        <button
          onClick={() => {
            onSave(draft);
            onClose();
          }}
          className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700"
        >
          <Check className="h-3 w-3" /> Save clause
        </button>
      </div>
    </div>
  );
}

function SignModal({ onClose, onApply, defaultName }: { onClose: () => void; onApply: (type: "TYPE" | "DRAW", value: string) => Promise<void>; defaultName: string }) {
  const [tab, setTab] = useState<"TYPE" | "DRAW">("TYPE");
  const [name, setName] = useState(defaultName);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * canvasRef.current!.width, y: ((e.clientY - rect.top) / rect.height) * canvasRef.current!.height };
  }

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current!.getContext("2d")!;
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(...Object.values(pos(e)) as [number, number]);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#18181b";
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  }

  function up() {
    drawingRef.current = false;
  }

  function clear() {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  }

  async function apply() {
    setBusy(true);
    if (tab === "TYPE") {
      await onApply("TYPE", name.trim());
    } else {
      const data = canvasRef.current!.toDataURL("image/png");
      await onApply("DRAW", data);
    }
    setBusy(false);
  }

  return (
    <Modal title="Sign before sending" subtitle="Your signature is applied to your side of the contract. The client signs their side after." onClose={onClose}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-400">Your signature</p>
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-zinc-950 p-1">
        {(["TYPE", "DRAW"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg py-2 text-sm font-medium transition ${tab === t ? "bg-zinc-800 text-brand-300" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            {t === "TYPE" ? "Type name" : "Draw signature"}
          </button>
        ))}
      </div>

      {tab === "TYPE" ? (
        <div className="mt-4">
          <p className="mb-1.5 text-sm text-zinc-300">Type your full legal name</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-14 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-center font-serif text-2xl italic text-zinc-100 outline-none focus:border-brand-500"
          />
        </div>
      ) : (
        <div className="mt-4">
          <canvas
            ref={canvasRef}
            width={560}
            height={180}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerLeave={up}
            className="h-40 w-full cursor-crosshair touch-none rounded-xl border border-zinc-700 bg-zinc-100"
          />
          <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-500">
            <span>Draw with your mouse or finger</span>
            <button onClick={clear} className="inline-flex items-center gap-1 hover:text-zinc-300"><X className="h-3 w-3" /> Clear</button>
          </div>
        </div>
      )}

      <button
        onClick={apply}
        disabled={busy || (tab === "TYPE" ? !name.trim() : !hasInk)}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><PenLine className="h-4 w-4" /> Apply signature</>}
      </button>
      <p className="mt-2 text-center text-xs text-zinc-600">Legally valid under the IT Act, 2000</p>
    </Modal>
  );
}
