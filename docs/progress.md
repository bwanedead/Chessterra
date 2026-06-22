# Agent & Team Progress

**North star:** `docs/project-visions/endgame.md`  
**Active plan:** `docs/plans/phase-1-platform-contract.md`  
**Goal ledger:** `.cursor/goals.md`  
**Branching:** `docs/development-insights/branching-workflow.md`

---

## Current focus

**Phase 1 — platform hardening**  
Next: Merge platform stack into `cursor/dev-main-2440`; manual E2E on integration

---

## Last session

**Date:** 2026-06-21  
**Work:**
- Documented branch model in `AGENTS.md`, `docs/README.md`, `branching-workflow.md`
- RLS hardening migration: participant-scoped reads, removed client match writes
- Optimistic concurrency: `matches.version` + conditional save
- Guest/rated boundaries: `assertActorCanPlayRated`, API 403 for rated guests
- Match GET access control: pending = invite link; active+ = participants only
- Audit events: domain `MatchEvent` types persisted to `match_events`
- Realtime: authenticated users only; guests poll with `X-Player-Id`

**Evidence:** `npm run lint` exit 0; `npm run build` exit 0

**Stories:** `eg-105` partial (hardening code shipped)

**Next:** Merge PRs #8–#11 into `cursor/dev-main-2440`; fix Vercel check on integration

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
- [ ] eg-105 platform hardening (merge + verify on integration)

### Phase 2
- [ ] eg-201 matchmaking (deferred until integration verified)
