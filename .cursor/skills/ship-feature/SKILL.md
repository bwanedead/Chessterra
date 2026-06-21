---
name: ship-feature
description: Ship a docs/plans feature end-to-end with lint, build, Storybook, and progress updates. Use when implementing a planned feature slice with full verification.
disable-model-invocation: true
---

# Ship feature workflow

Use for any execution plan under `docs/plans/`, not only Endgame.

## Steps

1. Read the plan file (e.g. `docs/plans/endgame-phase-zero.md`)
2. Identify the matching backlog story in `docs/backlog/prd.json`
3. Implement the **smallest slice** that satisfies acceptance criteria
4. Run verification:
   ```bash
   npm run lint
   npm run build
   ```
5. Add or update Storybook stories for interactive changes
6. Update `docs/progress.md` and `.cursor/goals.md`
7. Set `"passes": true` on the story in `prd.json` when done

## Architecture check

- Domain in `src/domain/`
- Features in `src/features/<name>/`
- No catch-all files; use registries for extensibility
- Follow `AGENTS.md` Tailwind and testing guidelines
