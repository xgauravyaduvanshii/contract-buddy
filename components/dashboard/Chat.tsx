"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus, Paperclip, FolderInput, Wand2, Palette, Plug, Globe, Image as ImageIcon, Send, X, Loader2,
} from "lucide-react";
import { apiGet, apiSend, apiUpload } from "@/lib/client";
import { Dropdown, ModeMenu, ModelMenu, type ModelOption } from "./Menus";
import { MessageRow, type ChatMsg, type ToolCall } from "./MessageList";
import { type ModeId } from "@/lib/modes-client";

const DEFAULT_MODEL = "gemini/gemini-2.5-flash";

type Attachment = { id: string; name: string; url: string; kind: string };
type Project = { id: string; name: string };
type Skill = { id: string; name: string; description: string | null; installed: boolean; category: string };
type DesignSystem = { id: string; name: string };
type Plugin = { id: string; name: string; description: string | null };

export function Chat() {
  const router = useRouter();
  const params = useSearchParams();
  const threadId = params.get("thread");

  const [models, setModels] = useState<ModelOption[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [designSystems, setDesignSystems] = useState<DesignSystem[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);

  const [mode, setMode] = useState<ModeId>("AUTO");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [designSystemId, setDesignSystemId] = useState<string | null>(null);
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [webSearch, setWebSearch] = useState(false);
  const [imageGen, setImageGen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Load catalogs once
  useEffect(() => {
    apiGet<{ models: (ModelOption & { enabled: boolean })[] }>("/api/models").then((r) => {
      if (r.ok && r.data) {
        const list = r.data.models.filter((m) => m.id.includes("chat") || true).slice(0, 120);
        setModels(list);
      }
    });
    apiGet<{ projects: Project[] }>("/api/projects").then((r) => r.ok && r.data && setProjects(r.data.projects));
    apiGet<{ skills: Skill[] }>("/api/skills").then((r) => r.ok && r.data && setSkills(r.data.skills));
    apiGet<{ systems: DesignSystem[] }>("/api/design-systems").then((r) => r.ok && r.data && setDesignSystems(r.data.systems));
    apiGet<{ plugins: Plugin[] }>("/api/plugins").then((r) => r.ok && r.data && setPlugins(r.data.plugins));
  }, []);

  // Load a thread when ?thread changes
  useEffect(() => {
    if (!threadId) {
      // Reset conversation when navigating to a fresh chat (param-driven, intentional)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([]);
      const presetProject = params.get("project");
      setProjectId(presetProject ?? null);
      return;
    }
    setLoadingThread(true);
    apiGet<{ thread: { mode: ModeId; model: string | null; projectId: string | null; messages: { id: string; role: string; content: string; thinking?: string; toolCalls?: ToolCall[] }[] } }>(
      `/api/threads/${threadId}`,
    )
      .then((r) => {
        if (r.ok && r.data?.thread) {
          const t = r.data.thread;
          setMode(t.mode || "AUTO");
          if (t.model) setModel(t.model);
          setProjectId(t.projectId);
          setMessages(
            t.messages
              .filter((m) => m.role === "USER" || m.role === "ASSISTANT")
              .map((m) => ({
                id: m.id,
                role: m.role as "USER" | "ASSISTANT",
                content: m.content,
                thinking: m.thinking,
                toolCalls: m.toolCalls,
              })),
          );
        }
      })
      .finally(() => setLoadingThread(false));
  }, [threadId, params]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const autoGrow = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, []);

  async function onPickFiles(files: FileList | null) {
    if (!files) return;
    setError(null);
    for (const f of Array.from(files)) {
      const form = new FormData();
      form.set("file", f);
      if (projectId) form.set("projectId", projectId);
      const r = await apiUpload<{ attachment: Attachment }>("/api/uploads", form);
      if (r.ok && r.data) setAttachments((a) => [...a, r.data!.attachment]);
      else setError(r.error || "Upload failed");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";

    const tempId = `tmp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "USER", content: text }]);
    setBusy(true);

    const res = await apiSend<{
      threadId: string;
      mode: ModeId;
      assistantMessage: { id: string; content: string; thinking: string | null; toolCalls: ToolCall[] };
    }>("/api/chat", "POST", {
      threadId,
      message: text,
      mode,
      model,
      projectId,
      designSystemId,
      skillIds,
      attachmentIds: attachments.map((a) => a.id),
      tools: { webSearch, imageGen: imageGen ? text : undefined },
    });

    setBusy(false);
    if (!res.ok || !res.data) {
      setError(res.error || "The assistant is unavailable right now.");
      setMessages((m) => m.filter((x) => x.id !== tempId));
      setInput(text);
      return;
    }

    setMessages((m) => [
      ...m,
      {
        id: res.data!.assistantMessage.id,
        role: "ASSISTANT",
        content: res.data!.assistantMessage.content,
        thinking: res.data!.assistantMessage.thinking,
        toolCalls: res.data!.assistantMessage.toolCalls,
      },
    ]);
    setMode(res.data.mode);
    setAttachments([]);
    setWebSearch(false);
    setImageGen(false);
    if (!threadId) router.replace(`/dashboard?thread=${res.data.threadId}`);
    router.refresh();
  }

  const hasChat = messages.length > 0 || loadingThread || busy;

  const PromptBox = (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/85 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
      <input ref={fileRef} type="file" multiple hidden onChange={(e) => onPickFiles(e.target.files)} />

      {(attachments.length > 0 || projectId || designSystemId || skillIds.length || webSearch || imageGen) && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {attachments.map((a) => (
            <Chip key={a.id} label={a.name} onRemove={() => setAttachments((x) => x.filter((y) => y.id !== a.id))} icon={<Paperclip className="h-3 w-3" />} />
          ))}
          {projectId && (
            <Chip label={projects.find((p) => p.id === projectId)?.name || "Project"} onRemove={() => setProjectId(null)} icon={<FolderInput className="h-3 w-3" />} tone="brand" />
          )}
          {designSystemId && (
            <Chip label={designSystems.find((d) => d.id === designSystemId)?.name || "Design"} onRemove={() => setDesignSystemId(null)} icon={<Palette className="h-3 w-3" />} tone="brand" />
          )}
          {skillIds.map((id) => (
            <Chip key={id} label={skills.find((s) => s.id === id)?.name || "Skill"} onRemove={() => setSkillIds((x) => x.filter((y) => y !== id))} icon={<Wand2 className="h-3 w-3" />} tone="brand" />
          ))}
          {webSearch && <Chip label="Web search" onRemove={() => setWebSearch(false)} icon={<Globe className="h-3 w-3" />} tone="brand" />}
          {imageGen && <Chip label="Image gen" onRemove={() => setImageGen(false)} icon={<ImageIcon className="h-3 w-3" />} tone="brand" />}
        </div>
      )}

      <textarea
        ref={taRef}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          autoGrow();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        rows={1}
        placeholder="Describe your project or ask anything — e.g. “Draft a contract for a 6-week website rebuild with a client in Germany.”"
        className="max-h-[200px] w-full resize-none overflow-y-auto scrollbar-none bg-transparent px-1 py-1.5 text-[15px] text-zinc-100 outline-none placeholder:text-zinc-500"
      />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <ModeMenu value={mode} onChange={setMode} />
          <ModelMenu models={models} value={model} onChange={setModel} />
          <PlusMenu
            projects={projects}
            skills={skills}
            designSystems={designSystems}
            plugins={plugins}
            onUpload={() => fileRef.current?.click()}
            onPickProject={setProjectId}
            onPickDesign={setDesignSystemId}
            onToggleSkill={(id) => setSkillIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))}
            webSearch={webSearch}
            setWebSearch={setWebSearch}
            imageGen={imageGen}
            setImageGen={setImageGen}
          />
        </div>
        <button
          onClick={send}
          disabled={busy || !input.trim()}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-xs font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Send
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!hasChat ? (
        // Home hero + centered prominent box
        <div className="relative flex flex-1 flex-col items-center justify-center px-5 py-10">
          <div className="pointer-events-none absolute inset-0 bg-dotted-sm text-zinc-700/40 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
          <div className="relative w-full max-w-3xl">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                What are you building today?
              </h1>
              <p className="mt-3 text-zinc-400">
                Ask, plan, or let an AI expert team draft a client-ready contract.
              </p>
            </div>
            {error && <ErrorBar msg={error} />}
            {PromptBox}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.t}
                  onClick={() => {
                    setInput(s.d);
                    requestAnimationFrame(autoGrow);
                    taRef.current?.focus();
                  }}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-left transition hover:border-brand-500/50 hover:bg-zinc-900"
                >
                  <p className="text-sm font-medium text-zinc-100">{s.t}</p>
                  <p className="mt-1 text-xs text-zinc-500">{s.h}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto scrollbar-slim px-5 py-6 pb-44 sm:px-8">
            <div className="mx-auto max-w-3xl space-y-6">
              {loadingThread ? (
                <p className="text-center text-sm text-zinc-500">Loading conversation…</p>
              ) : (
                messages.map((m) => <MessageRow key={m.id} msg={m} />)
              )}
              {busy && <TypingRow />}
              <div ref={bottomRef} />
            </div>
          </div>
          {/* Floating chat input pinned over the bottom of the rounded main panel */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-4 sm:px-8">
            <div className="pointer-events-auto mx-auto w-full max-w-3xl">
              {error && <ErrorBar msg={error} />}
              {PromptBox}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SUGGESTIONS = [
  { t: "Draft a contract", h: "Ready-to-send agreement", d: "Draft a complete freelance contract for a 6-week website rebuild, fixed price in two milestones." },
  { t: "Plan a project", h: "Scope, milestones, pricing", d: "Plan a mobile app MVP: scope, deliverables, milestones, timeline and payment schedule." },
  { t: "Ask a question", h: "Clauses, payments, IP", d: "What payment terms protect a freelancer on a large fixed-price project?" },
];

function Chip({ label, onRemove, icon, tone = "zinc" }: { label: string; onRemove: () => void; icon: React.ReactNode; tone?: "zinc" | "brand" }) {
  return (
    <span
      className={`inline-flex max-w-[220px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
        tone === "brand"
          ? "border-brand-500/40 bg-brand-500/10 text-brand-300"
          : "border-zinc-700 bg-zinc-800/60 text-zinc-300"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
      <button onClick={onRemove} className="opacity-60 hover:opacity-100">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function ErrorBar({ msg }: { msg: string }) {
  return (
    <div className="mb-3 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-2.5 text-sm text-brand-300">
      {msg}
    </div>
  );
}

function TypingRow() {
  return (
    <div className="flex gap-3">
      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400">
        <Loader2 className="h-4 w-4 animate-spin" />
      </span>
      <div className="flex items-center gap-1.5 rounded-3xl rounded-bl-lg bg-zinc-800/60 px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" />
        <span className="ml-2 text-xs text-zinc-500">thinking…</span>
      </div>
    </div>
  );
}

function PlusMenu(props: {
  projects: Project[];
  skills: Skill[];
  designSystems: DesignSystem[];
  plugins: Plugin[];
  onUpload: () => void;
  onPickProject: (id: string) => void;
  onPickDesign: (id: string) => void;
  onToggleSkill: (id: string) => void;
  webSearch: boolean;
  setWebSearch: (v: boolean) => void;
  imageGen: boolean;
  setImageGen: (v: boolean) => void;
}) {
  return (
    <Dropdown
      trigger={({ toggle }) => (
        <button onClick={toggle} className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800/60 text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800">
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    >
      {() => (
        <div className="max-h-[min(46vh,320px)] space-y-1 overflow-y-auto scrollbar-slim pr-1">
          <Item icon={<Paperclip className="h-4 w-4" />} title="Upload or add files" sub="Attach documents & images to the chat" onClick={props.onUpload} />

          <Section title="Add to project">
            {props.projects.length ? (
              props.projects.slice(0, 8).map((p) => (
                <Sub key={p.id} onClick={() => props.onPickProject(p.id)}>
                  <FolderInput className="h-3.5 w-3.5 text-brand-400" /> {p.name}
                </Sub>
              ))
            ) : (
              <p className="px-3 py-1.5 text-xs text-zinc-600">No projects yet — create one in Projects.</p>
            )}
          </Section>

          <Section title="Skills">
            {props.skills.length ? (
              props.skills.map((s) => (
                <Sub key={s.id} onClick={() => props.onToggleSkill(s.id)} active={undefined}>
                  <Wand2 className="h-3.5 w-3.5 text-brand-400" /> {s.name}
                  <span className="ml-auto text-[10px] text-zinc-500">{s.installed ? "auto" : "pick"}</span>
                </Sub>
              ))
            ) : (
              <p className="px-3 py-1.5 text-xs text-zinc-600">No skills available.</p>
            )}
          </Section>

          <Section title="Design system">
            {props.designSystems.length ? (
              props.designSystems.map((d) => (
                <Sub key={d.id} onClick={() => props.onPickDesign(d.id)}>
                  <Palette className="h-3.5 w-3.5 text-brand-400" /> {d.name}
                </Sub>
              ))
            ) : (
              <p className="px-3 py-1.5 text-xs text-zinc-600">None yet — add one in Settings.</p>
            )}
          </Section>

          <Section title="Plugins">
            {props.plugins.length ? (
              props.plugins.map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs text-zinc-300">
                  <Plug className="h-3.5 w-3.5 text-brand-400" /> {p.name}
                  <span className="ml-auto text-[10px] text-zinc-500">available</span>
                </div>
              ))
            ) : (
              <p className="px-3 py-1.5 text-xs text-zinc-600">No plugins enabled.</p>
            )}
          </Section>

          <Item
            icon={<Globe className="h-4 w-4" />}
            title="Web search"
            sub="Pull live results into the answer"
            active={props.webSearch}
            onClick={() => props.setWebSearch(!props.webSearch)}
          />
          <Item
            icon={<ImageIcon className="h-4 w-4" />}
            title="Image generation"
            sub="Generate an image for your request"
            active={props.imageGen}
            onClick={() => props.setImageGen(!props.imageGen)}
          />
        </div>
      )}
    </Dropdown>
  );
}

function Item({ icon, title, sub, onClick, active }: { icon: React.ReactNode; title: string; sub?: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left transition hover:bg-zinc-800 ${active ? "bg-brand-500/10" : ""}`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? "bg-brand-600/20 text-brand-300" : "bg-zinc-800 text-zinc-300"}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-zinc-100">{title}</span>
        {sub && <span className="block text-[11px] leading-snug text-zinc-500">{sub}</span>}
      </span>
      {active && <span className="h-2 w-2 rounded-full bg-brand-400" />}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Sub({ children, onClick }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1 text-left text-xs text-zinc-300 transition hover:bg-zinc-800">
      {children}
    </button>
  );
}
