# Goal Ledger

Persistent pursuit state for Chessterra → **Endgame** vision.  
Agents: read this file at session start; update at session end.

**Vision:** `docs/project-visions/endgame.md`

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
| eg-001 | Domain scaffold | `pending` | Create `src/domain/endgame/{position,match,clock}.ts` |
| eg-002 | Position pool JSON | `pending` | After eg-001 |
| eg-003 | Play route + shell | `pending` | After eg-002 |

Full backlog: `docs/backlog/prd.json`

---

## Completion criteria (current `/goal` target)

Phase 0 is **complete** when all are true:

1. `/play` runs a full game vs bot from random pool position
2. Clock (3+2) and all end conditions work
3. `npm run lint` and `npm run build` exit 0
4. PlayShell Storybook story exists
5. `docs/progress.md` and this file updated with evidence
6. Stories `eg-001`–`eg-008` marked `passes: true` in `prd.json`

---

## Completed

_(none yet)_

---

## Blocked

_(none)_

---

## Decisions

| Date | Decision |
|------|----------|
| 2026-06-21 | Pursue Endgame as Chessterra evolution; analytics retained |
| 2026-06-21 | Phase 0 before auth/multiplayer |
| 2026-06-21 | Goal ledger + skill replaces native Cursor `/goal` |

---

## How to use `/goal`

In Cursor chat, invoke the **goal** skill or say:

> `/goal` — continue Endgame Phase 0 per goals.md

The agent should:
1. Read this file, `docs/progress.md`, and the active plan
2. Pick the highest-priority incomplete story
3. Implement the smallest verifiable slice
4. Run `npm run lint` and `npm run build`
5. Update this ledger and `docs/progress.md` with evidence

For bounded autonomous runs, use Cursor `/loop` with a turn limit, e.g.:

> `/loop` until eg-003 passes acceptance criteria, max 15 turns
