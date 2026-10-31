"use client";

import { useState } from "react";
import { Brain, ChevronRight, Sparkles, Wrench } from "lucide-react";

export type ToolCall = { tool: string; detail: string };
export type ChatMsg = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  thinking?: string | null;
  toolCalls?: ToolCall[] | null;
};

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

export function MessageRow({ msg }: { msg: ChatMsg }) {
  if (msg.role === "USER") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-brand-600 px-4 py-2.5 text-[15px] text-white shadow-lg shadow-brand-600/20">
          <p className="whitespace-pre-line">{msg.content}</p>
        </div>
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
      </div>
    </div>
  );
}
