// Typed access to runtime environment variables (server-side only for secrets).
function req(name: string, fallback = ""): string {
  const v = process.env[name];
  return v && v.length ? v : fallback;
}

export const env = {
  appUrl: req("NEXT_PUBLIC_APP_URL", "http://127.0.0.1:4000"),
  databaseUrl: req("DATABASE_URL"),
  jwtSecret: req("JWT_SECRET", "dev-insecure-secret-change-me"),
  sessionCookie: req("SESSION_COOKIE_NAME", "cb_session"),

  xrouterBaseUrl: req("XROUTER_BASE_URL", "https://urmate.tech/api/xrouter/v1"),
  xrouterApiKey: req("XROUTER_API_KEY"),

  smtp: {
    host: req("SMTP_HOST"),
    port: Number(req("SMTP_PORT", "587")),
    user: req("SMTP_USER"),
    pass: req("SMTP_PASS"),
    secure: req("SMTP_SECURE", "false") === "true",
    from: req("MAIL_FROM", "ContractBuddy <no-reply@contractbuddy.com>"),
  },

  google: {
    clientId: req("GOOGLE_CLIENT_ID"),
    clientSecret: req("GOOGLE_CLIENT_SECRET"),
  },
  github: {
    clientId: req("GITHUB_CLIENT_ID"),
    clientSecret: req("GITHUB_CLIENT_SECRET"),
  },
};

export const isSmtpConfigured = Boolean(env.smtp.host && env.smtp.user);
