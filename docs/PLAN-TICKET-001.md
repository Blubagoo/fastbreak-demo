# TICKET-001: Fastbreak Event Dashboard — Implementation Plan

## Context

Build a full-stack Next.js sports event management app from scratch (empty repo). The key challenge is parallel workflow: the user needs to set up Vercel, Supabase, and Google OAuth manually while Claude builds all the code. Vercel goes first so there's a live URL for configuring OAuth redirect URIs.

---

## Phase 0: Scaffold + Deploy Placeholder

### CLAUDE tasks
1. Initialize Next.js 15+ with App Router, TypeScript, Tailwind, src dir
2. Install deps: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `react-hook-form`, `@hookform/resolvers`
3. Initialize shadcn/ui + install components: button, card, input, label, form, select, textarea, dialog, dropdown-menu, separator, sonner
4. Update `.gitignore` for env files
5. Create placeholder `src/app/page.tsx` with "Fastbreak" heading
6. Commit and push to GitHub

### USER tasks (start immediately, in parallel)
1. **Vercel**: Import the GitHub repo at vercel.com. Save the live URL.
2. **Supabase**: Create a new project at supabase.com (use password from `.env`). Note the **Project URL** and **Anon Key** from Settings > API.

### Deliverable
- Live Vercel URL showing placeholder page
- Supabase project created

---

## Phase 1: UI Shell (CLAUDE) + Backend Config (USER) — in parallel

### TRACK A: USER tasks (Supabase Console + Google Cloud)

1. **Run SQL schema** in Supabase SQL Editor — copy from `docs/TICKET-001-fastbreak-event-dashboard.md` lines 96-139 (events table, venues table, all RLS policies). Also add an `updated_at` trigger:
   ```sql
   create or replace function update_updated_at_column()
   returns trigger as $$
   begin new.updated_at = now(); return new; end;
   $$ language plpgsql;

   create trigger update_events_updated_at
     before update on events
     for each row execute function update_updated_at_column();
   ```

2. **Enable Email Auth** in Supabase > Authentication > Providers. Optionally disable "Confirm Email" for dev.

3. **Set up Google OAuth:**
   - Google Cloud Console > APIs & Credentials > Create OAuth 2.0 Client ID (Web Application)
   - Authorized redirect URI: `https://<SUPABASE_REF>.supabase.co/auth/v1/callback`
   - Copy Client ID + Secret into Supabase > Auth > Providers > Google

4. **Provide env vars to Claude:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### TRACK B: CLAUDE tasks (all code, no Supabase connection needed)

**Step 1 — Types & Schemas**
- `src/types/index.ts`: Event, Venue, EventWithVenues, ActionResponse<T> types
- `src/lib/schemas.ts`: loginSchema, signupSchema, eventSchema (with venues array min 1)

**Step 2 — Safe Action Helper**
- `src/lib/safe-action.ts`: Generic `createSafeAction<TInput, TOutput>()` — Zod validation + error handling, returns `ActionResponse<T>` envelope

**Step 3 — Root Layout**
- `src/app/layout.tsx`: Add `<Toaster />` (Sonner), metadata

**Step 4 — Auth Pages (forms fully built, actions stubbed)**
- `src/app/(auth)/login/page.tsx` + `src/components/auth/login-form.tsx`
- `src/app/(auth)/signup/page.tsx` + `src/components/auth/signup-form.tsx`
- `src/actions/auth.ts` — stubbed: login, signup, logout, loginWithGoogle
- Forms: shadcn Form + react-hook-form + Zod, Google OAuth button, loading states

**Step 5 — Dashboard Shell**
- `src/app/(dashboard)/layout.tsx`: Header with app name, logout button
- `src/app/(dashboard)/page.tsx`: Reads searchParams, renders EventList
- `src/components/events/search-bar.tsx`: Updates URL params on submit
- `src/components/events/sport-filter.tsx`: shadcn Select, updates URL params
- `src/components/events/event-card.tsx`: Card with edit/delete buttons
- `src/components/events/event-list.tsx`: Responsive grid, empty state

**Step 6 — Event Form (Create + Edit)**
- `src/components/events/event-form.tsx`: Shared form with `useFieldArray` for dynamic venues
- `src/app/(dashboard)/events/new/page.tsx`
- `src/app/(dashboard)/events/[id]/edit/page.tsx`
- `src/actions/events.ts` — stubbed: createEvent, updateEvent, deleteEvent, getEvents, getEventById

**Step 7 — Root Redirect**
- `src/app/page.tsx`: Redirect to `/login` (will check auth later)

### Deliverable
- Full UI rendered: auth pages, dashboard, event forms — all with client-side validation
- Venue add/remove works, search/filter controls update URL
- Vercel auto-deploys show the complete UI

---

## Phase 2: Wire Up Supabase (requires user env vars)

**Step 1 — Supabase Client**
- `src/lib/supabase/server.ts`: Server-side client using `@supabase/ssr` + cookies
- `src/lib/supabase/middleware.ts`: Middleware client helper for session refresh

**Step 2 — Auth Middleware**
- `src/middleware.ts`: Refresh session, protect dashboard routes, redirect authenticated users away from auth pages

**Step 3 — Implement Auth Actions**
- Replace stubs in `src/actions/auth.ts` with real Supabase auth calls (signInWithPassword, signUp, signOut, signInWithOAuth for Google)

**Step 4 — Implement Event CRUD Actions**
- Replace stubs in `src/actions/events.ts`:
  - `getEvents(search?, sport?)`: `.ilike()` for search, `.eq()` for filter, `.select('*, venues(*)')`
  - `getEventById(id)`: Single event with venues
  - `createEvent`: Insert event + venues, `revalidatePath`
  - `updateEvent`: Update event, delete old venues + re-insert new ones
  - `deleteEvent`: Delete event (cascades to venues), `revalidatePath`

**Step 5 — Wire Dashboard + Forms**
- Dashboard page calls `getEvents` with search params
- Edit page calls `getEventById`, passes to form
- Layout shows user email, wired logout
- Delete confirmation with AlertDialog
- Root page checks auth, redirects accordingly

### Deliverable
- Fully functional app: auth, CRUD, search, filter all working against Supabase

---

## Phase 3: Polish + Production Deploy

### CLAUDE tasks
- `loading.tsx` files with skeleton UI for dashboard and form routes
- `error.tsx` error boundaries with retry
- `not-found.tsx` for missing events
- Consistent toast messaging, responsive checks, accessible form errors

### USER tasks
- Add env vars to Vercel (Settings > Environment Variables)
- Set Supabase Site URL to Vercel production URL
- Add Vercel URL to Supabase Redirect URLs: `https://<app>.vercel.app/**`
- Update Google OAuth with Vercel URL as authorized origin/redirect

### Deliverable
- Production-ready app at public Vercel URL

---

## Key Architecture Decisions

| Decision | Rationale |
|---|---|
| Single server-side Supabase client only | Spec requires zero client-side DB calls |
| Cookie-based auth via `@supabase/ssr` | Modern Next.js App Router pattern |
| URL search params for search/filter | Server component re-renders on URL change = server-side DB queries |
| Delete-and-reinsert for venue updates | Simpler than tracking individual venue changes |
| Stub-first UI development | Lets Claude build everything while user configures Supabase |

## Verification Checklist
- [ ] Vercel URL loads, unauthenticated users redirect to login
- [ ] Email signup + login work
- [ ] Google OAuth works
- [ ] Dashboard shows events or empty state
- [ ] Search by name hits the database
- [ ] Filter by sport type hits the database
- [ ] Create event with multiple venues
- [ ] Edit event pre-populates all fields + venues
- [ ] Delete event with confirmation dialog
- [ ] Logout clears session
- [ ] Toast notifications on all operations
- [ ] Loading states on async operations
- [ ] Responsive at mobile/tablet/desktop
