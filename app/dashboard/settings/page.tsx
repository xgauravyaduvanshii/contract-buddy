import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { SettingsView } from "@/components/dashboard/SettingsView";

// Reads the session cookie (uncached) — allow a blocking route instead of prerendering
export const instant = false;

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?next=/dashboard/settings");
  return <SettingsView user={{ id: user.id, email: user.email, name: user.name, role: user.role }} />;
}
