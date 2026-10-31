# ContractBuddy

Your AI contract & document buddy for freelancers, designers and agencies. Draft legally-sound service agreements and proposals in minutes by chatting with AI, generate branded proposals from templates, collect e-signatures, and manage client projects — all in one dark, focused workspace.

**Live stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · Prisma 6 · PostgreSQL · Zod · jose (JWT sessions) · bcryptjs · Nodemailer · lucide-react · XRouter AI gateway.

---

## Contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Setup](#setup)
5. [Environment variables](#environment-variables)
6. [Available scripts](#available-scripts)
7. [Project structure](#project-structure)
8. [Data model](#data-model)
9. [API reference](#api-reference)
10. [Authentication](#authentication)
11. [AI integration](#ai-integration)
12. [Security & secrets policy](#security--secrets-policy)

---

## Features

### Chat-first contract builder
- One-time onboarding wizard: niches, pricing model, default contract terms (revisions, termination fee, IP transfer, late penalty, feedback window) and business details (PAN / GSTIN / UPI / IFSC) — persisted per user and injected into every AI drafting prompt.
- Conversational drafting: the AI asks clarifying questions first, then drafts a full contract (10–13 clauses, fee breakdown with GST, TDS 194J note, jurisdiction).
- Live document preview with editable clause accordions, fee boxes and inline clause editing.
- E-signature modal — **Type** (styled signature) or **Draw** (canvas) — marked valid under the IT Act, 2000. Sign → send-to-client flow.

### Proposal builder
- Start blank, from a template, or generate with AI from a short brief (structured-JSON prompting with extraction fallbacks).
- Document canvas (sections, offers with strike/discount, terms, note card, project/client linking) with a right-hand properties panel: status, fee structure, amount + GST totals, expiry, currency, typography/colors/accent swatches, logo upload, payment details.
- Debounced autosave with IDLE / SAVING / SAVED indicator, focus/preview mode, print-to-PDF support.
- Auto-generated proposal codes (`CB-P-YYYY-NNN`).

### Templates library
- 10 seeded global templates (6 proposal, 4 contract) rendered as cards with badge, tone dot, price hint, tag chips.
- Preview, Use (instantly starts a proposal or contract), duplicate-to-own, and full section/terms editor for your own templates.
- Global templates are read-only — editing one duplicates it into your workspace first.

### Projects, chat and knowledge
- Client project workspace with attachments and per-project context.
- Threaded AI chat with reactions, comments, translations, retry/edit, prompt suggestions and starred/thread management.
- Per-user AI memories (auto-generated context, toggleable generation + retrieval).
- Design systems and skills/plugins surfaces.

### Account & admin
- Email+password auth with bcrypt, JWT session cookie (`cb_session`, httpOnly), Google/GitHub OAuth (optional), forgot-password via OTP email.
- Email change flow with OTP + admin approval queue; admin SMTP template testing and live SMTP management.
- Admin dashboard for users, requests and app settings.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.4.3, App Router, `cacheComponents` (route-level `export const instant = false` for dynamic pages) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 via `@tailwindcss/turbopack`, dark zinc + brand palette, rounded design system |
| ORM / DB | Prisma 6.19 + PostgreSQL |
| Validation | Zod v4 (shared request-body schemas) |
| Auth | bcryptjs password hashing, jose JWTs in httpOnly cookies, OAuth via `Account` model |
| Email | Nodemailer (SMTP configurable at runtime from admin panel) |
| AI | XRouter gateway (`urmate.tech/api/xrouter/v1`), default model `ag/gemini-3.8-flash-tiered` |
| Icons | lucide-react |
| Package manager | pnpm 12 (`onlyBuiltDependencies` set for Prisma/esbuild) |

---

## Prerequisites

- Node.js 20+
- pnpm 12+ (`corepack enable` or `npm i -g pnpm`)
- PostgreSQL 15+ running locally (or a hosted connection string)

---

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Create your env file and fill in real values
cp .env.template .env

# 3. Create the Postgres database (once)
createdb contractbuddy   # or via your DB tool

# 4. Push the schema and generate the Prisma client
pnpm prisma:push         # prisma db push + generate

# 5. Seed default data (admin user, global templates, app settings)
pnpm db:seed

# 6. Run the dev server
pnpm dev                 # http://localhost:3000
```

Global doc-templates are additionally auto-upserted on first `/api/templates` request, so the template library is never empty even without seeding.

---

## Environment variables

Copy `.env.template` → `.env`. Never commit `.env` (gitignored).

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Public base URL used in emails/redirects |
| `DATABASE_URL` | Postgres connection string. URL-encode special chars in the password (`@` → `%40`) |
| `JWT_SECRET` | Session signing secret — `openssl rand -hex 32` |
| `SESSION_COOKIE_NAME` | Cookie name (default `cb_session`) |
| `XROUTER_BASE_URL` | AI gateway base URL |
| `XROUTER_API_KEY` | AI gateway key (`xr_...`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_SECURE` | Transactional email. Port 465 requires `SMTP_SECURE=true`. Blank host logs emails to console in dev |
| `MAIL_FROM` | From header; must match the SMTP account |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google OAuth |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional GitHub OAuth |

---

## Available scripts

| Command | Action |
|---|---|
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | ESLint (`--max-warnings=0` in CI) |
| `pnpm prisma:push` | Push schema to DB + generate client |
| `pnpm prisma:generate` | Regenerate Prisma client |
| `pnpm db:seed` | Run `prisma/seed.ts` |

---

## Project structure

```
app/                    # Next.js App Router
  (public pages)        # landing, about, blogs, contact, terms, signin, signup, forgot-password
  dashboard/            # authed workspace: projects, chat, proposals, contracts, templates, settings, admin
  api/                  # route handlers (see API reference below)
components/             # UI: dashboard views, builder screens (proposal/contract editors,
                        # templates gallery, onboarding wizard), chat, primitives
lib/                    # server-safe logic: auth, api helpers (ok/fail), db, xrouter client,
                        # memories, doc-templates seed, builder-types, validators
prisma/                 # schema.prisma, seed.ts, SQL exports
database/               # fresh schema/data export
```

---

## Data model

22 Prisma models. Highlights:

| Model | Purpose |
|---|---|
| `User`, `Session`, `Account` | Identity, sessions, OAuth links |
| `Project`, `Attachment` | Client workspaces + files |
| `Contract` | AI-drafted contract: clauses, fees, chat turns, suggestions, jurisdiction, signature (TYPE/DRAW), status, optional `proposalId` link |
| `Proposal` | Full proposal document: sections/offers/terms/style Json, fee, `code` (`CB-P-YYYY-NNN`), validUntil, templateKey, status, project/logo/payment fields |
| `DocTemplate` | Template library; `userId: null` rows are global read-only seeds, otherwise user-owned copies |
| `BuilderProfile` | Per-user contract-builder onboarding (niches, pricing, default terms, business details) |
| `ChatThread`, `ChatMessage`, `Memory` | Conversations, message-level reactions/comments/translations, per-user AI memories |
| `OtpToken`, `EmailChangeRequest`, `EmailTemplate` | Auth OTPs, email-change approvals, admin-testable email templates |
| `Notification`, `Notice` | User notifications and system notices |
| `Skill`, `UserSkill`, `Plugin`, `DesignSystem`, `AppSetting` | Extensions and platform configuration |

Nullable JSON columns must be cleared with `Prisma.DbNull` (plain `null` stores JSON null).

---

## API reference

All routes are cookie-authenticated via `requireUser()` unless noted; responses use the shared `{ ok, data } / { ok: false, error }` envelope from `lib/api.ts`.

| Route | Methods | Notes |
|---|---|---|
| `/api/auth/*` | POST | signup, signin, signout, OAuth start/callback, forgot/reset password (OTP) |
| `/api/me` | GET, PATCH | profile |
| `/api/projects[/{id}]` | GET, POST, PATCH, DELETE | ownership-checked |
| `/api/threads[/{id}]` | GET, POST, PATCH, DELETE | chat thread management (star/rename/archive) |
| `/api/chat` | POST | AI chat with memory injection |
| `/api/messages/{id}/*` | POST | react, comment, translate, retry/edit actions |
| `/api/proposals` | GET, POST | list / create (zod `proposalBodySchema`, auto `code`) |
| `/api/proposals/{id}` | GET, PATCH, DELETE | autosave target |
| `/api/proposals/generate` | POST | AI brief → structured-JSON proposal |
| `/api/contracts` | GET, POST | create from brief or from a proposal (`proposalId`) |
| `/api/contracts/{id}` | GET, PATCH, DELETE | clause/fee/status edits |
| `/api/contracts/{id}/message` | POST | AI drafting loop — `ask` vs `draft` modes, persists chat + clauses + fees + suggestions |
| `/api/contracts/{id}/sign` | POST, DELETE | TYPE (≤80 chars) / DRAW (data-URL PNG ≤400KB); clears to `Prisma.DbNull` |
| `/api/templates?kind=` | GET, POST | auto-seeds globals; user templates CRUD |
| `/api/templates/{id}` | GET, PATCH, DELETE | globals read-only (403) — duplicate first |
| `/api/templates/{id}/duplicate` | POST | copies any template into the user's workspace |
| `/api/builder-profile` | GET, PUT | contract-builder onboarding state |
| `/api/uploads` | POST | logo/attachment uploads |
| `/api/models`, `/api/skills`, `/api/plugins`, `/api/design-systems`, `/api/notices`, `/api/notifications`, `/api/memories` | CRUD-ish | feature surfaces |
| `/api/admin/*` | — | admin-only: user management, email templates + SMTP settings (auth-gated) |

---

## Authentication

- Passwords hashed with bcryptjs; sessions are signed JWTs (jose) stored in an httpOnly cookie.
- `requireUser()` (server-only) resolves the cookie → DB user and throws on failure; route handlers map that to `401`.
- OAuth providers write to `Account`; email changes require OTP verification plus admin approval (`EmailChangeRequest`).
- Dashboard routes redirect anonymous visitors to `/signin`.

## AI integration

- Single gateway client (`lib/xrouter.ts`) — chat completions, embeddings and image generation through `XROUTER_BASE_URL`.
- Default model: `ag/gemini-3.8-flash-tiered`. Structured outputs use strict-JSON prompting with a defensive extractor (first `{` → last `}`) and graceful `502` mapping for gateway errors.
- Per-user memory context (`lib/memories.ts`) is injected into chat and drafting prompts; generation and retrieval can be toggled independently.
- Contract drafting prompts embed the user's `BuilderProfile` defaults (revisions, termination fee, IP transfer, penalty, city) so drafts match their business terms.

## Security & secrets policy

- `.env*`, `urmate.md` (private key notes), and all `*.log` files are gitignored. Only `.env.template` is committed.
- Never paste real keys into committed files, issues, or logs. Rotate any key that was ever shared in plaintext.
- Route handlers validate every body with Zod and check resource ownership (`userId`) before read/write; global templates and admin routes add explicit 403 guards.
- Uploads are size/type checked; signature payloads capped (400KB data-URL).

---

## License

Private — all rights reserved.
