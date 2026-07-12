# Integration verification — `cursor/dev-main-2440`

Checklist before promoting integration → `main`. Run against a Supabase project with migrations applied and env vars set in Vercel preview.

## Status (last updated: 2026-07-12)

| Area | Status | Notes |
|------|--------|-------|
| Local readiness script | **available** | `npm run verify:integration` — env/migration/auth/API file checks; no secrets logged |
| Domain/server unit tests | **available** | `npm run test` — match guards, moves, version conflict, history, replay, rate limits |
| Build gates | **automated locally** | `npm run lint`, `npm run build` |
| Supabase migrations on disk | **present** | phase1, realtime, RLS hardening (`matches.version`), `commit_match_update` RPC |
| Security patch | **done** | Next.js 15.2.9 (React2Shell CVEs); `npx fix-react2shell-next` clean |
| Migrations applied (remote) | **manual** | Run `npm run db:push` or apply SQL in Supabase dashboard |
| Auth E2E | **manual** | Guest vs signed-in, rated boundaries |
| Invite game E2E (two users) | **manual** | Requires preview deploy + Supabase env (eg-105b) |
| Realtime/reconnect polish | **code done (PR #16)** | Realtime health → poll fallback, resync on reconnect/focus/online, 409 recovery, friendly errors |
| Match history | **code done (PR #17)** | `/history` + `GET /api/me/matches`, participant-scoped |
| Observability | **code done (PR #18)** | Structured match API logs, `GET /api/matches/:id/events` replay |
| Rate limiting | **code done (PR #19)** | create/join/move/resign throttled; guest IP guard; `docs/development-insights/rate-limits.md` |
| Matchmaking | **blocked** | Do not build until invite games are boringly reliable |

### Reconnect checks (add to manual E2E)

- [ ] Kill/restore network in one browser mid-game → badge shows Reconnecting → board resyncs
- [ ] Refresh a browser mid-game → game resumes with correct state
- [ ] Simultaneous move race → loser sees friendly retry message, board refreshes
- [ ] `/history` shows the completed game for both players; signed-out user gets 401 from `/api/me/matches`

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
