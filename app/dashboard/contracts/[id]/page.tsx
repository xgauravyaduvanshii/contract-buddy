import { ContractEditor } from "@/components/dashboard/builder/ContractEditor";

// Reads dynamic params (uncached) — allow a blocking route instead of prerendering
export const instant = false;

export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContractEditor id={id} />;
}
