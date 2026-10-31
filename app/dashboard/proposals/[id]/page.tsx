import { ProposalEditor } from "@/components/dashboard/builder/ProposalEditor";

// Reads dynamic params (uncached) — allow a blocking route instead of prerendering
export const instant = false;

export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProposalEditor id={id} />;
}
