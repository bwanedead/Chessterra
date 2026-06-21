# Agent & Team Progress

**North star:** `docs/project-visions/endgame.md`  
**Active plan:** `docs/plans/phase-1-platform-contract.md`  
**Goal ledger:** `.cursor/goals.md`

---

## Current focus

**Phase 1 — auth infrastructure shipped**  
Next: Supabase persistence, realtime, persisted ratings

---

## Last session

**Date:** 2026-06-21  
**Work:**
- Server auth: `src/server/auth/` (`resolveRequestActor`, `requireRequestActor`, profile helpers)
- Middleware: Supabase session refresh on all routes
- API: `GET /api/me` returns actor + profile
- Match routes: create/join/move/resign use verified session (guest `X-Player-Id` fallback in dev)
- Client: `authenticatedFetch` with `credentials: 'same-origin'`; `AuthProvider` syncs `/api/me`

**Evidence:** `npm run lint` exit 0; `npm run build` exit 0

**Stories:** `eg-101c` passes

**Next:** Wire Supabase repository; apply migration; Realtime; persist ratings

---

## Phase checklist

### Phase 0
- [x] All stories eg-001–eg-008

### Phase 1
- [x] eg-101 auth foundation
- [x] eg-101c server auth infrastructure
- [x] eg-102 match API (memory)
- [x] eg-103 invite multiplayer (poll)
- [ ] eg-104 persisted ratings
- [ ] Supabase repo + realtime
