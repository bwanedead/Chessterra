# Integration verification — `cursor/dev-main-2440`

Checklist before promoting integration → `main`. Run against a Supabase project with migrations applied and env vars set in Vercel preview.

## Status (last updated: 2025-06-21)

| Area | Status | Notes |
|------|--------|-------|
| Local readiness script | **available** | `npm run verify:integration` — env/migration/auth/API file checks; no secrets logged |
| Domain/server unit tests | **available** | `npm run test` — match service guards, moves, events, version conflict |
| Build gates | **automated locally** | `npm run lint`, `npm run build` |
| Supabase migrations on disk | **present** | phase1, realtime, RLS hardening (`matches.version`), `commit_match_update` RPC |
| Migrations applied (remote) | **manual** | Run `npm run db:push` or apply SQL in Supabase dashboard |
| Auth E2E | **manual** | Guest vs signed-in, rated boundaries |
| Invite game E2E (two users) | **manual** | Requires preview deploy + Supabase env (eg-105b) |
| Realtime/reconnect polish | **not started** | Phase D — after Supabase E2E passes |
| Match history | **not started** | Phase E |
| Matchmaking | **blocked** | Do not build until invite games are boringly reliable |

**Quick local check:**

```bash
npm run verify:integration   # config readiness (exit 0 = local prerequisites met)
npm run test                 # server/domain match tests (no live Supabase)
npm run lint && npm run build
```

Set `VERIFY_API_BASE_URL=https://your-preview.vercel.app` to probe a live `/api/me` endpoint (optional).

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
