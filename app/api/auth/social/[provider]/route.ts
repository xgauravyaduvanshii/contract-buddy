import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getProviderConfig, redirectUri, type OAuthProvider } from "@/lib/oauth";
import { fail } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (provider !== "google" && provider !== "github")
    return fail("Unknown provider", 404);
  const cfg = getProviderConfig(provider as OAuthProvider);
  if (!cfg) return fail(`${provider} login is not configured`, 501);

  const state = crypto.randomBytes(16).toString("hex");
  const url = new URL(cfg.authorizeUrl);
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("redirect_uri", redirectUri(provider as OAuthProvider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", cfg.scopes);
  url.searchParams.set("state", state);
  if (provider === "google") url.searchParams.set("access_type", "offline");

  const res = NextResponse.redirect(url.toString());
  res.cookies.set("cb_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  return res;
}

