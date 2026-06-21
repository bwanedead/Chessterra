# Agent & Team Progress

**North star:** `docs/project-visions/endgame.md`  
**Active plan:** `docs/plans/phase-1-platform-contract.md`  
**Goal ledger:** `.cursor/goals.md`

---

## Current focus

**Phase 1 — Supabase persistence complete (code)**  
Next: Apply migrations to production project; Phase 2 matchmaking queue

---

## Last session

**Date:** 2026-06-21  
**Work:**
- **eg-101b:** `createSupabaseServiceClient`, `isSupabasePersistenceEnabled`, `.env.example` service role, `supabase/config.toml`, `npm run db:push`
- **eg-102b:** `supabaseRepository` (matches upsert + match_events), `getMatchRepository` factory
- **eg-103b:** `useMatchRealtime` postgres_changes on `matches`; poll only when Supabase unset
- **eg-104b:** `supabaseRatingStore` — Glicko updates persist to `ratings` table for authenticated users

**Evidence:** `npm run lint` exit 0; `npm run build` exit 0

**Stories:** `eg-101b`, `eg-102b`, `eg-103b`, `eg-104`, `eg-104b` pass

**Manual setup (production):**
1. Copy `.env.example` → `.env.local` with URL, anon key, service role key
2. `npm run db:push` or run SQL migrations in Supabase dashboard
3. Enable OAuth providers per `docs/plans/auth-strategy.md`

**Next:** eg-201 skill-based matchmaking queue

---

## Phase checklist

### Phase 0
- [x] All stories eg-001–eg-008

### Phase 1
- [x] eg-101 auth foundation
- [x] eg-101b Supabase production wiring (code)
- [x] eg-101c server auth infrastructure
- [x] eg-102 match API
- [x] eg-102b Supabase match repository
- [x] eg-103 invite multiplayer
- [x] eg-103b Realtime sync
- [x] eg-104 persisted ratings
- [x] eg-104b ratings table wiring
