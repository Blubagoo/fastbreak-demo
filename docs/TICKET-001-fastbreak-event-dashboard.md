# Fastbreak Event Dashboard — Full-Stack Sports Event Management App

## Overview

Build a full-stack Sports Event Management application where users can create, view, and manage sports events with venue information.

**Time Expectation:** 2–3 hours  
**Deployment Target:** Vercel (public URL required)

---

## Tech Stack (Non-Negotiable)

| Layer | Choice |
|---|---|
| Framework | Next.js 15+ (App Router) |
| Language | TypeScript |
| Database | Supabase |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Deployment | Vercel |
| Auth | Supabase Auth (Email + Google SSO) |

---

## Requirements

### 1. Authentication

- [ ] Sign up / Login with email & password
- [ ] Google OAuth sign-in
- [ ] Protected routes — redirect to `/login` if not authenticated
- [ ] Logout functionality
- [ ] Session persistence across page reloads

### 2. Dashboard (Home Page — Post-Login)

- [ ] Display list of all sports events
- [ ] Show key event details per card/row: **name, date, venue, sport type**
- [ ] Navigation to create/edit event forms
- [ ] Responsive grid/list layout
- [ ] **Search by name** — must refetch from the database (not client-side filter)
- [ ] **Filter by sport type** — must refetch from the database (not client-side filter)

### 3. Event Management (CRUD)

**Create Event — fields:**
- [ ] Event name
- [ ] Sport type (e.g., Soccer, Basketball, Tennis)
- [ ] Date & Time
- [ ] Description
- [ ] Venues (**plural** — an event can have multiple venues)

**Edit Event:**
- [ ] Pre-populate form with existing event data
- [ ] Update all fields including venues

**Delete Event:**
- [ ] Confirmation before delete
- [ ] Remove event and associated venue records

---

## Architecture Constraints

These are explicitly called out in the challenge and are **hard requirements**.

### Server-Side Data Access Only
- All database interactions MUST happen server-side via:
  - **Server Actions** (preferred — Fastbreak is pushing toward actions-only)
  - API Routes (Route Handlers) as fallback
  - Server Components for reads
- **NO direct Supabase client calls from client components.** Zero.

### Server Actions Pattern
- Create generic helper(s) for server actions that enforce:
  - Type safety (input + output typing)
  - Consistent error handling (success/error envelope)
- Actions over API Routes wherever possible.

### Forms
- All forms MUST use **shadcn Form component** with **react-hook-form**
  - Ref: https://ui.shadcn.com/docs/components/form
- Zod validation schemas for all form inputs

### UX Polish
- [ ] Loading states on all async operations
- [ ] Error handling — graceful, user-facing
- [ ] Toast notifications for success/error states (shadcn toast)
- [ ] Consistent Tailwind styling throughout

---

## Database Schema (Proposed)

```sql
-- Events table
create table events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  sport_type text not null,
  date_time timestamptz not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Venues table (many-to-one with events)
create table venues (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null,
  name text not null,
  address text,
  created_at timestamptz default now()
);

-- RLS policies
alter table events enable row level security;
alter table venues enable row level security;

-- Users can only CRUD their own events
create policy "Users can view own events" on events for select using (auth.uid() = user_id);
create policy "Users can insert own events" on events for insert with check (auth.uid() = user_id);
create policy "Users can update own events" on events for update using (auth.uid() = user_id);
create policy "Users can delete own events" on events for delete using (auth.uid() = user_id);

-- Venues follow event ownership
create policy "Users can view own event venues" on venues for select using (
  exists (select 1 from events where events.id = venues.event_id and events.user_id = auth.uid())
);
create policy "Users can insert venues for own events" on venues for insert with check (
  exists (select 1 from events where events.id = venues.event_id and events.user_id = auth.uid())
);
create policy "Users can update venues for own events" on venues for update using (
  exists (select 1 from events where events.id = venues.event_id and events.user_id = auth.uid())
);
create policy "Users can delete venues for own events" on venues for delete using (
  exists (select 1 from events where events.id = venues.event_id and events.user_id = auth.uid())
);
```

---

## Proposed File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Auth guard wrapper
│   │   ├── page.tsx            # Event list / dashboard
│   │   └── events/
│   │       ├── new/page.tsx    # Create event
│   │       └── [id]/
│   │           └── edit/page.tsx  # Edit event
│   ├── layout.tsx
│   └── page.tsx                # Redirect to dashboard or login
├── actions/
│   ├── auth.ts                 # Login, signup, logout actions
│   └── events.ts               # CRUD actions for events + venues
├── lib/
│   ├── supabase/
│   │   ├── server.ts           # Server-side Supabase client
│   │   └── middleware.ts       # Auth middleware
│   ├── safe-action.ts          # Generic typed action helper
│   └── schemas.ts              # Zod schemas
├── components/
│   ├── events/
│   │   ├── event-card.tsx
│   │   ├── event-form.tsx      # Shared create/edit form
│   │   ├── event-list.tsx
│   │   ├── search-bar.tsx
│   │   └── sport-filter.tsx
│   ├── ui/                     # shadcn components
│   └── auth/
│       ├── login-form.tsx
│       └── signup-form.tsx
├── types/
│   └── index.ts
└── middleware.ts                # Next.js middleware for auth redirects
```

---

## Deliverables

- [ ] Working Vercel deployment with public URL
- [ ] GitHub repo with clean commit history
- [ ] **README.md** — hand-written, not AI-generated. Include:
  - Thought process
  - Architecture decisions
  - Trade-offs considered
  - Setup instructions

---

## Notes

- The "venues plural" requirement means the event form needs a dynamic field array (add/remove venue rows). react-hook-form's `useFieldArray` handles this.
- Search and filter must hit the DB — use search params in the URL, read them in a server component, and query Supabase with `.ilike()` / `.eq()` filters.
- The generic action helper is a differentiator — shows you understand patterns at scale, not just one-off implementations.
