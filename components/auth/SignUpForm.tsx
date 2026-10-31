"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiSend } from "@/lib/client";
import { Input, FormError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await apiSend<{ user: unknown }>("/api/auth/signup", "POST", { name, email, password });
    setLoading(false);
    if (!res.ok) {
      setErr(res.error || "Sign up failed");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {err && <FormError msg={err} />}
      <Input
        label="Full name"
        name="name"
        required
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Alex Rivera"
      />
      <Input
        label="Work email"
        type="email"
        name="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@studio.com"
      />
      <Input
        label="Password"
        type="password"
        name="password"
        required
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
      />
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
