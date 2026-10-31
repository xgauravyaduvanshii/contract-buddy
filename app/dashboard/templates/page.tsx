import { TemplatesView } from "@/components/dashboard/builder/TemplatesView";

// Reads search params (uncached) — allow a blocking route instead of prerendering
export const instant = false;

export const metadata = { title: "Templates", robots: { index: false } };

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  return <TemplatesView kind={kind === "contract" ? "CONTRACT" : "PROPOSAL"} />;
}
