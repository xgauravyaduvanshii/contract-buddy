export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  gradient: string;
  content: string[];
};

export const posts: Post[] = [
  {
    slug: "stop-working-client-agreement-emails",
    title: "Stop running client agreements out of email threads",
    excerpt:
      "Chasing a signature through back-and-forth emails costs you time and leaves deals legally fuzzy. Here's a better way to close.",
    category: "Workflow",
    author: "Maya Chen",
    date: "Oct 24, 2026",
    readTime: "6 min read",
    gradient: "from-brand-500 to-brand-800",
    content: [
      "Most project disputes don't start with a bad client — they start with an unclear agreement buried in a reply-all chain. When scope, payment terms and deadlines live across a dozen messages, nobody truly agrees to anything.",
      "A single, structured contract replaces that noise. Both sides see the same deliverables, the same total and the same timeline, and the moment it's signed, it's locked with a timestamped audit trail.",
      "The practical win is speed: instead of waiting days for a client to find, open and respond to a document, you send one secure link that they can sign in seconds from their phone.",
    ],
  },
  {
    slug: "pricing-clauses-freelance-devs",
    title: "The 5 pricing clauses every freelance developer needs",
    excerpt:
      "Fixed price, hourly, or retainer? Protect your margin and your time with these essential payment clauses.",
    category: "Contracts",
    author: "Rohan Patel",
    date: "Oct 18, 2026",
    readTime: "8 min read",
    gradient: "from-rose-500 to-red-800",
    content: [
      "Payment terms are where friendly projects quietly turn sour. Writing them down — clearly and in advance — removes the awkward conversations later.",
      "Start with a defined total and a deposit before work begins. Add a change-request clause so scope creep gets priced, not absorbed. Include a late-payment term and a kill fee for cancelled projects.",
      "Finally, tie IP ownership to full payment. Until the invoice is settled, the work remains yours. It's the single clause that saves the most headaches.",
    ],
  },
  {
    slug: "are-e-signatures-legally-binding",
    title: "Are e-signatures actually legally binding?",
    excerpt:
      "Short answer: yes, in most of the world. Here's what makes a digital signature hold up if a deal is ever challenged.",
    category: "Legal",
    author: "Kwame Mensah",
    date: "Oct 11, 2026",
    readTime: "5 min read",
    gradient: "from-brand-600 to-red-900",
    content: [
      "Electronic signatures carry legal weight across the US (ESIGN), the EU (eIDAS) and many other jurisdictions. What matters isn't the ink — it's proving intent to sign and the integrity of the document.",
      "That's why an audit trail is critical: who signed, when, from what address, and confirmation the file wasn't altered afterward. Keep these records alongside every agreement.",
      "For most client contracts, a well-implemented e-signature is as enforceable as a wet signature — and far easier to produce on time.",
    ],
  },
  {
    slug: "turn-project-scope-into-contract",
    title: "Turn a project scope doc into a signed contract in 10 minutes",
    excerpt:
      "A repeatable process to convert the thing you already wrote into an agreement your client can sign today.",
    category: "Workflow",
    author: "Lena Fischer",
    date: "Oct 3, 2026",
    readTime: "7 min read",
    gradient: "from-red-500 to-brand-900",
    content: [
      "You already did the hard part — you scoped the project. Now reuse it. Paste your deliverables and milestones into a template and let guided fields handle the legal scaffolding.",
      "Add the commercial terms (price, timeline, payment schedule) and review once. Then generate the signing link and send it while the conversation is still warm.",
      "Speed compounds: the shorter the gap between 'we have a deal' and 'it's signed', the fewer projects slip away.",
    ],
  },
  {
    slug: "client-onboarding-signature-first",
    title: "Why we ask clients to sign before the kickoff call",
    excerpt:
      "Doing it in this order changes the entire tone of a project. Here's the reasoning and how to do it gracefully.",
    category: "Business",
    author: "Maya Chen",
    date: "Sep 27, 2026",
    readTime: "4 min read",
    gradient: "from-rose-600 to-brand-900",
    content: [
      "Signing first isn't about distrust — it's about starting on the same page, literally. It frames the kickoff as a working session, not a negotiation.",
      "Present it warmly: 'so we both know exactly what we're building, here's a quick agreement to sign.' Most clients appreciate the clarity.",
      "The result is fewer surprises, faster starts and a project where the relationship is protected by clear terms.",
    ],
  },
];

export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug);
}
