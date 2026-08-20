# Atelier Mudassar

Digital fine art portfolio for Mudassar Ghaffar, built with Next.js (App
Router), Tailwind CSS, and Supabase. Public site plus a password-protected
admin panel for managing gallery artwork and contact-form messages.

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript
- **Tailwind CSS v4**
- **Supabase** — Postgres (gallery + contact data), Storage (private artwork
  images), Auth (admin login)
- **Resend** — contact form and admin reply emails
- **Framer Motion** — animation

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy these into `.env.local` (never committed — see `.gitignore`):

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public, RLS-scoped Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, bypasses RLS — admin writes and storage |
| `ADMIN_EMAILS` | Comma-separated allowlist for `/admin` access |
| `RESEND_API_KEY` | Sends the contact form email and admin replies |
| `CONTACT_TO_EMAIL` | Inbox that contact-form submissions are sent to |

Run `supabase/schema.sql` in the Supabase SQL editor once (safe to re-run —
every statement is guarded). Create the first admin account with:

```bash
node scripts/create-admin.mjs owner@example.com
```

## Project layout

- `src/app/components/` — public site sections (Hero, Gallery, Contact, …)
- `src/app/admin/` — gallery and messages management UI
- `src/app/api/` — route handlers (gallery CRUD, contact, auth, messages)
- `src/app/lib/` — Supabase clients, auth/admin guards, rate limiting
- `supabase/schema.sql` — full database schema, RLS policies, storage bucket

## Deploying

Deployed on Vercel. Set the environment variables above in the project's
Vercel dashboard (Production, and Preview/Development as needed) — they are
not read from any committed file.
