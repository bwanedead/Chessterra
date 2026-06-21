# Agent & Team Progress

Session handoff for long-horizon work. Update at the end of every agent session that touches Endgame or core platform goals.

**North star:** `docs/project-visions/endgame.md`  
**Foundation:** `docs/plans/foundation-architecture.md`  
**Active plan:** `docs/plans/endgame-phase-zero.md`  
**Goal ledger:** `.cursor/goals.md`  
**Backlog:** `docs/backlog/prd.json`

---

## Current focus

**Phase 0 — Local play validation**  
Next story: `eg-004` — GameClock UI wired to `domain/play/time-control/clock.ts`

Position pool (`eg-002`) deferred until play loop, clock, and bot work.

---

## Last session

**Date:** 2026-06-21  
**Work:**
- Play domain foundation: `src/domain/endgame/play/` — `LocalMatchState`, `reduceLocalMatch`, `createPhase0PlayConfig`
- Feature hooks: `useLocalPlaySession` (board session + match reducer), `useGameClock` (tick driver)
- Structural UI: `PlayShell`, `PlayClockSlot` (clock slot for eg-004 upgrade)
- Route: `/play` with `DEV_START_FEN`, legal moves via `BoardSessionView`
- Storybook: `Play/Endgame/PlayShell`

**Evidence:** `npm run lint` exit 0 (pre-existing hook warnings only); `npm run build` exit 0; `/play` route in build output

**Next:** `eg-004` GameClock component — styled clocks + flag fall UX

---

## Previous session

## Blockers

- None

---

## Decisions log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-21 | Registry pattern for modes/time controls/themes | Add variants without rewriting core |
| 2026-06-21 | Match event reducer | Shared server/client game state logic |
| 2026-06-21 | Rating bucket = mode × time control × subdivision | Independent leaderboards per queue |
| 2026-06-21 | Phase 0 uses `DEV_START_FEN` not position pool | Pool is last; unblocks play route + bot first |

---

## Phase completion checklist

### Foundation
- [x] fnd-001 Platform + play domain + board interaction
- [x] eg-001 Domain scaffold

### Phase 0
- [x] eg-003 Play route (stable FEN)
- [ ] eg-004 Clock
- [ ] eg-005 Bot
- [ ] eg-006 Game end + rematch
- [ ] eg-007 Storybook PlayShell
- [ ] eg-008 Navigation
- [ ] eg-002 Position pool (deferred — last)

### Phase 1+
See `docs/backlog/prd.json`
