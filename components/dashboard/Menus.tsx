"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
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
          className={`absolute z-40 ${align === "right" ? "right-0" : "left-0"} bottom-full mb-2 w-72 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl ${panelClass}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

const pillBtn =
  "inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800";

export function ModeMenu({ value, onChange }: { value: ModeId; onChange: (m: ModeId) => void }) {
  const current = MODES.find((m) => m.id === value)!;
  return (
    <Dropdown
      trigger={({ toggle }) => (
        <button onClick={toggle} className={pillBtn}>
          <span>{current.emoji}</span>
          <span className="font-medium">{current.label}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      )}
    >
      {(close) => (
        <div className="space-y-0.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                onChange(m.id);
                close();
              }}
              className="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-zinc-800"
            >
              <span className="text-lg leading-none">{m.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium text-zinc-100">
                  {m.label}
                  {value === m.id && <Check className="h-3.5 w-3.5 text-brand-400" />}
                </span>
                <span className="block text-xs text-zinc-500">{m.desc}</span>
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
  const byProvider = models.reduce<Record<string, ModelOption[]>>((acc, m) => {
    (acc[m.provider] ||= []).push(m);
    return acc;
  }, {});
  return (
    <Dropdown
      panelClass="max-h-96 overflow-y-auto"
      trigger={({ toggle }) => (
        <button onClick={toggle} className={pillBtn}>
          <span className="max-w-[160px] truncate font-medium">
            {current ? current.name.split("/").pop() : "Model"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      )}
    >
      {(close) => (
        <div className="space-y-1">
          {Object.entries(byProvider).map(([provider, list]) => (
            <div key={provider}>
              <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                {provider}
              </p>
              {list.slice(0, 20).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onChange(m.id);
                    close();
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-sm text-zinc-300 transition hover:bg-zinc-800"
                >
                  <span className="truncate">{m.name.split("/").pop() || m.name}</span>
                  {value === m.id && <Check className="h-3.5 w-3.5 shrink-0 text-brand-400" />}
                </button>
              ))}
            </div>
          ))}
          {models.length === 0 && <p className="px-3 py-4 text-sm text-zinc-500">Loading models…</p>}
        </div>
      )}
    </Dropdown>
  );
}
