import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your ContractBuddy password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send a 6-digit code to reset your password."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/signin" className="font-semibold text-brand-600 hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
      <p className="mt-5 rounded-2xl bg-brand-50 px-4 py-3 text-xs text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
        For your security, reset codes expire after 30 minutes and can be used
        only once.
      </p>
    </AuthShell>
  );
}
