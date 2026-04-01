# Fastbreak Event Dashboard — Implementation Plan

## Context

Building a greenfield full-stack sports event management app per `docs/TICKET-001-fastbreak-event-dashboard.md`. The repo currently has zero source code — just the ticket spec. The user removed the "session persistence" auth requirement and the hand-written README deliverable from the original ticket.

---

## Pre-Implementation: Supabase Setup (Manual)

Before any code, the user must create their Supabase project:

1. **Create project** at supabase.com/dashboard — note Project URL + anon key
2. **Run SQL migration** in SQL Editor — the schema from the ticket plus an `updated_at` trigger:

> **Note:** Google OAuth and redirect URL configuration happen in **Phase 1.5** after we have the Vercel URL.

```sql
-- Tables
create table public.events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  sport_type text not null,
  date_time timestamptz not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.venues (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  name text not null,
  address text,
  created_at timestamptz default now()
);

-- RLS
alter table public.events enable row level security;
alter table public.venues enable row level security;

-- Event policies
create policy "Users can view own events" on public.events for select using (auth.uid() = user_id);
create policy "Users can insert own events" on public.events for insert with check (auth.uid() = user_id);
create policy "Users can update own events" on public.events for update using (auth.uid() = user_id);
create policy "Users can delete own events" on public.events for delete using (auth.uid() = user_id);

-- Venue policies (follow event ownership)
create policy "Users can view own event venues" on public.venues for select using (
  exists (select 1 from public.events where events.id = venues.event_id and events.user_id = auth.uid())
);
create policy "Users can insert venues for own events" on public.venues for insert with check (
  exists (select 1 from public.events where events.id = venues.event_id and events.user_id = auth.uid())
);
create policy "Users can update venues for own events" on public.venues for update using (
  exists (select 1 from public.events where events.id = venues.event_id and events.user_id = auth.uid())
);
create policy "Users can delete venues for own events" on public.venues for delete using (
  exists (select 1 from public.events where events.id = venues.event_id and events.user_id = auth.uid())
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;

create trigger on_events_updated before update on public.events
  for each row execute function public.handle_updated_at();
```

5. **Set `.env.local`:**
```
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

---

## Phase 1: Project Scaffold

**Goal:** Running Next.js app with all dependencies and shadcn/ui initialized.

| Step | Action |
|------|--------|
| 1.1 | `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` |
| 1.2 | `npm install @supabase/supabase-js @supabase/ssr next-safe-action zod react-hook-form @hookform/resolvers` |
| 1.3 | `npx shadcn@latest init` (New York style, CSS variables) |
| 1.4 | `npx shadcn@latest add button card input label form select textarea sonner dialog badge separator dropdown-menu avatar` |
| 1.5 | Create `src/types/index.ts` — Event, Venue, EventWithVenues types + SPORT_TYPES constant |

**shadcn note:** Using `sonner` (not legacy `toast`) — simpler API, shadcn's current recommendation.

**Verify:** `npm run dev` shows default Next.js page.

---

## Phase 1.5: Initial Vercel Deployment

**Goal:** Get a live Vercel URL immediately so the user can configure Google OAuth redirect URIs and Supabase settings while development continues.

| Step | Action |
|------|--------|
| 1.5.1 | Push scaffolded project to GitHub |
| 1.5.2 | Connect repo to Vercel (via `vercel` CLI or Vercel dashboard) |
| 1.5.3 | Set environment variables in Vercel project settings (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| 1.5.4 | Deploy — get the live `*.vercel.app` URL |
| 1.5.5 | User configures Google OAuth + Supabase redirect URLs using the live Vercel domain |

**Why now:** Google OAuth requires a valid redirect URI. Having the Vercel URL early means the user can set up Google Cloud OAuth credentials and Supabase redirect URLs in parallel while I build out the Supabase clients, middleware, and auth code. Without this, Google OAuth can't be tested until much later.

**Supabase redirect URLs to add:**
- `https://<your-app>.vercel.app/auth/callback`
- `http://localhost:3000/auth/callback`

**Google Cloud OAuth authorized redirect URI:**
- `https://<supabase-project-ref>.supabase.co/auth/v1/callback`

---

## Phase 2: Supabase Clients + Middleware

**Goal:** Server/browser Supabase clients and auth-protecting middleware.

| File | Purpose |
|------|---------|
| `src/lib/supabase/server.ts` | `createClient()` using `createServerClient` from `@supabase/ssr` + `cookies()` from `next/headers` |
| `src/lib/supabase/client.ts` | `createClient()` using `createBrowserClient` — **only for auth state listening, never DB calls** |
| `src/lib/supabase/middleware.ts` | `updateSession()` — refreshes auth tokens via `supabase.auth.getUser()`, writes cookies to both request and response, redirects unauthenticated users to `/login` |
| `src/middleware.ts` | Thin entry point calling `updateSession()`, matcher excludes static assets |

**Key detail:** Middleware `setAll` must write cookies to BOTH `request.cookies` (for downstream server components) AND `response.cookies` (for the browser).

**Public paths** (no auth redirect): `/login`, `/signup`, `/auth/callback`

**Verify:** All routes redirect to `/login` (404 is fine — the page doesn't exist yet).

---

## Phase 3: Authentication

**Goal:** Working email/password + Google OAuth sign-up/login/logout.

### Files to create:

| File | What |
|------|------|
| `src/lib/schemas.ts` | Zod schemas: `loginSchema`, `signupSchema` (with confirmPassword + refine) |
| `src/lib/safe-action.ts` | Two next-safe-action clients: `actionClient` (public) and `authActionClient` (checks auth, passes `user` + `supabase` in context) |
| `src/actions/auth.ts` | 4 actions: `loginWithEmail`, `signupWithEmail`, `loginWithGoogle` (returns OAuth URL), `logout` |
| `src/app/auth/callback/route.ts` | GET handler — exchanges OAuth code for session via `exchangeCodeForSession`, redirects to `/` |
| `src/components/auth/login-form.tsx` | Client component: shadcn Form + react-hook-form + `useAction` hook for login + Google OAuth button |
| `src/components/auth/signup-form.tsx` | Client component: same pattern with confirmPassword field |
| `src/app/(auth)/layout.tsx` | Centered card layout for auth pages |
| `src/app/(auth)/login/page.tsx` | Server component rendering `<LoginForm />` |
| `src/app/(auth)/signup/page.tsx` | Server component rendering `<SignupForm />` |
| `src/app/layout.tsx` | Modify — add `<Toaster />` from sonner |

### Route structure decision:
- Middleware handles all auth redirects (no root `page.tsx` needed)
- `(dashboard)/page.tsx` serves `/` — protected by middleware
- `(auth)/login` and `(auth)/signup` are public paths

**Verify:** Full auth cycle — sign up, log out, log back in, Google OAuth.

---

## Phase 4: Dashboard + Event Listing

**Goal:** Event list with server-side search and sport-type filter.

| File | What |
|------|------|
| `src/app/(dashboard)/layout.tsx` | Auth guard layout — header with app name, user dropdown (logout), wraps children |
| `src/components/dashboard-header.tsx` | Header component: title, user dropdown menu with logout |
| `src/app/(dashboard)/page.tsx` | **Server Component** — reads `searchParams`, queries Supabase with `.ilike("name", ...)` and `.eq("sport_type", ...)`, renders event list |
| `src/components/events/event-list.tsx` | Responsive grid of event cards, empty state |
| `src/components/events/event-card.tsx` | Card showing name, sport badge, date, venue summary, edit/delete buttons |
| `src/components/events/search-bar.tsx` | Client component — debounced input that updates `?search=` URL param via `router.replace()` |
| `src/components/events/sport-filter.tsx` | Client component — shadcn Select that updates `?sport=` URL param |
| `src/components/events/delete-event-button.tsx` | Client component — confirmation Dialog + `useAction` to call `deleteEvent` action |

**Search/filter pattern:** Client components update URL search params → triggers server re-render → server component reads params → queries Supabase with filters. Zero client-side filtering.

**Verify:** Dashboard loads (empty). Search bar and filter update URL. Cards render correctly once events exist.

---

## Phase 5: Event CRUD

**Goal:** Create, edit, and delete events with multi-venue support.

### Zod schema addition to `src/lib/schemas.ts`:

```typescript
export const eventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  sport_type: z.string().min(1, "Sport type is required"),
  date_time: z.string().min(1, "Date and time is required"),
  description: z.string().optional(),
  venues: z.array(z.object({
    id: z.string().optional(), // present for existing venues during edit
    name: z.string().min(1, "Venue name is required"),
    address: z.string().optional(),
  })).min(1, "At least one venue is required"),
});
```

### Server Actions — `src/actions/events.ts`:

| Action | Details |
|--------|---------|
| `getEvents` | Read events with venues, supports search + sport filter params |
| `getEvent` | Read single event by ID with its venues |
| `createEvent` | Insert event row, then insert venue rows with the returned event ID |
| `updateEvent` | Update event row, delete all existing venues, re-insert venues (simpler than diffing) |
| `deleteEvent` | Delete event by ID (cascade handles venues) |

All use `authActionClient` which provides `ctx.user` and `ctx.supabase`.

### Event Form — `src/components/events/event-form.tsx`:

Shared form for create AND edit. Key details:
- react-hook-form with `zodResolver(eventSchema)`
- `useFieldArray` for the venues array — add/remove venue rows dynamically
- shadcn Form components throughout
- Date/time input: native `datetime-local` input (simple, no extra dependency)
- Sport type: shadcn Select with `SPORT_TYPES` options
- `useAction` hook from next-safe-action for submission
- Loading state on submit button via `isExecuting`
- Toast on success/error via sonner
- Redirect to `/` on successful create/update

### Pages:

| File | What |
|------|------|
| `src/app/(dashboard)/events/new/page.tsx` | Server component — renders `<EventForm />` in create mode |
| `src/app/(dashboard)/events/[id]/edit/page.tsx` | Server component — fetches event data via `getEvent`, passes to `<EventForm />` for edit mode |

**Verify:** Create an event with 2 venues, see it on dashboard, edit it, delete it.

---

## Phase 6: Polish

**Goal:** Loading states, error handling, consistent UX.

| Item | Implementation |
|------|---------------|
| Loading states | `isExecuting` from `useAction` on all form submissions; `Suspense` boundaries with skeleton loaders on dashboard |
| Toast notifications | `toast.success()` / `toast.error()` from sonner on all CRUD operations |
| Error handling | next-safe-action's error envelope surfaces server errors; form validation errors shown inline via shadcn FormMessage |
| Empty states | "No events found" message when list is empty or search returns nothing |
| Responsive design | Tailwind responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop |
| Consistent styling | Tailwind + shadcn defaults, consistent spacing/typography |

---

## Phase 7: Final Vercel Deployment

Since the initial Vercel deployment was done in Phase 1.5, this phase is just:
1. Push final code to GitHub (auto-deploys via Vercel)
2. Verify production URL works end-to-end

---

## File Tree Summary

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── events/
│   │       ├── new/page.tsx
│   │       └── [id]/edit/page.tsx
│   ├── auth/callback/route.ts
│   └── layout.tsx
├── actions/
│   ├── auth.ts
│   └── events.ts
├── lib/
│   ├── supabase/
│   │   ├── server.ts
│   │   ├── client.ts
│   │   └── middleware.ts
│   ├── safe-action.ts
│   └── schemas.ts
├── components/
│   ├── dashboard-header.tsx
│   ├── events/
│   │   ├── event-card.tsx
│   │   ├── event-form.tsx
│   │   ├── event-list.tsx
│   │   ├── search-bar.tsx
│   │   ├── sport-filter.tsx
│   │   └── delete-event-button.tsx
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── signup-form.tsx
│   └── ui/ (shadcn generated)
├── types/
│   └── index.ts
└── middleware.ts
```

## Verification Plan

After each phase, run `npm run dev` and test incrementally:
1. **Phase 1** — default Next.js page loads
2. **Phase 1.5** — live Vercel URL works; user configures Google OAuth + Supabase redirects in parallel
3. **Phase 2** — all routes redirect to /login
4. **Phase 3** — sign up, log in (email + Google), log out all work
5. **Phase 4** — dashboard renders, search/filter update URL and re-query
6. **Phase 5** — full CRUD: create event with venues, edit, delete
7. **Phase 6** — loading spinners, toast notifications, error states, responsive layout
8. **Phase 7** — production Vercel URL works end-to-end
