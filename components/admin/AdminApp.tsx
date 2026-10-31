"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, Megaphone, Mail, Wand2, Plug, SlidersHorizontal, FileSignature, LogOut, ArrowLeft } from "lucide-react";
import { StatusSection } from "./StatusSection";
import { UsersSection } from "./UsersSection";
import { NoticesSection } from "./NoticesSection";
import { TemplatesSection } from "./TemplatesSection";
import { SkillsSection, PluginsSection } from "./CatalogSection";
import { SettingsSection } from "./SettingsSection";

type TabId = "status" | "users" | "notices" | "templates" | "skills" | "plugins" | "settings";

const TABS: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: "status", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "notices", label: "Notices", icon: Megaphone },
  { id: "templates", label: "Email templates", icon: Mail },
  { id: "skills", label: "Skills", icon: Wand2 },
  { id: "plugins", label: "Plugins", icon: Plug },
  { id: "settings", label: "Settings", icon: SlidersHorizontal },
];

const TITLES: Record<TabId, string> = {
  status: "System overview",
  users: "User management",
  notices: "Notice panel",
  templates: "Email templates",
  skills: "Skills",
  plugins: "Plugins",
  settings: "AI provider settings",
};

export function AdminApp() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("status");

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST", credentials: "same-origin" });
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto flex max-w-[1500px] gap-4">
        <aside className="hidden w-60 shrink-0 md:block">
          <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 backdrop-blur">
            <div className="mb-1 flex items-center gap-2 px-1 font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
                <FileSignature className="h-5 w-5" />
              </span>
              Admin
            </div>
            <p className="mb-4 px-1 text-xs text-zinc-500">ContractBuddy control panel</p>

            <nav className="space-y-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                    tab === t.id ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                  }`}
                >
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </nav>

            <div className="mt-auto space-y-1 border-t border-zinc-800 pt-3">
              <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800/60 hover:text-zinc-200">
                <ArrowLeft className="h-4 w-4" /> Back to app
              </Link>
              <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800/60 hover:text-brand-300">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40">
            <div className="mobile-nav flex gap-1 overflow-x-auto border-b border-zinc-800 p-3 md:hidden">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${tab === t.id ? "bg-brand-600 text-white" : "bg-zinc-800 text-zinc-300"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <h1 className="mb-6 text-2xl font-semibold text-white">{TITLES[tab]}</h1>
              {tab === "status" && <StatusSection />}
              {tab === "users" && <UsersSection />}
              {tab === "notices" && <NoticesSection />}
              {tab === "templates" && <TemplatesSection />}
              {tab === "skills" && <SkillsSection />}
              {tab === "plugins" && <PluginsSection />}
              {tab === "settings" && <SettingsSection />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
