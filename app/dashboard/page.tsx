import { Suspense } from "react";
import { Chat } from "@/components/dashboard/Chat";

export default function DashboardHome() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">Loading…</div>
      }
    >
      <Chat />
    </Suspense>
  );
}
