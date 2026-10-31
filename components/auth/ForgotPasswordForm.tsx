"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiSend } from "@/lib/client";
import { Input, FormError, FormNote } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Step = "request" | "verify" | "reset" | "done";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setNote(null);
    setLoading(true);
    const res = await apiSend<{ sent: boolean; delivered: boolean; devCode?: string }>(
      "/api/auth/forgot-password",
      "POST",
      { email },
    );
    setLoading(false);
    if (!res.ok) {
      setErr(res.error || "Could not send reset code");
      return;
    }
    setStep("verify");
    setNote(
      res.data?.delivered
        ? "We emailed you a 6-digit reset code."
        : `SMTP not configured — your dev code is: ${res.data?.devCode ?? "?"}`,
    );
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await apiSend("/api/auth/verify-otp", "POST", { email, code });
    setLoading(false);
    if (!res.ok) {
      setErr(res.error || "Invalid or expired code");
      return;
    }
    setStep("reset");
    setNote(null);
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await apiSend("/api/auth/reset-password", "POST", { email, code, password });
    setLoading(false);
    if (!res.ok) {
      setErr(res.error || "Could not reset password");
      return;
    }
    setStep("done");
    setTimeout(() => router.push("/signin"), 1200);
  }

  if (step === "done") {
    return (
      <div className="space-y-4">
        <FormNote msg="Password reset successfully. Redirecting to sign in…" />
      </div>
    );
  }

  if (step === "request") {
    return (
      <form onSubmit={requestOtp} className="space-y-4">
        {err && <FormError msg={err} />}
        <Input
          label="Email"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@studio.com"
        />
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Sending code…" : "Send reset code"}
        </Button>
      </form>
    );
  }

  if (step === "verify") {
    return (
      <form onSubmit={verifyOtp} className="space-y-4">
        {err && <FormError msg={err} />}
        {note && <FormNote msg={note} />}
        <Input
          label="6-digit code"
          name="code"
          inputMode="numeric"
          required
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
        />
        <div className="flex gap-3">
          <Button type="submit" className="flex-1" size="lg" disabled={loading}>
            {loading ? "Verifying…" : "Verify code"}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => setStep("request")}>
            Back
          </Button>
        </div>
      </form>
    );
  }

  // step === "reset"
  return (
    <form onSubmit={resetPassword} className="space-y-4">
      {err && <FormError msg={err} />}
      <Input
        label="New password"
        type="password"
        name="password"
        required
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
      />
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Resetting…" : "Set new password"}
      </Button>
    </form>
  );
}
