# Integration verification — `cursor/dev-main-2440`

Checklist before promoting integration → `main`. Run against a Supabase project with migrations applied and env vars set in Vercel preview.

## Prerequisites

- [ ] `.env.local` (local) or Vercel env (preview) has:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server only)
- [ ] Migrations applied: `npm run db:push` or SQL editor
- [ ] OAuth providers enabled (optional for magic-link-only test)

## Build gates

```bash
npm run lint   # exit 0
npm run build  # exit 0
```

## Auth (Phase 2)

- [ ] Guest can load `/play` and create casual invite (`rated: false`)
- [ ] Guest cannot create rated match (403)
- [ ] Signed-in user can sign in via OAuth or magic link
- [ ] `GET /api/me` returns actor + profile when authenticated
- [ ] Session cookie works on match API calls (no spoofed `X-Player-Id` for auth users)

## Invite game E2E (Phase 3)

Two browsers (or incognito + normal), both signed in:

1. [ ] User A: `/play` → Create invite link
2. [ ] User B: open `/match/{id}` → auto-join
3. [ ] Both see board; moves sync (Realtime or poll)
4. [ ] Illegal move rejected by server
5. [ ] Wrong-turn move rejected
6. [ ] Non-participant cannot move (403)
7. [ ] Game completes (checkmate, resign, or flag)

## Persistence (Phase 3–5)

In Supabase dashboard:

- [ ] `matches` row exists with correct `snapshot` JSON
- [ ] `matches.version` incremented per state change
- [ ] `match_events` contains: `MATCH_CREATED`, `PLAYER_JOINED`, `MATCH_STARTED`, `MOVE_COMMITTED`, `MATCH_COMPLETED`
- [ ] Rated game also has `RATING_UPDATED` events (×2)
- [ ] `ratings` rows updated for both players (rated games only)

## Security (Phase 4)

- [ ] Active match not readable by unauthenticated non-participant (`GET /api/matches/:id` → 403)
- [ ] Pending match readable via invite link (UUID secret)
- [ ] Direct Supabase client cannot INSERT/UPDATE `matches` (RLS)
- [ ] Realtime subscription only receives updates for participant matches

## Concurrency (Phase 5)

- [ ] Simultaneous move attempts: one succeeds, other gets 409 "please retry"

## Vercel (Phase 6)

- [ ] Preview deploy for `cursor/dev-main-2440` builds green
- [ ] Supabase env vars set on integration/preview environment
- [ ] Manual E2E passes on preview URL

## Not required before `main` promotion

- Matchmaking queue
- Stripe billing
- Match history UI
- Leaderboards
