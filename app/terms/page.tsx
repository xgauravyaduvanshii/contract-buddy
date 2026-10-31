import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms that govern your use of ContractBuddy.",
};

const sections = [
  {
    id: "acceptance",
    heading: "1. Acceptance of terms",
    body: [
      "By creating an account, accessing, or using ContractBuddy (“the Service”), you agree to be bound by these Terms & Conditions. If you are using the Service on behalf of a company or agency, you represent that you have authority to bind that entity.",
      "If you do not agree with any part of these terms, you must not use the Service.",
    ],
  },
  {
    id: "accounts",
    heading: "2. Your account",
    body: [
      "You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately of any unauthorised use.",
      "You must provide accurate information and keep your account details up to date.",
    ],
  },
  {
    id: "contracts",
    heading: "3. Contracts and e-signatures",
    body: [
      "ContractBuddy provides tools to draft, send and electronically sign agreements. We are a technology provider and not a party to the contracts you create. The content, legality and enforceability of the agreements you generate are your responsibility.",
      "Templates are provided for convenience and do not constitute legal advice. Consult a qualified professional for your specific situation.",
    ],
  },
  {
    id: "acceptable-use",
    heading: "4. Acceptable use",
    body: [
      "You agree not to misuse the Service — including attempting to access it using a method other than the interface and instructions we provide, interfering with its operation, or using it to transmit unlawful, fraudulent or harmful content.",
    ],
  },
  {
    id: "subscriptions",
    heading: "5. Plans, billing & cancellation",
    body: [
      "Paid plans renew automatically unless cancelled before the renewal date. Fees are non-refundable except where required by law or as stated in our refund policy. You may cancel at any time; access continues until the end of the current billing period.",
    ],
  },
  {
    id: "data",
    heading: "6. Data & privacy",
    body: [
      "We process personal data in accordance with our Privacy Policy. You retain ownership of the documents you create and grant us the limited licence needed to store, transmit and display them as part of providing the Service.",
    ],
  },
  {
    id: "property",
    heading: "7. Intellectual property",
    body: [
      "All software, design, logos and original content in the Service remain the property of ContractBuddy and are protected by applicable intellectual-property laws.",
    ],
  },
  {
    id: "liability",
    heading: "8. Limitation of liability",
    body: [
      "The Service is provided “as is” without warranties of any kind. To the maximum extent permitted by law, ContractBuddy shall not be liable for indirect, incidental or consequential damages arising from your use of, or inability to use, the Service.",
    ],
  },
  {
    id: "changes",
    heading: "9. Changes to these terms",
    body: [
      "We may update these terms from time to time. Material changes will be communicated through the Service or by email. Continued use after changes take effect constitutes acceptance of the revised terms.",
    ],
  },
  {
    id: "contact",
    heading: "10. Contact",
    body: [
      "Questions about these Terms? Reach us at legal@contractbuddy.com or through our contact page.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div>
      <PageHero
        eyebrow="Legal"
        title="Terms & Conditions"
        subtitle="Please read these terms carefully — they set out the agreement between you and ContractBuddy."
      >
        <p className="text-sm text-zinc-500">Last updated: October 30, 2026</p>
      </PageHero>

      <Container className="pb-24">
        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <nav className="sticky top-28 space-y-1 rounded-3xl border border-zinc-200/70 bg-white/70 p-5 text-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/50">
              <p className="mb-2 font-semibold">On this page</p>
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block rounded-lg px-2 py-1 text-zinc-600 transition hover:bg-zinc-100 hover:text-brand-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  {s.heading}
                </a>
              ))}
            </nav>
          </aside>

          <article className="max-w-3xl space-y-10">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <h2 className="text-xl font-semibold tracking-tight">
                  {s.heading}
                </h2>
                <div className="mt-3 space-y-3 text-zinc-600 dark:text-zinc-300">
                  {s.body.map((p, i) => (
                    <p key={i} className="leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </article>
        </div>
      </Container>
    </div>
  );
}
