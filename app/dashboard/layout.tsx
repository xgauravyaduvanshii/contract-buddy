import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata = { title: "Dashboard", robots: { index: false } };
// Reads the session cookie (uncached) — allow a blocking route instead of prerendering
export const instant = false;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/signin?next=/dashboard");

  return (
    <DashboardShell
      user={{ id: user.id, email: user.email, name: user.name, role: user.role, image: user.image }}
    >
      {children}
    </DashboardShell>
  );
}
