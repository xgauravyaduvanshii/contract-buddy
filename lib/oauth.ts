import "server-only";
import { env } from "./env";

export type OAuthProvider = "google" | "github";

type ProviderConfig = {
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string;
  clientId: string;
  clientSecret: string;
};

export function getProviderConfig(p: OAuthProvider): ProviderConfig | null {
  if (p === "google") {
    if (!env.google.clientId || !env.google.clientSecret) return null;
    return {
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: "openid email profile",
      clientId: env.google.clientId,
      clientSecret: env.google.clientSecret,
    };
  }
  if (p === "github") {
    if (!env.github.clientId || !env.github.clientSecret) return null;
    return {
      authorizeUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      scopes: "read:user user:email",
      clientId: env.github.clientId,
      clientSecret: env.github.clientSecret,
    };
  }
  return null;
}

export function isProviderEnabled(p: OAuthProvider) {
  return getProviderConfig(p) != null;
}

export function redirectUri(p: OAuthProvider) {
  return `${env.appUrl}/api/auth/social/${p}/callback`;
}
