# Goal Ledger

Persistent pursuit state for Chessterra → **Endgame** vision.  
Agents: read this file at session start; update at session end.

**Vision:** `docs/project-visions/endgame.md`  
**Foundation:** `docs/plans/foundation-architecture.md`

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
| eg-003 | Play route + shell | `pending` | `/play` with `UniversalBoard` + `DEV_START_FEN` |
| eg-004 | GameClock component | `pending` | Wire `domain/play/time-control/clock.ts` to UI |
| eg-005 | Bot opponent | `pending` | After clock + play shell |

**Deferred:** `eg-002` position pool — last in Phase 0; use `DEV_START_FEN` until then.

Full backlog: `docs/backlog/prd.json`

---

## Completion criteria (current `/goal` target)

Phase 0 is **complete** when all are true:

1. `/play` runs a full game vs bot from stable dev position (`DEV_START_FEN`)
2. Clock (3+2) and all end conditions work
3. `npm run lint` and `npm run build` exit 0
4. PlayShell Storybook story exists
5. `docs/progress.md` and this file updated with evidence
6. Stories `eg-001`–`eg-008` marked `passes: true` in `prd.json`

---

## Completed

| ID | Story | Evidence |
|----|-------|----------|
| fnd-001 | Play platform foundation | `src/domain/play/`, `src/platform/`, board themes/interaction, `PlayBoard` |
| eg-001 | Domain scaffold | `src/domain/endgame/position.ts`, `src/domain/play/time-control/clock.ts` |

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
| 2026-06-21 | Phase 0 uses fixed `DEV_START_FEN`; position pool (`eg-002`) deferred to last |

---

## How to use `/goal`

In Cursor chat, invoke the **goal** skill or say:

> `/goal` — continue Endgame Phase 0 per goals.md

For bounded autonomous runs, use Cursor `/loop` with a turn limit.
