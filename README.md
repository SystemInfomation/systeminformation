# Derby Family — Kentucky Derby fake-money game

A **Next.js** + **Supabase** app for a private family party: pretend bankrolls, win/place/show/exotic bets, leaderboard, trash-talk chat, and a **race office** page to lock betting and settle results.

**Not gambling.** No payments, no real prizes of value. Entertainment only.

**Security note:** Race office API routes use the Supabase **service role** key on the server and are **not** password-protected. Use only on a trusted network / localhost, or add your own protection before exposing to the internet.

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS v4
- Framer Motion, Recharts, next-themes, canvas-confetti
- Supabase: Postgres, Auth (anonymous), Row Level Security, Realtime (optional for `messages`)

## Setup

1. Create a Supabase project. In **Authentication → Providers**, enable **Anonymous** sign-ins.

2. In the SQL editor, run the migration file:

   [`supabase/migrations/20260202120000_initial.sql`](supabase/migrations/20260202120000_initial.sql)

   This creates tables, RLS policies, the `place_bet` RPC, and seeds a demo game with slug **`derby-2026`**.

3. (Optional) In **Database → Replication**, add the `messages` table to the `supabase_realtime` publication for live chat.

4. Copy environment variables:

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

5. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Flow

1. **Home** — countdown, AI summary strip, leaderboard preview.
2. **Join** (`/join/derby-2026`) — anonymous auth + nickname; receive starting balance from `games.starting_balance`.
3. **Bet** (`/g/derby-2026/bet`) — pick horses, place bets (calls `place_bet` RPC).
4. **Leaderboard** — bankroll, ROI, winning bet counts.
5. **Race office** (`/admin/derby-2026`) — edit horses, lock/unlock, set finish order, **settle** (updates all bets + balances).
6. **Results** — podium + confetti after settle.

## Deploy (Vercel)

- Add the same env vars in the Vercel project (keep `SUPABASE_SERVICE_ROLE_KEY` server-only).
- **Do not** deploy the race office to the public internet without additional protection.

## AI / weather refresh

`POST /api/predictions/refresh?slug=derby-2026` updates `games.ai_summary` (best-effort weather). No auth — local/trusted use only.

## Legal

This repository is a toy for friends and family. It does not facilitate real-money wagering.
