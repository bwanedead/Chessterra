# Goal Ledger

Persistent pursuit state for Chessterra → **Endgame** vision.

**Vision:** `docs/project-visions/endgame.md`  
**Phase 1 contract:** `docs/plans/phase-1-platform-contract.md`  
**Branching:** `docs/development-insights/branching-workflow.md`

---

## Active phase

**Phase 1 — Platform hardening (in progress)**  
Next: Merge PR stack into `cursor/dev-main-2440`, verify invite game E2E

---

## Active stories

| ID | Story | Status | Next action |
|----|-------|--------|-------------|
| eg-105 | Platform hardening | `in_progress` | Merge #8–#11 into integration branch |
| eg-201 | Skill-based matchmaking queue | `blocked` | After invite games verified on integration |

Full backlog: `docs/backlog/prd.json`

---

## Completed (Phase 0)

All `eg-001`–`eg-008` including 500-position pool (`eg-002`).

---

## Completed (Phase 1)

| ID | Story | Evidence |
|----|-------|----------|
| eg-101 | Auth foundation | `AuthProvider`, guest ids, `/auth`, Supabase clients |
| eg-101b | Supabase production wiring | Service role client, `.env.example`, `supabase/config.toml` |
| eg-101c | Server auth infrastructure | `resolveRequestActor`, middleware, `/api/me` |
| eg-102 | Match API | `/api/matches/*`, `MatchService`, `reduceMatch` on server |
| eg-102b | Supabase match repository | `supabaseRepository`, `getMatchRepository` factory |
| eg-103 | Invite multiplayer | `/match/[id]`, `OnlinePlayShell`, `InviteMatchPanel` |
| eg-103b | Realtime sync | `useMatchRealtime`, polling fallback |
| eg-104 | Rating hook | `processCompletedRatedMatch` |
| eg-104b | Persisted ratings | `supabaseRatingStore` |

---

## Blocked

_(none — apply migrations + `.env.local` on Supabase project for integration deploy)_

---

## Decisions

| Date | Decision |
|------|----------|
| 2026-06-21 | Phase 1a: REST + poll before Realtime |
| 2026-06-21 | Memory match repo when Supabase unset (CI/dev friendly) |
| 2026-06-21 | Guest `X-Player-Id` until auth configured |
| 2026-06-21 | API auth: verified Supabase session first; `guest-*` header fallback only |
| 2026-06-21 | Service role key required for server-side match/rating persistence |
| 2026-06-21 | Realtime when Supabase configured; poll fallback otherwise |
| 2026-06-21 | `main` = live; `cursor/dev-main-2440` = integration; feature PRs target integration |
| 2026-06-21 | Harden before matchmaking: RLS, guest/rated boundaries, version concurrency, audit events |
| 2026-06-21 | Rated games require signed-in users; guests casual invite only |
