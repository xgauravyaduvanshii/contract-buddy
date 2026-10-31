import { NextRequest, NextResponse } from "next/server";
import type { AuthProvider } from "@prisma/client";
import { db } from "@/lib/db";
import { startSession, toPublicUser } from "@/lib/auth";
import { getProviderConfig, redirectUri, type OAuthProvider } from "@/lib/oauth";
import { fail } from "@/lib/api";

type Profile = { email: string; name: string | null; image: string | null; providerAccountId: string };

async function fetchProfile(provider: OAuthProvider, accessToken: string): Promise<Profile> {
  if (provider === "google") {
    const r = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const j = await r.json();
    return { email: j.email, name: j.name ?? null, image: j.picture ?? null, providerAccountId: String(j.sub) };
  }
  // github
  const r = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "contractbuddy" },
  });
  const u = await r.json();
  let email = u.email as string | undefined;
  if (!email) {
    const e = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "contractbuddy" },
    }).then((x) => x.json());
    email = e?.[0]?.email;
  }
  return { email: email!, name: u.name ?? null, image: u.avatar_url ?? null, providerAccountId: String(u.id) };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (provider !== "google" && provider !== "github") return fail("Unknown provider", 404);
  const p = provider as OAuthProvider;
  const cfg = getProviderConfig(p);
  if (!cfg) return fail(`${provider} login is not configured`, 501);

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("cb_oauth_state")?.value;
  if (!code) return fail("Missing code", 400);
  if (!state || state !== cookieState) return fail("Invalid state", 400);

  // Exchange code for access token
  const tokenRes = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri(p),
    }),
  });
  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson.access_token;
  if (!accessToken) return fail("Token exchange failed", 502);

  const profile = await fetchProfile(p, accessToken);
  const email = profile.email.toLowerCase();
  const enumProvider = p.toUpperCase() as AuthProvider;

  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    user = await db.user.create({
      data: { email, name: profile.name, image: profile.image, provider: enumProvider, emailVerified: true },
    });
  } else {
    user = await db.user.update({
      where: { id: user.id },
      data: { image: user.image ?? profile.image, name: user.name ?? profile.name },
    });
  }

  await db.account.upsert({
    where: { provider_providerAccountId: { provider: enumProvider, providerAccountId: profile.providerAccountId } },
    create: { userId: user.id, provider: enumProvider, providerAccountId: profile.providerAccountId, accessToken },
    update: { accessToken, userId: user.id },
  });

  await startSession(toPublicUser(user));
  const res = NextResponse.redirect(new URL("/dashboard", req.url));
  res.cookies.delete("cb_oauth_state");
  return res;
}

