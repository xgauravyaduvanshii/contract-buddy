"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, X, ShieldCheck, Ban, Check, MailPlus, Trash2 } from "lucide-react";
import { apiGet, apiSend } from "@/lib/client";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  provider: string;
  suspended: boolean;
  emailVerified: boolean;
  createdAt: string;
  _count: { projects: number; threads: number; contracts: number };
};

type EmailChange = { id: string; newEmail: string; status: string; updatedAt: string; user: { id: string; email: string; name: string | null } };
type Profile = { name: string; image: string; bio: string; links: { label: string; url: string }[] };
type LinkItem = { label: string; url: string };

export function UsersSection() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState<EmailChange[]>([]);
  const [prof, setProf] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiGet<{ users: AdminUser[] }>(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then((r) => r.ok && r.data && setUsers(r.data.users))
      .finally(() => setLoading(false));
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const loadChanges = useCallback(() => {
    apiGet<{ requests: EmailChange[] }>("/api/admin/email-changes").then((r) => r.ok && r.data && setChanges(r.data.requests));
  }, []);
  useEffect(() => {
    loadChanges();
  }, [loadChanges]);

  async function patch(id: string, data: Record<string, unknown>) {
    setBusy(true);
    await apiSend<{ user: AdminUser }>(`/api/admin/users/${id}`, "PATCH", data);
    setSelected(null);
    setProf(null);
    setBusy(false);
    load();
  }

  async function openManage(u: AdminUser) {
    setSelected(u);
    setProf(null);
    const r = await apiGet<{ user: { name: string | null; image: string | null; bio: string | null; links: unknown } }>(`/api/admin/users/${u.id}`);
    if (r.ok && r.data) {
      setProf({
        name: r.data.user.name || "",
        image: r.data.user.image || "",
        bio: r.data.user.bio || "",
        links: Array.isArray(r.data.user.links) ? (r.data.user.links as LinkItem[]) : [],
      });
    }
  }

  async function decide(c: EmailChange, approve: boolean) {
    setBusy(true);
    const r = await apiSend<{ status: string }>(`/api/admin/email-changes/${c.id}`, "POST", { approve });
    setBusy(false);
    if (!r.ok) alert(r.error || "Failed");
    loadChanges();
    load();
  }

  return (
    <div>
      {changes.length > 0 && (
        <div className="mb-5 rounded-2xl border border-brand-500/30 bg-brand-600/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <MailPlus className="h-4 w-4 text-brand-300" />
            <h3 className="text-sm font-semibold text-zinc-100">Email change requests ({changes.length})</h3>
          </div>
          <div className="space-y-2">
            {changes.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm">
                <span className="text-zinc-200">{c.user.name || c.user.email}</span>
                <span className="text-xs text-zinc-500">{c.user.email}</span>
                <span className="text-xs text-zinc-400">→</span>
                <span className="text-brand-300">{c.newEmail}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${c.status === "VERIFIED" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                  {c.status === "VERIFIED" ? "OTP verified" : "OTP pending"}
                </span>
                <div className="ml-auto flex gap-2">
                  <button onClick={() => decide(c, true)} disabled={busy || c.status !== "VERIFIED"} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40" title={c.status !== "VERIFIED" ? "User must verify the OTP first" : ""}>
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button onClick={() => decide(c, false)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-40">
                    <Trash2 className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4">
        <Search className="h-4 w-4 text-zinc-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by email or name…" className="h-11 flex-1 bg-transparent text-sm text-zinc-100 outline-none" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/70 text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="hidden px-4 py-3 sm:table-cell">Role</th>
              <th className="hidden px-4 py-3 md:table-cell">Activity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-900/40">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-100">{u.name || "—"}</p>
                  <p className="text-xs text-zinc-500">{u.email}</p>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${u.role === "ADMIN" ? "bg-brand-500/15 text-brand-300" : "bg-zinc-800 text-zinc-300"}`}>
                    {u.role === "ADMIN" && <ShieldCheck className="h-3 w-3" />}
                    {u.role}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-xs text-zinc-500 md:table-cell">
                  {u._count.threads} chats · {u._count.projects} projects
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs ${u.suspended ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                    {u.suspended ? "Suspended" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openManage(u)} className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:border-brand-500/50 hover:text-brand-300">
                    Manage
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">{loading ? "Loading…" : "No users found."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-7 shadow-2xl">
            <button onClick={() => setSelected(null)} className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"><X className="h-5 w-5" /></button>
            <h2 className="text-lg font-semibold text-white">{selected.name || selected.email}</h2>
            <p className="mt-1 text-sm text-zinc-400">{selected.email}</p>
            <p className="mt-1 text-xs text-zinc-600">Signed up via {selected.provider.toLowerCase()} · {new Date(selected.createdAt).toLocaleDateString()}</p>

            <div className="mt-6 space-y-3">
              <Row label="Role">
                <select value={selected.role} onChange={(e) => setSelected({ ...selected, role: e.target.value })} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100">
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </Row>
              <Row label="Verified">
                <span className={selected.emailVerified ? "text-emerald-400" : "text-zinc-500"}>{selected.emailVerified ? "Yes" : "No"}</span>
              </Row>
            </div>

            {prof && (
              <div className="mt-4 space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Profile</p>
                <input value={prof.name} onChange={(e) => setProf({ ...prof, name: e.target.value })} placeholder="Name" className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-brand-500" />
                <input value={prof.image} onChange={(e) => setProf({ ...prof, image: e.target.value })} placeholder="Image URL (/uploads/… or https://…)" className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-brand-500" />
                <textarea value={prof.bio} onChange={(e) => setProf({ ...prof, bio: e.target.value })} rows={2} maxLength={400} placeholder="Description" className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-brand-500" />
                {prof.links.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={l.label} onChange={(e) => setProf({ ...prof, links: prof.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} placeholder="Label" className="h-9 w-28 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-zinc-100 outline-none focus:border-brand-500" />
                    <input value={l.url} onChange={(e) => setProf({ ...prof, links: prof.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} placeholder="https://…" className="h-9 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-zinc-100 outline-none focus:border-brand-500" />
                    <button onClick={() => setProf({ ...prof, links: prof.links.filter((_, j) => j !== i) })} className="text-zinc-600 hover:text-brand-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                <button onClick={() => setProf({ ...prof, links: [...prof.links, { label: "", url: "" }] })} className="text-xs text-zinc-400 hover:text-brand-300">+ Add link</button>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => patch(selected.id, { role: selected.role })} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50" disabled={busy}>
                <Check className="h-4 w-4" /> Save role
              </button>
              {prof && (
                <button onClick={() => patch(selected.id, { name: prof.name, image: prof.image, bio: prof.bio, links: prof.links })} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:border-brand-500/50 disabled:opacity-50">
                  <Check className="h-4 w-4" /> Save profile
                </button>
              )}
              {selected.suspended ? (
                <button onClick={() => patch(selected.id, { suspended: false })} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10">
                  <Check className="h-4 w-4" /> Reactivate
                </button>
              ) : (
                <button onClick={() => patch(selected.id, { suspended: true })} className="inline-flex items-center gap-2 rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10">
                  <Ban className="h-4 w-4" /> Suspend
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-2.5">
      <span className="text-sm text-zinc-400">{label}</span>
      {children}
    </div>
  );
}
