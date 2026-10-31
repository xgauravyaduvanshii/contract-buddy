"use client";

import { useEffect, useState } from "react";
import { Megaphone, X, Sparkles, Wrench, Info } from "lucide-react";
import { apiGet } from "@/lib/client";

type Notice = { id: string; title: string; body: string; kind: string; publishedAt: string };

const KIND_ICON: Record<string, typeof Info> = {
  WELCOME: Sparkles,
  UPDATE: Megaphone,
  MAINTENANCE: Wrench,
  INFO: Info,
};

const DISMISSED_KEY = "cb_dismissed_notices";

export function NoticePanel() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    apiGet<{ notices: Notice[] }>("/api/notices").then((r) => {
      if (!r.ok || !r.data) return;
      const dismissed = new Set(
        JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]") as string[],
      );
      const pending = r.data.notices.filter((n) => !dismissed.has(n.id));
      setNotices(pending);
    });
  }, []);

  if (!notices.length) return null;
  const notice = notices[index];
  if (!notice) return null;

  const Icon = KIND_ICON[notice.kind] || Info;

  function dismiss(id: string) {
    const dismissed: string[] = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
    if (!dismissed.includes(id)) dismissed.push(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    const nextList = notices.filter((n) => n.id !== id);
    setNotices(nextList);
    if (index >= nextList.length) setIndex(Math.max(0, nextList.length - 1));
    if (nextList.length === 0) setIndex(0);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-dotted-sm text-brand-500/10" />
        <div className="relative p-7">
          <button
            onClick={() => dismiss(notice.id)}
            className="absolute right-4 top-4 text-zinc-500 transition hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600/15 text-brand-400">
            <Icon className="h-6 w-6" />
          </span>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-brand-400">
            {notice.kind}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">{notice.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300 whitespace-pre-line">{notice.body}</p>

          <div className="mt-6 flex items-center justify-between">
            {notices.length > 1 ? (
              <span className="text-xs text-zinc-500">
                {index + 1} of {notices.length}
              </span>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              {notices.length > 1 && (
                <button
                  onClick={() => dismiss(notice.id)}
                  className="rounded-full px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
                >
                  Next
                </button>
              )}
              <button
                onClick={() => dismiss(notice.id)}
                className="rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
