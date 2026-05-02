# Derby Family — Top 3 picks

A small **Next.js** + **Supabase** app for home: everyone enters **their name** and the **three horses** they think will finish 1st, 2nd, and 3rd. **No money**, no bet types — just a shared grid and simple scoring after the race.

**Race office** (`/admin/derby-2026`): set finish order when the race is over (no passwords in this repo — use only on trusted networks).

## Setup

1. Supabase project → enable **Anonymous** sign-in.

2. Run SQL migrations in order:

   - [`supabase/migrations/20260202120000_initial.sql`](supabase/migrations/20260202120000_initial.sql)
   - [`supabase/migrations/20260203120000_top3_picks.sql`](supabase/migrations/20260203120000_top3_picks.sql)

3. `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

4. `npm install` && `npm run dev`

## Flow

- **Home** → **Make my picks** → name + three dropdowns → save.
- **Everyone** → table of all top-3s.
- **Results** → after office settles, official top 3 + each person’s **score** (0–3 exact places).
- **Office** → lock/unlock (optional), edit horses, **settle** with finish order, reset.

## Scoring

Each pick earns **1 point** per correct slot: your 1st = actual 1st, your 2nd = actual 2nd, your 3rd = actual 3rd (max **3**).

## Legal

Entertainment only — not real-money wagering.
