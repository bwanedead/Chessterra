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
Next story: `eg-002` — Curated position pool JSON

Foundation layer (`fnd-001`, `eg-001`) is in place.

---

## Last session

**Date:** 2026-06-21  
**Work:**
- Laid play platform foundation: `src/platform/`, `src/domain/play/` (chess engine, game modes, time controls, ratings, matchmaking, match reducer)
- Endgame position domain: `src/domain/endgame/position.ts`
- Board layer: themes registry, interaction (click-to-move + highlights), `PlayBoard` component
- Architecture doc: `docs/plans/foundation-architecture.md`
- Storybook: `Play/Foundation/PlayBoard`

**Evidence:** `npm run build` exit 0 (lint: pre-existing hook warnings only)

**Next:** `eg-002` position pool JSON, then `/play` route shell

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
| 2026-06-21 | `PlayBoard` wraps engine + interaction + themed board | Single UI entry for live play |

---

## Phase completion checklist

### Foundation
- [x] fnd-001 Platform + play domain + board interaction
- [x] eg-001 Domain scaffold

### Phase 0
- [ ] eg-002 Position pool
- [ ] eg-003 Play route
- [ ] eg-004 Clock
- [ ] eg-005 Bot
- [ ] eg-006 Game end + rematch
- [ ] eg-007 Storybook PlayShell
- [ ] eg-008 Navigation

### Phase 1+
See `docs/backlog/prd.json`
