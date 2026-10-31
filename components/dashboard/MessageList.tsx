"use client";

import { useState } from "react";
import {
  Brain, ChevronRight, Sparkles, Wrench, RotateCcw, Pencil, Languages, SmilePlus, MessageCircle, Check, Loader2,
} from "lucide-react";
import { apiSend } from "@/lib/client";

export type ToolCall = { tool: string; detail: string };
export type Reaction = { by: "USER" | "AI"; emoji: string };
export type MsgComment = { by: "USER" | "AI"; text: string; at: string };
export type ChatMsg = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  thinking?: string | null;
  toolCalls?: ToolCall[] | null;
  reactions?: Reaction[] | null;
  comments?: MsgComment[] | null;
  suggestions?: string[] | null;
};

const EMOJIS = ["👍", "❤️", "😂", "🎯", "🔥"];
const LANGS = ["Hindi", "English", "Spanish", "French", "German", "Arabic", "Chinese"];

// Very small markdown renderer: headings, bold, lists, code blocks, links.
function renderInline(text: string, keyBase: string) {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|`(.+?)`|\[(.+?)\]\((.+?)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] != null) parts.push(<strong key={`${keyBase}-b${i}`}>{m[1]}</strong>);
    else if (m[2] != null)
      parts.push(
        <code key={`${keyBase}-c${i}`} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[0.85em] text-brand-300">
          {m[2]}
        </code>,
      );
    else if (m[3] != null)
      parts.push(
        <a key={`${keyBase}-l${i}`} href={m[4]} target="_blank" rel="noreferrer" className="text-brand-400 underline">
          {m[3]}
        </a>,
      );
    last = regex.lastIndex;
    i++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Markdown({ content }: { content: string }) {
  // Line-based parse
  const lines = content.split("\n");
  const out: React.ReactNode[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let listBuf: React.ReactNode[] = [];

  const flushList = () => {
    if (listBuf.length) {
      out.push(
        <ul key={`ul-${out.length}`} className="my-2 list-disc space-y-1 pl-5">
          {listBuf}
        </ul>,
      );
      listBuf = [];
    }
  };

  lines.forEach((raw, idx) => {
    const line = raw.replace(/\s+$/, "");
    if (line.startsWith("```")) {
      if (inCode) {
        out.push(
          <pre key={`code-${idx}`} className="my-3 overflow-x-auto rounded-xl bg-zinc-950 p-4 text-sm text-zinc-200">
            <code>{codeBuf.join("\n")}</code>
          </pre>,
        );
        codeBuf = [];
        inCode = false;
      } else {
        flushList();
        inCode = true;
      }
      return;
    }
    if (inCode) {
      codeBuf.push(raw);
      return;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      flushList();
      const level = h[1].length;
      const sizes = ["text-xl", "text-lg", "text-base", "text-sm"];
      out.push(
        <p key={`h-${idx}`} className={`mt-3 mb-1 font-semibold text-white ${sizes[level - 1]}`}>
          {renderInline(h[2], `h${idx}`)}
        </p>,
      );
      return;
    }
    const li = /^\s*[-*]\s+(.*)$/.exec(line);
    if (li) {
      listBuf.push(<li key={`li-${idx}`}>{renderInline(li[1], `li${idx}`)}</li>);
      return;
    }
    flushList();
    if (line.trim() === "") {
      out.push(<span key={`sp-${idx}`} className="block h-2" />);
      return;
    }
    out.push(<p key={`p-${idx}`} className="my-1 leading-relaxed">{renderInline(line, `p${idx}`)}</p>);
  });
  flushList();
  if (inCode && codeBuf.length) {
    out.push(
      <pre key="code-end" className="my-3 overflow-x-auto rounded-xl bg-zinc-950 p-4 text-sm text-zinc-200">
        <code>{codeBuf.join("\n")}</code>
      </pre>,
    );
  }
  return <div className="text-[15px] text-zinc-200">{out}</div>;
}

function ThinkingBlock({ thinking }: { thinking: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200"
      >
        <Brain className="h-3.5 w-3.5 text-brand-400" />
        Reasoning / chain of thought
        <ChevronRight className={`h-3.5 w-3.5 transition ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-zinc-800 px-3 py-2 text-xs leading-relaxed text-zinc-400">
          <Markdown content={thinking} />
        </div>
      )}
    </div>
  );
}

function Pop({
  open,
  onClose,
  children,
  align = "left",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  if (!open) return null;
  return (
    <>
      <button className="fixed inset-0 z-30 cursor-default" onClick={onClose} aria-hidden />
      <div
        className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full z-40 mt-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl`}
      >
        {children}
      </div>
    </>
  );
}

function ActionsBar({
  msg,
  threadId,
  onRetry,
  onEdit,
  retrying,
}: {
  msg: ChatMsg;
  threadId: string | null;
  onRetry?: (id: string) => void;
  onEdit?: (msg: ChatMsg, content: string) => void;
  retrying?: boolean;
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(msg.content);
  const [comment, setComment] = useState("");
  const [translation, setTranslation] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reactions, setReactions] = useState<Reaction[]>(Array.isArray(msg.reactions) ? msg.reactions : []);
  const [comments, setComments] = useState<MsgComment[]>(Array.isArray(msg.comments) ? msg.comments : []);

  async function react(emoji: string) {
    setEmojiOpen(false);
    setBusy(true);
    const r = await apiSend<{ reactions: Reaction[] }>(`/api/messages/${msg.id}/react`, "POST", { emoji });
    if (r.ok && r.data && Array.isArray(r.data.reactions)) setReactions(r.data.reactions);
    setBusy(false);
  }

  async function sendComment() {
    const text = comment.trim();
    if (!text) return;
    setBusy(true);
    const r = await apiSend<{ comments: MsgComment[] }>(`/api/messages/${msg.id}/comment`, "POST", { text });
    if (r.ok && r.data && Array.isArray(r.data.comments)) setComments(r.data.comments);
    setComment("");
    setCommentOpen(false);
    setBusy(false);
  }

  async function translate(lang: string) {
    setLangOpen(false);
    setTranslating(true);
    const r = await apiSend<{ translation: string }>(`/api/messages/${msg.id}/translate`, "POST", { lang });
    setTranslating(false);
    if (r.ok && r.data) setTranslation(r.data.translation);
  }

  const counts = reactions.reduce<Record<string, { n: number; mine: boolean }>>((acc, x) => {
    acc[x.emoji] = { n: (acc[x.emoji]?.n || 0) + 1, mine: (acc[x.emoji]?.mine || false) || x.by === "USER" };
    return acc;
  }, {});

  if (editing) {
    return (
      <div className="mt-1.5 w-full max-w-full">
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-xl border border-brand-500/40 bg-zinc-950 p-2.5 text-sm text-zinc-100 outline-none scrollbar-none"
        />
        <div className="mt-1 flex justify-end gap-1.5">
          <button onClick={() => setEditing(false)} className="rounded-full px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-800">
            Cancel
          </button>
          <button
            onClick={() => {
              const c = draft.trim();
              setEditing(false);
              if (c && c !== msg.content) onEdit?.(msg, c);
            }}
            disabled={!draft.trim() || busy}
            className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Check className="h-3 w-3" /> Save &amp; send
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-1.5">
      {reactions.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {Object.entries(counts).map(([emoji, c]) => (
            <button
              key={emoji}
              onClick={() => react(emoji)}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${
                c.mine ? "border-brand-500/50 bg-brand-500/10" : "border-zinc-700 bg-zinc-800/60 hover:border-zinc-600"
              }`}
              title={reactions.filter((x) => x.emoji === emoji).map((x) => (x.by === "USER" ? "You" : "AI")).join(", ")}
            >
              {emoji} <span className="text-zinc-400">{c.n}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-0.5 text-zinc-500">
        {onRetry && threadId && (
          <button onClick={() => onRetry(msg.id)} disabled={retrying} title="Retry — generate again" className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] transition hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-60">
            {retrying ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />} Retry
          </button>
        )}
        <button
          onClick={() => {
            setDraft(msg.content);
            setEditing(true);
          }}
          title="Edit this message"
          className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] transition hover:bg-zinc-800 hover:text-zinc-200"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
        <div className="relative">
          <button onClick={() => setLangOpen((o) => !o)} title="Translate" className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] transition hover:bg-zinc-800 hover:text-zinc-200">
            <Languages className="h-3 w-3" /> Translate
          </button>
          <Pop open={langOpen} onClose={() => setLangOpen(false)}>
            {LANGS.map((l) => (
              <button key={l} onClick={() => translate(l)} className="block w-32 rounded-lg px-2.5 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800">
                {l}
              </button>
            ))}
          </Pop>
        </div>
        <div className="relative">
          <button onClick={() => setEmojiOpen((o) => !o)} title="React" className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] transition hover:bg-zinc-800 hover:text-zinc-200">
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <SmilePlus className="h-3 w-3" />} React
          </button>
          <Pop open={emojiOpen} onClose={() => setEmojiOpen(false)}>
            <div className="flex gap-1">
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => react(e)} className="flex h-8 w-8 items-center justify-center rounded-lg text-base hover:bg-zinc-800">
                  {e}
                </button>
              ))}
            </div>
          </Pop>
        </div>
        <div className="relative">
          <button onClick={() => setCommentOpen((o) => !o)} title="Comment on this message" className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] transition hover:bg-zinc-800 hover:text-zinc-200">
            <MessageCircle className="h-3 w-3" /> Comment{comments.length ? ` (${comments.length})` : ""}
          </button>
          <Pop open={commentOpen} onClose={() => setCommentOpen(false)} align="right">
            <div className="flex w-56 items-center gap-1.5">
              <input
                autoFocus
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendComment()}
                placeholder="Add a comment…"
                className="h-7 min-w-0 flex-1 rounded-lg bg-zinc-950 px-2 text-xs text-zinc-100 outline-none placeholder:text-zinc-600"
              />
              <button onClick={sendComment} className="rounded-md bg-brand-600 px-2 py-1 text-xs text-white hover:bg-brand-700">
                Post
              </button>
            </div>
          </Pop>
        </div>
        {translating && (
          <span className="ml-1 inline-flex items-center gap-1 text-[11px] text-zinc-500">
            <Loader2 className="h-3 w-3 animate-spin" /> translating…
          </span>
        )}
      </div>

      {translation && (
        <div className="mt-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Translation</p>
            <button onClick={() => setTranslation(null)} className="text-[10px] text-zinc-500 hover:text-zinc-300">
              hide
            </button>
          </div>
          <Markdown content={translation} />
        </div>
      )}

      {comments.length > 0 && (
        <div className="mt-1.5 space-y-1 border-l-2 border-zinc-800 pl-2.5">
          {comments.map((c, i) => (
            <p key={i} className="text-xs text-zinc-400">
              <span className={c.by === "AI" ? "font-medium text-brand-400" : "font-medium text-zinc-300"}>
                {c.by === "AI" ? "✳️ AI" : "You"}
              </span>{" "}
              {c.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function MessageRow({
  msg,
  threadId,
  onRetry,
  onEdit,
  retrying,
}: {
  msg: ChatMsg;
  threadId: string | null;
  onRetry?: (id: string) => void;
  onEdit?: (msg: ChatMsg, content: string) => void;
  retrying?: boolean;
}) {
  if (msg.role === "USER") {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-brand-600 px-4 py-2.5 text-[15px] text-white shadow-lg shadow-brand-600/20">
          <p className="whitespace-pre-line">{msg.content}</p>
        </div>
        <ActionsBar msg={msg} threadId={threadId} onRetry={onRetry} onEdit={onEdit} retrying={retrying} />
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400">
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        {msg.thinking && <ThinkingBlock thinking={msg.thinking} />}
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {msg.toolCalls.map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-[11px] text-zinc-300"
                title={t.detail}
              >
                <Wrench className="h-3 w-3 text-brand-400" />
                {t.tool.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}
        <Markdown content={msg.content} />
        <ActionsBar msg={msg} threadId={threadId} onRetry={onRetry} onEdit={onEdit} retrying={retrying} />
      </div>
    </div>
  );
}
