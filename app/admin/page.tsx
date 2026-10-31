import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AdminApp } from "@/components/admin/AdminApp";

export const metadata = { title: "Admin", robots: { index: false } };

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?next=/admin");
  if (user.role !== "ADMIN") redirect("/dashboard");
  return <AdminApp />;
}
