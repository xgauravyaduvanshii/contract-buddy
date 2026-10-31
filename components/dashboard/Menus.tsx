"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { MODES, type ModeId } from "@/lib/modes-client";

export function Dropdown({
  trigger,
  children,
  align = "left",
  panelClass = "",
}: {
  trigger: (o: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  panelClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={`absolute z-40 ${align === "right" ? "right-0" : "left-0"} bottom-full mb-1.5 w-60 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-1 shadow-2xl ${panelClass}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

const pillBtn =
  "inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800";

export function ModeMenu({ value, onChange }: { value: ModeId; onChange: (m: ModeId) => void }) {
  const current = MODES.find((m) => m.id === value)!;
  return (
    <Dropdown
      trigger={({ toggle }) => (
        <button onClick={toggle} className={pillBtn}>
          <span>{current.emoji}</span>
          <span className="font-medium">{current.label}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      )}
    >
      {(close) => (
        <div className="max-h-[min(46vh,320px)] space-y-0.5 overflow-y-auto scrollbar-slim">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                onChange(m.id);
                close();
              }}
              className="flex w-full items-start gap-2 rounded-xl px-2.5 py-1.5 text-left transition hover:bg-zinc-800"
            >
              <span className="text-sm leading-none">{m.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-100">
                  {m.label}
                  {value === m.id && <Check className="h-3 w-3 text-brand-400" />}
                </span>
                <span className="block text-[11px] leading-snug text-zinc-500">{m.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Dropdown>
  );
}

export type ModelOption = { id: string; name: string; provider: string };

export function ModelMenu({
  models,
  value,
  onChange,
}: {
  models: ModelOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const current = models.find((m) => m.id === value);
  return (
    <Dropdown
      panelClass="w-64"
      trigger={({ toggle }) => (
        <button onClick={toggle} className={pillBtn}>
          <span className="max-w-[130px] truncate font-medium">
            {current ? current.name.split("/").pop() : "Model"}
          </span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      )}
    >
      {(close) => (
        <ModelList
          models={models}
          value={value}
          onPick={(id) => {
            onChange(id);
            close();
          }}
        />
      )}
    </Dropdown>
  );
}

function ModelList({ models, value, onPick }: { models: ModelOption[]; value: string; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return models;
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(s) || m.id.toLowerCase().includes(s) || m.provider.toLowerCase().includes(s),
    );
  }, [models, q]);
  const byProvider = filtered.reduce<Record<string, ModelOption[]>>((acc, m) => {
    (acc[m.provider] ||= []).push(m);
    return acc;
  }, {});
  return (
    <div>
      <div className="flex items-center gap-2 border-b border-zinc-800 px-2.5 pb-1.5 pt-0.5">
        <Search className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
        <input
          ref={searchRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search models…"
          className="h-6 flex-1 bg-transparent text-xs text-zinc-100 outline-none placeholder:text-zinc-600"
        />
        <span className="shrink-0 text-[10px] text-zinc-600">{filtered.length}</span>
      </div>
      <div className="max-h-[min(42vh,300px)] space-y-1 overflow-y-auto scrollbar-slim p-0.5 pt-1.5">
        {Object.entries(byProvider).map(([provider, list]) => (
          <div key={provider}>
            <p className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {provider}
            </p>
            {(q.trim() ? list : list.slice(0, 12)).map((m) => (
              <button
                key={m.id}
                onClick={() => onPick(m.id)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1 text-left text-xs text-zinc-300 transition hover:bg-zinc-800"
              >
                <span className="truncate">{m.name.split("/").pop() || m.name}</span>
                {value === m.id && <Check className="h-3 w-3 shrink-0 text-brand-400" />}
              </button>
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-2.5 py-3 text-center text-xs text-zinc-500">
            {models.length === 0 ? "Loading models…" : `No models match “${q.trim()}”`}
          </p>
        )}
      </div>
    </div>
  );
}
