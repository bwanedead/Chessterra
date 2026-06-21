# Phase 1 — Platform Contract

**Objective:** Server-authoritative online play with auth, persistence, and rating hooks — without rewriting board or match domain logic.

**Vision:** `docs/project-visions/endgame.md`  
**Backlog:** `eg-101` … `eg-104`

---

## Architecture

```
Client (BoardSession + PlayShell)
        │  REST (Phase 1a) → Realtime (Phase 1b)
        ▼
API routes (src/app/api/matches/*)
        ▼
MatchService (src/server/match/)
        ▼
MatchRepository (memory | Supabase)
        ▼
reduceMatch + ChessEngine (src/domain/play/match/)
```

**Rule:** Server validates every move. Client board is a view; `MatchSnapshot` is truth.

---

## Identity

See **`docs/plans/auth-strategy.md`** for OAuth (Microsoft, Facebook), magic-link email, and guest mode.

| Mode | When | Player ID |
|------|------|-----------|
| Guest | Bot play / no session | `guest-{uuid}` in localStorage |
| OAuth | Facebook, Microsoft, Google | Supabase `user.id` |
| Magic link | Email one-time link | Supabase `user.id` |
| Password | Optional fallback | Supabase `user.id` |

Profiles table stores `display_name` for rated games. Provider secrets live in Supabase Dashboard only.

---

## REST API (Phase 1a)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/matches` | Create invite match (host = white) |
| `GET` | `/api/matches/:id` | Fetch snapshot |
| `POST` | `/api/matches/:id/join` | Guest/opponent joins black |
| `POST` | `/api/matches/:id/move` | Commit move `{ from, to, promotion? }` |
| `POST` | `/api/matches/:id/resign` | Resign active game |

### Headers

- `X-Player-Id` — required for mutating routes (guest or auth user id)

### Create body

```json
{
  "gameModeId": "endgame-standard",
  "timeControlId": "blitz_3_2",
  "rated": false
}
```

Response: `{ match: MatchSnapshot, invitePath: "/match/{id}" }`

---

## Match lifecycle

```
pending → (join) → active → completed | aborted
```

Events appended to `match_events` when Supabase enabled; always applied via `reduceMatch`.

---

## Database (Supabase)

See `supabase/migrations/20250621000000_phase1_platform.sql`:

- `profiles` — extends `auth.users`
- `matches` — snapshot JSON + indexes
- `match_events` — append-only event log
- `ratings` — per bucket Glicko state

---

## Rating hook

On `status === 'completed'` and `rated === true`:

1. Resolve `RatingBucketKey` from `match.poolKey`
2. Load both players' `RatingRecord`
3. `updateRatings()` from `domain/play/rating/glicko2.ts`
4. Persist (repository stub in Phase 1a; Supabase in 1b)

---

## Client sync (Phase 1a)

`useOnlineMatch` polls `GET /api/matches/:id` every 1.5s while active.

Board loads `currentFen` from snapshot; moves POST to `/move`.

Phase 1b: Supabase Realtime channel `match:{id}`.

---

## Verification

```bash
npm run lint
npm run build
```

Manual: create match → open invite in second tab → join → play moves.
