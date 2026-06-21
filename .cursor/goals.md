# Goal Ledger

Persistent pursuit state for Chessterra → **Endgame** vision.

**Vision:** `docs/project-visions/endgame.md`  
**Phase 1 contract:** `docs/plans/phase-1-platform-contract.md`

---

## Active phase

**Phase 1 — Competitive core (persistence shipped)**  
Next: Production Supabase project setup + rated queue (Phase 2)

---

## Active stories

| ID | Story | Status | Next action |
|----|-------|--------|-------------|
| eg-201 | Skill-based matchmaking queue | `pending` | Widening rating window pairing |

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

_(none — apply migrations + `.env.local` for production Supabase)_

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
