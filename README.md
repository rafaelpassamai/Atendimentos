8tu8tu8tu8tu# Helpdesk / Ticketing MVP

Production-oriented MVP with Next.js (App Router) + NestJS + Supabase Postgres/Auth.

## Monorepo Structure

- `apps/web`: Next.js frontend (TypeScript, Tailwind, shadcn-style UI, RHF + zod, TanStack Query)
- `apps/api`: NestJS REST API (TypeScript, DTO validation, JWT guard, role checks)
- `packages/shared`: Shared types/constants used by web + api
- `supabase/migrations`: SQL migration for schema + RPC functions
- `supabase/seeds`: Seed SQL template for catalogs and staff profiles

## Architecture

- Staff logs in at `/login` using Supabase Auth email/password.
- Frontend stores Supabase access token in cookie and sends it as `Bearer` token to Nest.
- Nest validates JWT using Supabase JWKS.
- Nest loads `public.profiles` and enforces `is_active=true`.
- All ticket reads/writes go through Nest API. Browser never writes directly to ticket tables.
- Nest uses Supabase service role key for DB access.

## Implemented MVP Features

- Auth
  - `/login`
  - Middleware-protected internal routes (`/dashboard`, `/tickets`, `/tickets/new`, `/tickets/[id]`, `/catalogs`)
- Dashboard (`/dashboard`)
  - Summary cards: Open, In Progress, Waiting Customer, Resolved Today, Closed Today
  - Queue preview (top 10)
- Tickets list (`/tickets`)
  - Tabs: Queue, My Tickets, All (admin only)
  - Filters: status, priority, department, assigned_to
  - Ordering: priority desc (`urgent > high > medium > low`) then `created_at asc`
  - Server-side pagination
- Ticket detail (`/tickets/[id]`)
  - Header + status/priority badges + related entities
  - Timeline/messages in chronological order
  - Add message / internal note
  - Update status/priority
  - Assign to me
  - Close ticket (`status='closed'`, `closed_at=now()`)
- Create ticket (`/tickets/new`)
  - Creates ticket and inserts first non-internal message from description
- Catalogs (`/catalogs`)
  - Admin UI for creating departments/products/categories

## Backend API Endpoints

Base URL prefix: `/api`

- Users
  - `GET /users/me`
  - `GET /users/staff`
- Tickets
  - `GET /tickets`
  - `GET /tickets/summary`
  - `GET /tickets/queue-preview`
  - `GET /tickets/:id`
  - `POST /tickets`
  - `POST /tickets/:id/messages`
  - `PATCH /tickets/:id`
  - `POST /tickets/:id/assign-to-me`
  - `POST /tickets/:id/close`
- Catalogs
  - `GET /catalogs/departments|products|categories|companies|company-contacts`
  - `POST /catalogs/departments|products|categories` (admin)
  - `PATCH /catalogs/departments/:id|products/:id|categories/:id` (admin)
- Health
  - `GET /health` (public)

## Environment Variables

Copy `.env.example` to `.env` (for API) and `apps/web/.env.local` (for web).

Required:

- Frontend
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_API_BASE_URL` (example: `http://localhost:3001`)
- Backend
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_JWKS_URL` or `SUPABASE_PROJECT_REF`
  - `PORT` (default `3001`)

Project reference provided: `djvjpxnwtlwwylxdhapk`

## Supabase Setup

1. Create a Supabase project (or use existing one).
2. Run SQL migration:
   - `supabase/migrations/20260222_init_helpdesk.sql`
3. Seed base catalogs:
   - `supabase/seeds/seed.sql`
4. Create staff users in Supabase Auth Dashboard.
5. Insert matching rows in `public.profiles` (same UUID as `auth.users.id`) using the template in `supabase/seeds/seed.sql`.

## Local Run

1. Install dependencies at repo root:
   - `npm install`
2. Configure env files:
   - root `.env` for API
   - `apps/web/.env.local` for web
3. Run API:
   - `npm run dev:api`
4. Run Web:
   - `npm run dev:web`
5. Open:
   - `http://localhost:3000/login`

## Basic Security Practices Included

- JWT validation against Supabase JWKS in backend guard
- Role-based authorization (`admin` / `agent`)
- Active-profile enforcement (`profiles.is_active`)
- DTO validation with whitelist and forbidden unknown fields
- CORS enabled with credentials support
- Service role key used only in backend

## Notes

- RPC functions in migration (`list_tickets`, `ticket_dashboard_summary`) centralize queue ordering and summary logic.
- RLS is intentionally out of the critical path in this MVP (service-role backend model), but code is structured for future RLS adoption.
