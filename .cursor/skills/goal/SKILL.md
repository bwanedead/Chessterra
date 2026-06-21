---
name: goal
description: Pursue the Endgame long-horizon vision. Use when the user types /goal, asks to continue the vision, pick up the goal ledger, or work on the next Endgame backlog story.
disable-model-invocation: false
---

# Goal — Endgame vision pursuit

You are continuing Chessterra's evolution into **Endgame**: browser-based competitive endgame chess with heatmap study tools.

## Before writing code

1. `.cursor/goals.md` — active phase and stories
2. `docs/progress.md` — blockers and last session evidence
3. `docs/project-visions/endgame.md` — north star (architectural decisions)
4. `docs/plans/endgame-phase-zero.md` — current execution contract (Phase 0)
5. `docs/backlog/prd.json` — story IDs and acceptance criteria

## Execution rules

- Work **one backlog story at a time** (`eg-001`, `eg-002`, …) in priority order
- Respect **phase gates** — no auth/multiplayer until Phase 0 complete
- Place domain logic in `src/domain/endgame/`, UI in `src/features/endgame/`
- Reuse `CustomChessboard` and existing chess.js patterns
- Keep heatmap analytics compatible for future post-game replay (Phase 2)

## Verification (required)

```bash
npm run lint
npm run build
```

Add or update Storybook stories for new interactive UI.

## Session end (required)

Update these files with what shipped and evidence (command exit codes, story IDs completed):

- `.cursor/goals.md` — move stories to Completed; set next action
- `docs/progress.md` — Last session section
- `docs/backlog/prd.json` — `"passes": true` for finished stories

## If stuck

- Document blocker in `docs/progress.md` and `.cursor/goals.md` → Blocked
- Do not invent new scope; ask or propose a decision recorded in Decisions log

## Reference: Claude Code `/goal` pattern

Claude Code's native `/goal` uses a measurable end state per session. Our equivalent is the **Phase 0 completion criteria** in `.cursor/goals.md`. For bounded autonomy, suggest Cursor `/loop` with a max turn count.
