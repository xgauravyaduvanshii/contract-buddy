import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { OrDivider, SocialButtons } from "@/components/SocialAuth";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your ContractBuddy workspace.",
};

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to keep sending and signing contracts."
      footer={
        <>
          New to ContractBuddy?{" "}
          <Link href="/signup" className="font-semibold text-brand-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />}>
        <SignInForm />
      </Suspense>

      <OrDivider />
      <SocialButtons />
    </AuthShell>
  );
}
