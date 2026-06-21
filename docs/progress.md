# Agent & Team Progress

Session handoff for long-horizon work. Update at the end of every agent session that touches Endgame or core platform goals.

**North star:** `docs/project-visions/endgame.md`  
**Foundation:** `docs/plans/foundation-architecture.md`  
**Active plan:** `docs/plans/endgame-phase-zero.md`  
**Goal ledger:** `.cursor/goals.md`  
**Backlog:** `docs/backlog/prd.json`

---

## Current focus

**Phase 0 — Local play validation (functionally complete)**  
Deferred: `eg-002` position pool (last before Phase 1)  
Optional upgrade: Stockfish WASM bot replacing `randomLegalBot`

---

## Last session

**Date:** 2026-06-21  
**Work:**
- **eg-004** `GameClock` + `clockDisplay` helpers — active highlight, low-time pulse, flag styling
- **eg-005** `randomLegalBot` domain adapter + `useBotOpponent` hook; `commitMove` on session
- **eg-006** `GameResultModal`, resign, rematch via `reset()`
- **eg-007** Storybook: `Play/Endgame/GameClock`, `PlayShell` BulletClock variant
- **eg-008** `EndgameNav` on home + `/play`

**Evidence:** `npm run lint` exit 0; `npm run build` exit 0

**Next:** `eg-002` position pool when ready; Stockfish bot upgrade; Phase 1 planning

---

## Previous session

Play route foundation (`eg-003`): `PlayShell`, `useLocalPlaySession`, `/play` with `DEV_START_FEN`.

---

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
| 2026-06-21 | Interim `randomLegalBot` for Phase 0 | Unblocks full game loop; Stockfish before Phase 1 |

---

## Phase completion checklist

### Foundation
- [x] fnd-001 Platform + play domain + board interaction
- [x] eg-001 Domain scaffold

### Phase 0
- [x] eg-003 Play route (stable FEN)
- [x] eg-004 Clock
- [x] eg-005 Bot (interim random-legal)
- [x] eg-006 Game end + rematch
- [x] eg-007 Storybook PlayShell
- [x] eg-008 Navigation
- [ ] eg-002 Position pool (deferred — last)

### Phase 1+
See `docs/backlog/prd.json`
