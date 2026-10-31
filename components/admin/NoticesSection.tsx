"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, X, Megaphone } from "lucide-react";
import { apiGet, apiSend } from "@/lib/client";

type Notice = { id: string; title: string; body: string; kind: string; active: boolean; publishedAt: string };
const KINDS = ["WELCOME", "UPDATE", "INFO", "MAINTENANCE"];

export function NoticesSection() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [show, setShow] = useState(false);
  const load = useCallback(() => {
    apiGet<{ notices: Notice[] }>("/api/admin/notices").then((r) => r.ok && r.data && setNotices(r.data.notices));
  }, []);
  useEffect(load, [load]);

  async function toggleActive(n: Notice) {
    await apiSend(`/api/admin/notices/${n.id}`, "PATCH", { active: !n.active });
    load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this notice?")) return;
    await apiSend(`/api/admin/notices/${id}`, "DELETE");
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-400">Notices appear in the user notice panel when they enter the app.</p>
        <button onClick={() => setShow(true)} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> New notice
        </button>
      </div>

      <div className="space-y-3">
        {notices.map((n) => (
          <div key={n.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-brand-400" />
                  <h3 className="font-medium text-zinc-100">{n.title}</h3>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">{n.kind}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-400 line-clamp-2 whitespace-pre-line">{n.body}</p>
              </div>
              <button onClick={() => remove(n.id)} className="text-zinc-600 hover:text-brand-400"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={`text-xs ${n.active ? "text-emerald-400" : "text-zinc-500"}`}>{n.active ? "Active — visible to users" : "Inactive"}</span>
              <button
                onClick={() => toggleActive(n)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${n.active ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-brand-600 text-white hover:bg-brand-700"}`}
              >
                {n.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
        {notices.length === 0 && <p className="text-sm text-zinc-500">No notices yet.</p>}
      </div>

      {show && <NoticeForm onClose={() => setShow(false)} onSaved={load} />}
    </div>
  );
}

function NoticeForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("UPDATE");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await apiSend("/api/admin/notices", "POST", { title, body, kind, active });
    setBusy(false);
    onSaved();
    onClose();
  }

  const field = "mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-500";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-7 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"><X className="h-5 w-5" /></button>
        <h2 className="text-lg font-semibold text-white">New notice</h2>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block"><span className="text-sm text-zinc-300">Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} required className={field} /></label>
          <label className="block"><span className="text-sm text-zinc-300">Body</span><textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={4} className={field} /></label>
          <label className="block"><span className="text-sm text-zinc-300">Kind</span>
            <select value={kind} onChange={(e) => setKind(e.target.value)} className={field}>
              {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-brand-600" /> Publish immediately (active)
          </label>
          <button type="submit" disabled={busy || !title.trim() || !body.trim()} className="w-full rounded-full bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            {busy ? "Saving…" : "Create notice"}
          </button>
        </form>
      </div>
    </div>
  );
}
