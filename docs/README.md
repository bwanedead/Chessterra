# Chessterra Docs

This directory is split into collections so contributors and agents can find the right level of detail quickly.

## North star

**`project-visions/endgame.md`** — competitive endgame chess in the browser; the primary product direction for Chessterra.

## Collections

| Path | Purpose |
|------|---------|
| `project-visions/` | Product north star, experience pillars, long-horizon concepts |
| `plans/` | Execution contracts with steps and acceptance criteria (e.g. `endgame-phase-zero.md`, `foundation-architecture.md`) |
| `backlog/` | Machine-readable stories (`prd.json`) for `/goal` pursuit |
| `development-insights/` | Implementation notes and architectural breadcrumbs for the current system |
| `development-insights/branching-workflow.md` | **Branch model** — `main` (live) vs `cursor/dev-main-2440` (integration) |
| `progress.md` | Session handoff — focus, blockers, evidence (update every agent session) |

## Agent workflow

1. `.cursor/goals.md` — active phase and stories
2. `progress.md` — what happened last session
3. Active plan under `plans/`
4. Vision under `project-visions/endgame.md` for architectural decisions

Invoke **`/goal`** in Cursor chat or the `goal` skill to continue the next backlog story.

Add new material to the directory that matches its intent so we can grow documentation without losing the plot.
