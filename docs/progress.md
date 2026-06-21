# Agent & Team Progress

Session handoff for long-horizon work. Update at the end of every agent session that touches Endgame or core platform goals.

**North star:** `docs/project-visions/endgame.md`  
**Foundation:** `docs/plans/foundation-architecture.md`  
**Active plan:** `docs/plans/endgame-phase-zero.md`  
**Goal ledger:** `.cursor/goals.md`  
**Backlog:** `docs/backlog/prd.json`

---

## Current focus

**Phase 0 — COMPLETE**  
**Phase 1 — Auth + server play** (`eg-101` next)

Optional pre-Phase 1: Stockfish WASM bot upgrade

---

## Last session

**Date:** 2026-06-21  
**Work:**
- **eg-002** Position pool: 500 validated endgame FENs in `src/data/position-pool.json` (~136 KB)
- Generator: `scripts/generate-position-pool.mjs` (`npm run generate:position-pool`)
- Domain: `src/domain/endgame/pool.ts` — `pickPoolPositionForMatch`, `getPoolEntry`
- Play wired: new game + rematch pick random pool position (excludes last on rematch)
- `PlayShell` shows pool entry id + material note

**Evidence:** `npm run lint` exit 0; `npm run build` exit 0; pool count 500

**Next:** Phase 1 planning — `eg-101` Supabase auth

---

## Blockers

- None

---

## Decisions log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-21 | 500-position generated pool for Phase 0 | User request; ~136 KB on disk, fine to bundle |
| 2026-06-21 | Generator script + chess.js validation | Ensures legal playable endgames; regen when needed |
| 2026-06-21 | Rematch excludes previous position id | Avoid immediate repeat |

---

## Phase completion checklist

### Foundation
- [x] fnd-001 Platform + play domain + board interaction
- [x] eg-001 Domain scaffold

### Phase 0
- [x] eg-002 Position pool (500 FENs)
- [x] eg-003 Play route
- [x] eg-004 Clock
- [x] eg-005 Bot (interim)
- [x] eg-006 Game end + rematch
- [x] eg-007 Storybook
- [x] eg-008 Navigation

### Phase 1+
See `docs/backlog/prd.json`
