"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, Plus, X, MessageSquare, Trash2, FileText } from "lucide-react";
import { apiGet, apiSend } from "@/lib/client";

type Project = {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  createdAt: string;
  _count: { attachments: number; contracts: number; threads: number };
};

export function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(() => {
    apiGet<{ projects: Project[] }>("/api/projects").then((r) => {
      if (r.ok && r.data) {
        setProjects(r.data.projects);
        setLoading(false);
      }
    });
  }, []);

  useEffect(load, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this project? Its chats stay but are unlinked.")) return;
    await apiSend(`/api/projects/${id}`, "DELETE");
    load();
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Projects</h1>
            <p className="mt-1 text-sm text-zinc-400">Group contracts, files and chats by client or engagement.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Add project
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : projects.length === 0 ? (
          <EmptyState onCreate={() => setShowModal(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <div key={p.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-brand-500/40">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400">
                      <FolderKanban className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-medium text-zinc-100">{p.name}</h3>
                      <p className="text-xs text-zinc-500">{p.status}</p>
                    </div>
                  </div>
                  <button onClick={() => remove(p.id)} className="text-zinc-600 transition hover:text-brand-400" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {p.goal && <p className="mt-3 line-clamp-2 text-sm text-zinc-400">{p.goal}</p>}
                <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {p._count.attachments} files</span>
                  <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {p._count.threads} chats</span>
                </div>
                <Link
                  href={`/dashboard?project=${p.id}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-brand-500/50 hover:text-brand-300"
                >
                  <MessageSquare className="h-4 w-4" /> Chat in this project
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <AddProjectModal onClose={() => setShowModal(false)} onCreated={load} />}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/15 text-brand-400">
        <FolderKanban className="h-7 w-7" />
      </span>
      <h3 className="mt-4 text-lg font-medium text-zinc-200">No projects yet</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
        Create a project to keep a client&apos;s contracts, files and conversations together.
      </p>
      <button
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
      >
        <Plus className="h-4 w-4" /> Add your first project
      </button>
    </div>
  );
}

function AddProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const r = await apiSend<{ project: Project }>("/api/projects", "POST", { name, goal });
    setBusy(false);
    if (!r.ok) {
      setErr(r.error || "Could not create project");
      return;
    }
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-7 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold text-white">New project</h2>
        <p className="mt-1 text-sm text-zinc-400">Give it a name and describe what you&apos;re trying to achieve.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {err && <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-2.5 text-sm text-brand-300">{err}</div>}
          <label className="block">
            <span className="text-sm font-medium text-zinc-300">Project name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Acme Website Rebuild"
              className="mt-1.5 h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-300">What are you trying to achieve?</span>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              placeholder="A fixed-price contract for a 6-week rebuild with two milestones…"
              className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="w-full rounded-full bg-brand-600 py-3 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create project"}
          </button>
        </form>
      </div>
    </div>
  );
}
