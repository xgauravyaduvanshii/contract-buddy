"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, Plug, Palette, User as UserIcon, Check, Plus, Trash2, Archive, Undo2, Brain, Pencil, Send, Star } from "lucide-react";
import { apiGet, apiSend, apiUpload } from "@/lib/client";

type User = { id: string; email: string; name: string | null; role: string };
type Skill = { id: string; name: string; description: string | null; category: string; installed: boolean; global: boolean };
type Plugin = { id: string; name: string; description: string | null };
type DS = { id: string; name: string; tokens: Record<string, string>; global: boolean };
type LinkItem = { label: string; url: string };

const TABS = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "skills", label: "Skills", icon: Wand2 },
  { id: "plugins", label: "Plugins", icon: Plug },
  { id: "design", label: "Design system", icon: Palette },
  { id: "chats", label: "Archived chats", icon: Archive },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsView({ user }: { user: User }) {
  const [tab, setTab] = useState<TabId>("profile");

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">Manage your profile, what the AI remembers, skills, plugins and design systems.</p>

        <div className="mt-6 flex flex-wrap gap-1 border-b border-zinc-800">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                tab === t.id ? "border-brand-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "profile" && <ProfileTab user={user} />}
          {tab === "memory" && <MemoryTab />}
          {tab === "skills" && <SkillsTab />}
          {tab === "plugins" && <PluginsTab />}
          {tab === "design" && <DesignTab />}
          {tab === "chats" && <ArchivedChatsTab />}
        </div>
      </div>
    </div>
  );
}

function ArchivedChatsTab() {
  type T = { id: string; title: string; updatedAt: string };
  const [threads, setThreads] = useState<T[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(() => {
    apiGet<{ threads: T[] }>("/api/threads?archived=1").then((r) => r.ok && r.data && setThreads(r.data.threads));
  }, []);
  useEffect(load, [load]);

  async function unarchive(t: T) {
    setBusy(t.id);
    await apiSend(`/api/threads/${t.id}`, "PATCH", { archived: false });
    load();
    setBusy(null);
  }

  async function destroy(t: T) {
    setBusy(t.id);
    await apiSend(`/api/threads/${t.id}?permanent=1`, "DELETE");
    load();
    setBusy(null);
  }

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-400">
        Archived chats live here. Unarchive to bring one back to the sidebar, or delete it for good.
      </p>
      {threads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-10 text-center text-sm text-zinc-500">
          No archived chats. Archive one from the sidebar hover menu.
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
              <Archive className="h-4 w-4 shrink-0 text-zinc-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-200">{t.title || "Untitled"}</p>
                <p className="text-xs text-zinc-500">{new Date(t.updatedAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => unarchive(t)}
                disabled={busy === t.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:opacity-50"
              >
                <Undo2 className="h-3 w-3" /> Unarchive
              </button>
              <button
                onClick={() => destroy(t)}
                disabled={busy === t.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-brand-500/50 hover:text-brand-300 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SkillsTab() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(() => {
    apiGet<{ skills: Skill[] }>("/api/skills").then((r) => r.ok && r.data && setSkills(r.data.skills));
  }, []);
  useEffect(load, [load]);

  async function toggle(s: Skill) {
    setBusy(s.id);
    await apiSend(`/api/skills/${s.id}/install`, "POST");
    load();
    setBusy(null);
  }

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-400">Install skills so ContractBuddy can automatically apply them when relevant.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {skills.map((s) => (
          <div key={s.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-medium text-zinc-100">{s.name}</h3>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-brand-400">{s.category}</p>
                {s.description && <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{s.description}</p>}
              </div>
              {s.global ? (
                <span className="shrink-0 rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">Always on</span>
              ) : (
                <button
                  onClick={() => toggle(s)}
                  disabled={busy === s.id}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    s.installed ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-brand-600 text-white hover:bg-brand-700"
                  }`}
                >
                  {s.installed ? "Installed" : "Install"}
                </button>
              )}
            </div>
          </div>
        ))}
        {skills.length === 0 && <p className="text-sm text-zinc-500">No skills available yet.</p>}
      </div>
    </div>
  );
}

function PluginsTab() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  useEffect(() => {
    apiGet<{ plugins: Plugin[] }>("/api/plugins").then((r) => r.ok && r.data && setPlugins(r.data.plugins));
  }, []);
  return (
    <div>
      <p className="mb-4 text-sm text-zinc-400">Plugins are enabled workspace-wide by your admin. Available integrations:</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {plugins.map((p) => (
          <div key={p.id} className="flex items-start justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div>
              <h3 className="font-medium text-zinc-100">{p.name}</h3>
              {p.description && <p className="mt-1 text-sm text-zinc-400">{p.description}</p>}
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
              <Check className="h-3 w-3" /> On
            </span>
          </div>
        ))}
        {plugins.length === 0 && <p className="text-sm text-zinc-500">No plugins enabled.</p>}
      </div>
    </div>
  );
}

function DesignTab() {
  const [systems, setSystems] = useState<DS[]>([]);
  const [name, setName] = useState("");
  const [colors, setColors] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    apiGet<{ systems: (DS & { userId: string | null })[] }>("/api/design-systems").then((r) => {
      if (r.ok && r.data) setSystems(r.data.systems.map((s) => ({ ...s, global: s.userId === null })));
    });
  }, []);
  useEffect(load, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const tokens: Record<string, string> = {};
    colors
      .split(/[,\n]/)
      .map((c) => c.trim())
      .filter(Boolean)
      .forEach((c, i) => (tokens[`color${i + 1}`] = c));
    await apiSend<{ system: DS }>("/api/design-systems", "POST", { name, tokens: { palette: tokens } });
    setName("");
    setColors("");
    setBusy(false);
    load();
  }

  async function remove(id: string) {
    await apiSend(`/api/design-systems/${id}`, "DELETE");
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <p className="mb-4 text-sm text-zinc-400">Design systems tell the AI how to style your contracts — colors, typography and tone.</p>
        <div className="space-y-3">
          {systems.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div>
                <h3 className="font-medium text-zinc-100">{s.name}</h3>
                <div className="mt-2 flex gap-1.5">
                  {Object.entries(s.tokens?.palette || {})
                    .slice(0, 6)
                    .map(([k, v]) => (
                      <span key={k} className="h-5 w-5 rounded-full border border-zinc-700" style={{ background: String(v) }} />
                    ))}
                </div>
              </div>
              {!s.global && (
                <button onClick={() => remove(s.id)} className="text-zinc-600 hover:text-brand-400" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {systems.length === 0 && <p className="text-sm text-zinc-500">No design systems yet.</p>}
        </div>
      </div>
      <form onSubmit={create} className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-3 font-medium text-zinc-100">New design system</h3>
        <label className="block">
          <span className="text-sm text-zinc-300">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="My brand" className="mt-1.5 h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none focus:border-brand-500" />
        </label>
        <label className="mt-3 block">
          <span className="text-sm text-zinc-300">Brand colors (comma-separated hex)</span>
          <input value={colors} onChange={(e) => setColors(e.target.value)} placeholder="#dc2626, #0b0b0f, #f87171" className="mt-1.5 h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none focus:border-brand-500" />
        </label>
        <button type="submit" disabled={busy || !name.trim()} className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50">
          <Plus className="h-4 w-4" /> Save design system
        </button>
      </form>
    </div>
  );
}

function AccountInfo({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-3 text-sm text-zinc-400">
      <span className="text-xs uppercase tracking-wide text-brand-400">{user.role}</span>
      <span>·</span>
      <span>{user.email}</span>
    </div>
  );
}

// ── Profile: name, image, description, links + email change (OTP + admin) ─
type EmailRequest = { id: string; newEmail: string; status: "PENDING" | "VERIFIED" | "APPROVED" | "REJECTED" } | null;

function ProfileTab({ user }: { user: User }) {
  const router = useRouter();
  const [name, setName] = useState(user.name || "");
  const [image, setImage] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [request, setRequest] = useState<EmailRequest>(null);
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    apiGet<{ user: { image: string | null; bio: string | null; links: unknown } }>("/api/me").then((me) => {
      if (me.ok && me.data) {
        setImage(me.data.user.image);
        setBio(me.data.user.bio || "");
        setLinks(Array.isArray(me.data.user.links) ? (me.data.user.links as LinkItem[]) : []);
      }
    });
    apiGet<{ request: EmailRequest }>("/api/me/email-change").then((ec) => {
      if (ec.ok && ec.data) setRequest(ec.data.request);
    });
  }, []);
  useEffect(load, [load]);

  async function save() {
    setBusy(true);
    await apiSend("/api/me", "PATCH", { name, image, bio, links });
    setBusy(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
    router.refresh();
  }

  async function pickImage(fd: File) {
    setBusy(true);
    const form = new FormData();
    form.set("file", fd);
    form.set("kind", "IMAGE");
    const r = await apiUpload<{ attachment: { url: string } }>("/api/uploads", form);
    if (r.ok && r.data) setImage(r.data.attachment.url);
    setBusy(false);
  }

  async function startEmailChange() {
    setBusy(true);
    setEmailMsg(null);
    const r = await apiSend<{ sent: boolean }>("/api/me/email-change", "POST", { newEmail });
    setBusy(false);
    if (!r.ok) return setEmailMsg(r.error || "Could not send the code");
    const ec = await apiGet<{ request: EmailRequest }>("/api/me/email-change");
    setRequest(ec.ok && ec.data ? ec.data.request : { id: "", newEmail, status: "PENDING" });
    setEmailMsg(`Code sent to ${newEmail} (check that inbox).`);
  }

  async function verifyEmailOtp() {
    setBusy(true);
    setEmailMsg(null);
    const r = await apiSend<{ status: string }>("/api/me/email-change", "POST", { otp });
    setBusy(false);
    if (!r.ok) return setEmailMsg(r.error || "Invalid code");
    setOtp("");
    setEmailMsg("Email verified — an admin now needs to approve the change.");
    const ec = await apiGet<{ request: EmailRequest }>("/api/me/email-change");
    if (ec.ok && ec.data) setRequest(ec.data.request);
  }

  async function cancelEmailChange() {
    await apiSend("/api/me/email-change", "DELETE");
    setRequest(null);
    setNewEmail("");
    setOtp("");
    setEmailMsg(null);
  }

  const inputCls =
    "mt-1.5 h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none focus:border-brand-500";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="mb-4 flex items-center gap-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-brand-600/20 text-xl font-semibold text-brand-300 ring-1 ring-zinc-700 transition hover:ring-brand-500/60"
            title="Change profile picture"
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : (
              (name || user.email).slice(0, 1).toUpperCase()
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const fd = e.target.files?.[0];
              if (fd) void pickImage(fd);
              e.target.value = "";
            }}
          />
          <div>
            <h3 className="text-lg font-medium text-zinc-100">{name || "Unnamed"}</h3>
            <AccountInfo user={user} />
            {image && (
              <button onClick={() => setImage(null)} className="mt-1 text-xs text-zinc-500 hover:text-brand-400">
                Remove photo
              </button>
            )}
          </div>
        </div>

        <label className="block">
          <span className="text-sm text-zinc-300">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Your name" />
        </label>
        <label className="mt-3 block">
          <span className="text-sm text-zinc-300">Description</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={400}
            placeholder="Who you are, what contracts you work on…"
            className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-brand-500"
          />
        </label>

        <p className="mt-4 text-sm text-zinc-300">Links &amp; social profiles</p>
        <div className="mt-2 space-y-2">
          {links.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={l.label}
                onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                placeholder="LinkedIn"
                className="h-10 w-32 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-brand-500"
              />
              <input
                value={l.url}
                onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                placeholder="https://…"
                className="h-10 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-brand-500"
              />
              <button onClick={() => setLinks(links.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-brand-400" title="Remove link">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {links.length < 12 && (
            <button onClick={() => setLinks([...links, { label: "", url: "" }])} className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-brand-300">
              <Plus className="h-3.5 w-3.5" /> Add link
            </button>
          )}
        </div>

        <button onClick={save} disabled={busy} className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50">
          <Check className="h-4 w-4" /> {savedFlash ? "Saved" : "Save profile"}
        </button>
      </div>

      <div className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="font-medium text-zinc-100">Change email address</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Verify the new address with an OTP, then an admin approves the change. Your current email ({user.email}) stays active until then.
        </p>

        {emailMsg && <p className="mt-3 rounded-xl bg-zinc-800/70 px-3 py-2 text-sm text-zinc-300">{emailMsg}</p>}

        {request?.status === "APPROVED" ? null : request?.status === "REJECTED" ? (
          <p className="mt-3 text-sm text-brand-300">Your last change request was rejected. Start a new one below.</p>
        ) : request?.status === "VERIFIED" ? (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-sm text-emerald-300">
              <span className="font-medium">{request.newEmail}</span> is verified and waiting for admin approval.
            </p>
            <button onClick={cancelEmailChange} className="mt-2 text-xs text-zinc-400 hover:text-white">Cancel request</button>
          </div>
        ) : request?.status === "PENDING" ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-zinc-400">Enter the code sent to <span className="text-zinc-200">{request.newEmail}</span>:</p>
            <div className="flex gap-2">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code"
                className="h-11 w-40 rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-center font-mono tracking-[6px] text-zinc-100 outline-none focus:border-brand-500"
              />
              <button onClick={verifyEmailOtp} disabled={busy || otp.length !== 6} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                Verify
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <button onClick={startEmailChange} disabled={busy} className="text-zinc-400 hover:text-brand-300">Resend code</button>
              <button onClick={cancelEmailChange} className="text-zinc-500 hover:text-white">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value.trim())}
              placeholder="new@email.com"
              type="email"
              className={inputCls}
            />
            <button onClick={startEmailChange} disabled={busy || !newEmail.includes("@")} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              <Send className="h-4 w-4" /> Send verification code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Memory: AI memory cards + automatic generation / retrieval toggles ─
type MemoryCard = { id: string; kind: string; title: string; body: string; source: string; updatedAt: string };

const KIND_STYLE: Record<string, string> = {
  PROFILE: "bg-sky-500/10 text-sky-300",
  PREFERENCE: "bg-violet-500/10 text-violet-300",
  PROJECT: "bg-emerald-500/10 text-emerald-300",
  FEEDBACK: "bg-amber-500/10 text-amber-300",
  NOTE: "bg-zinc-800 text-zinc-300",
};

function MemoryToggle({ on, title, desc, onChange }: { on: boolean; title: string; desc: string; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
        on ? "border-brand-500/50 bg-brand-600/10" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
      }`}
    >
      <span className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition ${on ? "bg-brand-500" : "bg-zinc-700"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
      <span>
        <span className="block text-sm font-medium text-zinc-100">{title}</span>
        <span className="mt-0.5 block text-xs text-zinc-400">{desc}</span>
      </span>
    </button>
  );
}

function MemoryTab() {
  const [memories, setMemories] = useState<MemoryCard[]>([]);
  const [settings, setSettings] = useState({ autoGenerate: true, retrieval: true });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("PREFERENCE");
  const [editing, setEditing] = useState<MemoryCard | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    apiGet<{ memories: MemoryCard[]; settings: { autoGenerate: boolean; retrieval: boolean } }>("/api/memories").then((r) => {
      if (r.ok && r.data) {
        setMemories(r.data.memories);
        setSettings(r.data.settings);
      }
    });
  }, []);
  useEffect(load, [load]);

  async function setToggle(key: "autoGenerate" | "retrieval", value: boolean) {
    setSettings((s) => ({ ...s, [key]: value }));
    await apiSend("/api/memories/settings", "POST", { [key]: value });
  }

  async function add() {
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    await apiSend("/api/memories", "POST", { title, body, kind });
    setTitle("");
    setBody("");
    setBusy(false);
    load();
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    await apiSend(`/api/memories/${editing.id}`, "PATCH", { title: editing.title, body: editing.body, kind: editing.kind });
    setEditing(null);
    setBusy(false);
    load();
  }

  async function remove(id: string) {
    await apiSend(`/api/memories/${id}`, "DELETE");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <MemoryToggle
          on={settings.autoGenerate}
          title="Automatic generation"
          desc="Build memories automatically based on your preferences and projects as you use ContractBuddy."
          onChange={(v) => setToggle("autoGenerate", v)}
        />
        <MemoryToggle
          on={settings.retrieval}
          title="Memory retrieval"
          desc="Automatically retrieve relevant memories so every response is better informed."
          onChange={(v) => setToggle("retrieval", v)}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Memory cards ({memories.length}/40)</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {memories.map((m) => (
            <div key={m.id} className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              {editing?.id === m.id ? (
                <div className="space-y-2">
                  <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-brand-500" />
                  <textarea value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} rows={2} maxLength={300} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-brand-500" />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={busy} className="rounded-full bg-brand-600 px-3 py-1 text-xs text-white hover:bg-brand-700">Save</button>
                    <button onClick={() => setEditing(null)} className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${KIND_STYLE[m.kind] || KIND_STYLE.NOTE}`}>{m.kind}</span>
                      {m.source === "AUTO" && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500" title="Generated by the AI">
                          <Brain className="h-3 w-3" /> auto
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => setEditing({ ...m })} className="text-zinc-500 hover:text-brand-300" title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => remove(m.id)} className="text-zinc-500 hover:text-brand-400" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="mt-2 flex items-center gap-1.5 text-sm font-medium text-zinc-100">
                    <Star className="h-3 w-3 shrink-0 text-zinc-600" /> {m.title}
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">{m.body}</p>
                </>
              )}
            </div>
          ))}
          {memories.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center text-sm text-zinc-500 sm:col-span-2">
              No memories yet. Add cards below or let ContractBuddy build them automatically while you chat.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-3 font-medium text-zinc-100">Add a memory</h3>
        <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="h-11 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-brand-500">
            {["PROFILE", "PREFERENCE", "PROJECT", "FEEDBACK", "NOTE"].map((k) => (
              <option key={k} value={k}>{k.charAt(0) + k.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="Short label, e.g. “Jurisdiction”" className="h-11 rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none focus:border-brand-500" />
        </div>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={300} rows={2} placeholder="One factual sentence the AI should always remember…" className="mt-3 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-brand-500" />
        <button onClick={add} disabled={busy || !title.trim() || !body.trim()} className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50">
          <Plus className="h-4 w-4" /> Save memory
        </button>
      </div>
    </div>
  );
}
