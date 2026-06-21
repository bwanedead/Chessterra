# Goal Ledger

Persistent pursuit state for Chessterra → **Endgame** vision.

**Vision:** `docs/project-visions/endgame.md`  
**Phase 1 contract:** `docs/plans/phase-1-platform-contract.md`

---

## Active phase

**Phase 1 — Competitive core (foundation shipped)**  
Next: Supabase persistence + realtime + rated queue

---

## Active stories

| ID | Story | Status | Next action |
|----|-------|--------|-------------|
| eg-101b | Supabase production wiring | `pending` | Apply migration; set `.env.local` |
| eg-102b | Supabase match repository | `pending` | Replace memory store |
| eg-103b | Realtime sync | `pending` | Supabase channel `match:{id}` |
| eg-104b | Persisted ratings | `pending` | Wire `ratings` table |

Full backlog: `docs/backlog/prd.json`

---

## Completed (Phase 0)

All `eg-001`–`eg-008` including 500-position pool (`eg-002`).

---

## Completed (Phase 1 foundation)

| ID | Story | Evidence |
|----|-------|----------|
| eg-101 | Auth foundation | `AuthProvider`, guest ids, `/auth`, Supabase clients |
| eg-102 | Match API | `/api/matches/*`, `MatchService`, `reduceMatch` on server |
| eg-103 | Invite multiplayer | `/match/[id]`, `OnlinePlayShell`, `InviteMatchPanel` |
| eg-104 | Rating hook | `processCompletedRatedMatch` (in-memory until DB) |

---

## Blocked

_(none — Supabase optional for local dev)_

---

## Decisions

| Date | Decision |
|------|----------|
| 2026-06-21 | Phase 1a: REST + poll before Realtime |
| 2026-06-21 | Memory match repo when Supabase unset (CI/dev friendly) |
| 2026-06-21 | Guest `X-Player-Id` until auth configured |
