import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { OrDivider, SocialButtons } from "@/components/SocialAuth";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your free ContractBuddy account and send your first contract.",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start building and signing client contracts for free."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-brand-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
      <p className="mt-4 text-xs text-zinc-500">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="font-medium text-brand-600 hover:underline">
          Terms &amp; Conditions
        </Link>{" "}
        and Privacy Policy.
      </p>

      <OrDivider />
      <SocialButtons />
    </AuthShell>
  );
}
