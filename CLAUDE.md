# Claude Code bridge

If using Claude Code on this repo, read `@AGENTS.md` first.

## Long-horizon work

- Vision: `docs/project-visions/endgame.md`
- Active plan: `docs/plans/endgame-phase-zero.md`
- Goal ledger: `.cursor/goals.md`
- Progress: `docs/progress.md`

## Claude `/goal` equivalent

Use Claude's native `/goal` with measurable criteria from `.cursor/goals.md` Phase 0 completion section, e.g.:

```
/goal Phase 0 complete: /play runs full bot game with clock; npm run lint and npm run build pass; update goals.md — or stop after 20 turns
```

Between sessions, update `docs/progress.md` so Cursor and Claude stay aligned.
