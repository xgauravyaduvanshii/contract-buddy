"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

// Marketing pages show the floating Header + Footer. The app surface
// (dashboard/admin) provides its own shell, so we skip the chrome there.
export function Chrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isApp = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (isApp) return <div className="min-h-full">{children}</div>;

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
