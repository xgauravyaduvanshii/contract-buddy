// Shared shapes for the Proposal / Contract builders (client + server safe).

export type ProposalSection = {
  id: string;
  title: string;
  kind: "text" | "list";
  content?: string;
  items?: string[];
};

export type ProposalOffer = {
  id: string;
  title: string;
  desc?: string;
  price: number;
  strike?: number;
  discountPct?: number;
};

export type ProposalFee = {
  structure: string; // Fixed Price | Milestone | Monthly Retainer
  baseFee: number;
  gstPct: number;
};

export type ProposalStyle = {
  font: "Sans" | "Serif" | "Mono";
  titleColor: string;
  background: string;
  accent: string;
};

export type ContractClause = { n: number; title: string; text: string };

export type ContractFees = {
  fee: number; // excl. GST
  gstPct: number;
  gst: number;
  grand: number;
  advance?: number;
  currency?: string;
};

export type ChatTurn = { role: "USER" | "ASSISTANT"; content: string };

export type DocTemplateKind = "PROPOSAL" | "CONTRACT";

export const DEFAULT_STYLE: ProposalStyle = {
  font: "Sans",
  titleColor: "#111111",
  background: "#F7F7F5",
  accent: "#F59E0B",
};

export const SECTION_TITLES = [
  "Project Overview",
  "Scope of Work",
  "Deliverables",
  "Timeline",
  "Pricing",
  "Terms & Conditions",
];

export function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
