"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { NoticePanel } from "./NoticePanel";

type User = { id: string; email: string; name: string | null; role: string; image: string | null };

export function DashboardShell({ user, children }: { user: User; children: ReactNode }) {
  return (
    <div className="h-screen overflow-hidden bg-background p-4 text-foreground">
      <NoticePanel />
      <div className="mx-auto flex h-full max-w-[1500px] gap-4">
        <Sidebar user={user} />
        <main className="min-w-0 flex-1">
          <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
