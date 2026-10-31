"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, X, ShieldCheck, Ban, Check } from "lucide-react";
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

export function UsersSection() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

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

  async function patch(id: string, data: Partial<AdminUser>) {
    await apiSend<{ user: AdminUser }>(`/api/admin/users/${id}`, "PATCH", data);
    setSelected(null);
    load();
  }

  return (
    <div>
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
                  <button onClick={() => setSelected(u)} className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:border-brand-500/50 hover:text-brand-300">
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

            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => patch(selected.id, { role: selected.role })} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                <Check className="h-4 w-4" /> Save role
              </button>
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
