// Default email templates (7 categories) + a brand-matched HTML layout.
// Admin can override the `html`/`subject` for any key; these are the fallbacks.

const RED = "#dc2626";
const DARK = "#0b0b0f";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function interpolate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) =>
    vars[k] != null ? String(vars[k]) : "",
  );
}

type LayoutOpts = {
  preheader: string;
  title: string;
  subtitle?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
  footerNote?: string;
};

export function renderLayout({
  preheader,
  title,
  subtitle,
  bodyHtml,
  ctaLabel,
  ctaHref,
  footerNote,
}: LayoutOpts): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-preheader" content="${escapeHtml(preheader)}">
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${DARK}">
<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:28px 12px">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.06)">
      <tr><td style="background:${DARK};padding:22px 28px">
        <span style="display:inline-flex;align-items:center;gap:8px;color:#fff;font-weight:700;font-size:16px">
          <span style="width:26px;height:26px;border-radius:8px;background:${RED};display:inline-block"></span>
          Contract<span style="color:${RED}">Buddy</span>
        </span>
      </td></tr>
      <tr><td style="padding:32px 28px">
        <h1 style="margin:0 0 6px;font-size:22px;line-height:1.25">${escapeHtml(title)}</h1>
        ${subtitle ? `<p style="margin:0 0 20px;color:#6b7280;font-size:15px">${escapeHtml(subtitle)}</p>` : `<div style="height:14px"></div>`}
        <div style="font-size:15px;line-height:1.6;color:#374151">${bodyHtml}</div>
        ${
          ctaLabel && ctaHref
            ? `<div style="margin-top:26px"><a href="${escapeHtml(ctaHref)}" style="display:inline-block;background:${RED};color:#fff;text-decoration:none;padding:12px 22px;border-radius:9999px;font-weight:600;font-size:15px">${escapeHtml(ctaLabel)}</a></div>`
            : ""
        }
      </td></tr>
      <tr><td style="padding:20px 28px;background:#fafafa;border-top:1px solid #eee;font-size:12px;color:#9ca3af">
        ${footerNote ? `<p style="margin:0 0 8px">${escapeHtml(footerNote)}</p>` : ""}
        <p style="margin:0">© 2026 ContractBuddy · You're receiving this because you have an account.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export type TemplateDef = {
  key: string;
  name: string;
  category: string;
  subject: string;
  html: string;
  text: string;
};

export const DEFAULT_TEMPLATES: TemplateDef[] = [
  {
    key: "welcome",
    name: "Welcome Email",
    category: "Welcome",
    subject: "Welcome to ContractBuddy, {{name}} 🎉",
    html: renderLayout({
      preheader: "Your contract workspace is ready.",
      title: `Welcome aboard, {{name}}`,
      subtitle: "You're one step away from turning project chats into signed contracts.",
      bodyHtml:
        "<p>Thanks for joining ContractBuddy. Draft a professional contract, send it to your client with one secure link, and collect a legally-binding e-signature — all in minutes.</p><p>Click below to open your dashboard and create your first contract.</p>",
      ctaLabel: "Open dashboard",
      ctaHref: "{{appUrl}}/dashboard",
    }),
    text: "Welcome to ContractBuddy, {{name}}! Open your dashboard: {{appUrl}}/dashboard",
  },
  {
    key: "verify_email",
    name: "Verify Email",
    category: "Authentication",
    subject: "Confirm your ContractBuddy email",
    html: renderLayout({
      preheader: "Please verify your email address.",
      title: "Confirm your email",
      subtitle: "One quick step to secure your ContractBuddy account.",
      bodyHtml: "<p>Use the button below to verify <b>{{email}}</b>. This link expires in 24 hours.</p>",
      ctaLabel: "Verify email",
      ctaHref: "{{appUrl}}/verify-email?token={{token}}",
    }),
    text: "Verify your email: {{appUrl}}/verify-email?token={{token}}",
  },
  {
    key: "password_reset_otp",
    name: "Password Reset OTP",
    category: "Authentication",
    subject: "Your ContractBuddy reset code is {{otp}}",
    html: renderLayout({
      preheader: "Use this code to reset your password.",
      title: "Reset your password",
      subtitle: "Enter this verification code to continue. It expires in 15 minutes.",
      bodyHtml:
        `<p style="text-align:center;margin:8px 0 4px"><span style="font-size:40px;letter-spacing:10px;font-weight:800;color:${RED};font-family:monospace">{{otp}}</span></p>` +
        "<p style='text-align:center;color:#6b7280'>If you didn't request this, you can safely ignore this email.</p>",
      footerNote: "For your security, this code can be used only once.",
    }),
    text: "Your ContractBuddy reset code is {{otp}}. It expires in 15 minutes.",
  },
  {
    key: "email_change_otp",
    name: "Email Change OTP",
    category: "Account",
    subject: "Confirm your new ContractBuddy email — {{otp}}",
    html: renderLayout({
      preheader: "Verify this email address to continue the change request.",
      title: "Confirm your new email",
      subtitle: "Enter this code to verify {{email}}. It expires in 15 minutes. An admin then approves the change.",
      bodyHtml:
        `<p style="text-align:center;margin:8px 0 4px"><span style="font-size:40px;letter-spacing:10px;font-weight:800;color:${RED};font-family:monospace">{{otp}}</span></p>` +
        "<p style='text-align:center;color:#6b7280'>If you didn't request this, ignore this email — your current address stays active.</p>",
      footerNote: "For your security, this code can be used only once.",
    }),
    text: "Confirm your new email {{email}} with code {{otp}}. It expires in 15 minutes.",
  },
  {
    key: "password_changed",
    name: "Password Changed",
    category: "Authentication",
    subject: "Your password was changed",
    html: renderLayout({
      preheader: "Heads up — your password changed.",
      title: "Password updated",
      bodyHtml: "<p>Your ContractBuddy password was just changed. If this was you, no action needed. If not, contact support immediately.</p>",
      ctaLabel: "Contact support",
      ctaHref: "{{appUrl}}/contact",
    }),
    text: "Your ContractBuddy password was changed. If this wasn't you, contact support.",
  },
  {
    key: "kyc_requested",
    name: "KYC Info Required",
    category: "KYC",
    subject: "Action needed: verify your identity",
    html: renderLayout({
      preheader: "We need a few details to verify your identity.",
      title: "Complete your KYC",
      subtitle: "To keep payouts and e-signatures compliant, please verify your identity.",
      bodyHtml: "<p>Head to settings to upload your verification documents. It usually takes just a couple of minutes.</p>",
      ctaLabel: "Start verification",
      ctaHref: "{{appUrl}}/dashboard/settings",
    }),
    text: "Please complete your KYC verification: {{appUrl}}/dashboard/settings",
  },
  {
    key: "kyc_approved",
    name: "KYC Approved",
    category: "KYC",
    subject: "You're verified ✅",
    html: renderLayout({
      preheader: "Your identity has been verified.",
      title: "Verification approved",
      bodyHtml: "<p>Great news — your identity is verified. You can now send and sign contracts with full legal validity.</p>",
      ctaLabel: "Back to dashboard",
      ctaHref: "{{appUrl}}/dashboard",
    }),
    text: "Your ContractBuddy identity verification was approved.",
  },
  {
    key: "system_alert",
    name: "System Alert",
    category: "System",
    subject: "{{title}}",
    html: renderLayout({
      preheader: "Service update from ContractBuddy.",
      title: "{{title}}",
      subtitle: "{{when}}",
      bodyHtml: "<p>{{message}}</p>",
    }),
    text: "{{title}} — {{message}}",
  },
  {
    key: "campaign_newsletter",
    name: "Campaign / Newsletter",
    category: "Campaigns",
    subject: "{{headline}}",
    html: renderLayout({
      preheader: "News from ContractBuddy.",
      title: "{{headline}}",
      bodyHtml: "<p>{{body}}</p>",
      ctaLabel: "Learn more",
      ctaHref: "{{appUrl}}",
    }),
    text: "{{headline}} — {{body}}",
  },
  {
    key: "payment_receipt",
    name: "Payment Receipt",
    category: "Payments",
    subject: "Receipt: {{amount}} for ContractBuddy {{plan}}",
    html: renderLayout({
      preheader: "Your payment was successful.",
      title: "Payment receipt",
      subtitle: "Thanks for your payment.",
      bodyHtml:
        `<p>Amount: <b>{{amount}}</b><br>Plan: <b>{{plan}}</b><br>Date: <b>{{date}}</b><br>Invoice: <b>{{invoice}}</b></p>`,
      ctaLabel: "View invoices",
      ctaHref: "{{appUrl}}/dashboard/settings",
    }),
    text: "Receipt: {{amount}} for {{plan}} on {{date}}. Invoice {{invoice}}.",
  },
  {
    key: "payment_failed",
    name: "Payment Failed",
    category: "Payments",
    subject: "We couldn't process your payment",
    html: renderLayout({
      preheader: "Action needed to avoid a service interruption.",
      title: "Payment failed",
      bodyHtml: "<p>Your last payment for ContractBuddy {{plan}} didn't go through. Please update your billing details to keep your workspace active.</p>",
      ctaLabel: "Update billing",
      ctaHref: "{{appUrl}}/dashboard/settings",
    }),
    text: "Payment failed for {{plan}}. Please update billing: {{appUrl}}/dashboard/settings",
  },
  {
    key: "account_security",
    name: "Account Security",
    category: "Account",
    subject: "New sign-in to your ContractBuddy account",
    html: renderLayout({
      preheader: "A new device signed in to your account.",
      title: "New sign-in detected",
      subtitle: "{{device}} · {{location}}",
      bodyHtml: "<p>If this was you, no action is needed. If you don't recognise this activity, secure your account right away.</p>",
      ctaLabel: "Secure my account",
      ctaHref: "{{appUrl}}/dashboard/settings",
    }),
    text: "New sign-in on {{device}} ({{location}}). If not you, secure your account.",
  },
];

export const TEMPLATE_KEYS = DEFAULT_TEMPLATES.map((t) => t.key);
