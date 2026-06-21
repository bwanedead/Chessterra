# Agent & Team Progress

**North star:** `docs/project-visions/endgame.md`  
**Active plan:** `docs/plans/phase-1-platform-contract.md`  
**Goal ledger:** `.cursor/goals.md`

---

## Current focus

**Phase 1 foundation — shipped**  
Next: Supabase persistence, realtime, persisted ratings

---

## Last session

**Date:** 2026-06-21  
**Work:**
- Phase 1 contract: `docs/plans/phase-1-platform-contract.md`
- Supabase: clients, `.env.example`, SQL migration (`profiles`, `matches`, `match_events`, `ratings`)
- Match server: `MatchService`, `applyMatchMove`, memory repository
- API: `POST/GET /api/matches`, join, move, resign
- Auth: `AuthProvider`, guest ids, `/auth` page
- Online play: `OnlinePlayShell`, `useOnlineMatch` (poll), `/match/[id]`, `InviteMatchPanel` on `/play`
- Ratings: `processCompletedRatedMatch` (in-memory hook)

**Evidence:** `npm run lint` exit 0; `npm run build` exit 0

**Manual test:** `/play` → Create invite link → open in second tab → join → play moves

**Next:** Wire Supabase repository; Realtime; persist ratings

---

## Phase checklist

### Phase 0
- [x] All stories eg-001–eg-008

### Phase 1
- [x] eg-101 auth foundation
- [x] eg-102 match API (memory)
- [x] eg-103 invite multiplayer (poll)
- [ ] eg-104 persisted ratings
- [ ] Supabase repo + realtime
