# Goal Ledger

Persistent pursuit state for Chessterra → **Endgame** vision.  
Agents: read this file at session start; update at session end.

**Vision:** `docs/project-visions/endgame.md`  
**Foundation:** `docs/plans/foundation-architecture.md`  
**Board core:** `docs/plans/universal-board-foundation.md`  
**Board CLI:** `docs/plans/board-command-language.md`

---

## North star goal

Build a browser-based, rated endgame chess platform on Chessterra infrastructure — fair curated positions, fluid play, scalable architecture, and heatmap analytics as the study layer.

---

## Active phase

**Phase 0 — Local play validation**  
Plan: `docs/plans/endgame-phase-zero.md`

---

## Active stories (pick up in priority order)

| ID | Story | Status | Next action |
|----|-------|--------|-------------|
| eg-002 | Position pool | `deferred` | Last in Phase 0; `DEV_START_FEN` until then |

**Phase 0 play loop is functionally complete** — remaining gate is position pool (deferred) and Stockfish bot upgrade.

Full backlog: `docs/backlog/prd.json`

---

## Completion criteria (current `/goal` target)

Phase 0 is **complete** when all are true:

1. `/play` runs a full game vs bot from stable dev position (`DEV_START_FEN`) ✅
2. Clock (3+2) and all end conditions work ✅
3. `npm run lint` and `npm run build` exit 0 ✅
4. PlayShell Storybook story exists ✅
5. `docs/progress.md` and this file updated with evidence ✅
6. Stories `eg-001`–`eg-008` marked `passes: true` in `prd.json` ✅ (eg-002 deferred)

---

## Completed

| ID | Story | Evidence |
|----|-------|----------|
| fnd-001 | Play platform foundation | `src/domain/play/`, matchmaking, ratings |
| ubc-001 | Universal board core | graph, rulesets, `UniversalBoard` |
| ubc-002 | Board CLI + EditableBoard | `/board-lab`, `config apply`, agent schema |
| eg-001 | Domain scaffold | `src/domain/endgame/position.ts`, clock math |
| eg-003 | Play route + shell | `/play`, `PlayShell`, `useLocalPlaySession` |
| eg-004 | GameClock | `GameClock`, `clockDisplay`, flag/low-time styling |
| eg-005 | Bot opponent | `randomLegalBot`, `useBotOpponent` |
| eg-006 | Game end + rematch | `GameResultModal`, resign, `reset()` |
| eg-007 | PlayShell Storybook | `Play/Endgame/PlayShell`, `GameClock` stories |
| eg-008 | Navigation | `EndgameNav` on home + `/play` |

---

## Blocked

_(none)_

---

## Decisions

| Date | Decision |
|------|----------|
| 2026-06-21 | Pursue Endgame as Chessterra evolution; analytics retained |
| 2026-06-21 | Phase 0 before auth/multiplayer |
| 2026-06-21 | Registry pattern for game modes, time controls, themes, rating buckets |
| 2026-06-21 | `ChessEngine` interface abstracts chess.js for server swap later |
| 2026-06-21 | Board CLI + BoardVariantConfig for agent-drafted variants | `config apply`, `/board-lab` |
| 2026-06-21 | Play foundation: domain `localMatch` reducer + feature hooks before polished UI |
| 2026-06-21 | Phase 0 bot: `randomLegalBot` interim; Stockfish WASM before Phase 1 |

---

## How to use `/goal`

In Cursor chat, invoke the **goal** skill or say:

> `/goal` — continue Endgame Phase 0 per goals.md

For bounded autonomous runs, use Cursor `/loop` with a turn limit.
