# Repository Guidelines

## Long-horizon goal: Endgame

Chessterra is evolving into **Endgame** — a browser-based, rated competitive chess product where every game starts in the endgame. Heatmap analytics remain a first-class study layer.

Before sizeable changes, read:
- `docs/project-visions/endgame.md` — product north star and architecture constitution
- `docs/plans/universal-board-foundation.md` — graph board, rulesets, progression messages
- `docs/plans/endgame-phase-zero.md` — active execution plan (Phase 0)
- `.cursor/goals.md` and `docs/progress.md` — current focus and session handoff
- `docs/backlog/prd.json` — checkable stories (`eg-001`, …)

**`/goal`:** Cursor has no native `/goal` command. Use the `goal` skill (`.cursor/skills/goal/SKILL.md`) or say `/goal` in chat; the agent reads the goal ledger and continues the highest-priority incomplete story. For bounded autonomous runs, combine with Cursor `/loop` and a max turn count.

**Definition of done** for feature work:
- `npm run lint` clean
- `npm run build` succeeds
- Relevant Storybook story updated or added
- `docs/progress.md` and `.cursor/goals.md` updated with evidence

## Project Structure & Module Organization
Chessterra is a Next.js (app router) workspace. UI routes, layouts, and server actions live in `src/app`, shared UI elements in `src/components`, and chess utilities in `src/lib`. Endgame domain logic lives in `src/domain/endgame/`; universal board in `src/domain/board-core/`, `src/domain/board-rules/`, `src/domain/board-session/`; play UI in `src/features/board/` and `src/features/play/`. Storybook-ready UI examples live beside components under `src/stories`, while exploratory scenarios sit in the top-level `stories/`. Static assets and icons belong in `public/`, and `.storybook/` hosts Storybook configuration. Review `PROJECT_PLAN.md` for historical setup context; prefer `docs/project-visions/endgame.md` for product direction.

## Build, Test, and Development Commands
- `npm install` - install dependencies; rerun after pulling new packages.
- `npm run dev` - launch the local app at `http://localhost:3001` with hot reloading.
- `npm run build` - production build verification; fix build warnings before deployment.
- `npm start` - serve the built app locally.
- `npm run lint` - run the Next.js ESLint suite; must be clean before shipping.
- `npm run storybook` - open component sandbox on port 6006 for visual QA.
- `npm run build-storybook` - generate the static Storybook bundle for previews.

## Coding Style & Naming Conventions
Use TypeScript with strict, explicit typing for shared utilities. Follow ESLint's `next/core-web-vitals` guidance and keep indentation at two spaces. Favor React function components, hooks over classes, and descriptive prop names (`selectedSquare`, `heatmapMode`). Prefer Tailwind utility classes; limit module CSS to layout edge cases. Name files in kebab-case for routes (`move-history`), PascalCase for components, and camelCase for helpers.

### Tailwind specifics
- Write utilities as literal strings (e.g. `className="pb-24"`). When a value is conditional, map it to a finite list of literal classes instead of synthesising `pb-${value}` strings.
- Use inline styles only when a value is truly dynamic and cannot be represented by a small set of utilities. Inline styles will win the cascade, so avoid combining them with utilities for the same property unless deliberate.
- If a dynamic class is unavoidable, add it to the safelist in `tailwind.config.ts` and leave a short comment explaining why.
- Update the Tailwind `content` glob whenever you create a new component directory so utilities are generated for the files there. See `docs/development-insights/tailwind-usage.md` for the full checklist.

## Testing Guidelines
We rely on Storybook interaction tests while formal test suites evolve. Add visual stories for every interactive component and cover edge cases with `play` functions. Co-locate future Jest/RTL specs as `Component.test.tsx` near their sources. Before submitting, run `npm run lint` and execute Storybook tests via `npx storybook test --watch` when altering UI logic. Document manual chessboard reproduction steps in the PR if automated coverage is missing.

## Commit & Pull Request Guidelines
Keep commits focused and imperative (e.g., `Add heatmap legend toggle`). Reference issue IDs when applicable. Pull requests need a summary, testing notes (commands run, Storybook checks), and screenshots or screen recordings for UI updates. Mention cross-browser or performance considerations when relevant, and ensure reviewers know which parts of the board evaluation logic changed.

## Branching & releases
See `docs/development-insights/branching-workflow.md` and `docs/plans/integration-verification.md`.

- **`main`** — live production source (Vercel deploy). Do not merge in-progress platform work here by default.
- **`cursor/dev-main-2440`** — integration/staging branch. **Default PR base** for feature and agent branches.
- Feature branches use `cursor/<descriptive-name>-2440` and merge into integration first; promote integration → `main` only when intentionally releasing.

## Security & Configuration Tips
Store Supabase keys and other secrets in `.env.local`; never commit them. Mirror any new environment variables in `PROJECT_PLAN.md` and team documentation. Validate that analytics or logging code guards against leaking PGN data before merging.

## Architecture Expectations
All development must follow modular, scalable architecture with strict separation of concerns. Code should not be placed into large, catch-all files or allowed to deteriorate into spaghetti structures. Each module or component should have a clearly defined responsibility, and coupling between unrelated parts of the system should be avoided. Maintainability, clarity, extensibility, and long-term soundness take priority over any fast workaround or short-term patch. When there is a choice between a quick implementation and a structurally correct solution, the more robust and reliable option should always be taken. Shortcuts that compromise future stability, readability, or adaptability should not be used.

## Heatmap Controls
- Centralise overlay state changes through `src/features/chessboard/state/heatmapSettingsContext.tsx` so the board, tray, and terminal stay aligned.
- Register new schemes or colour profiles via the respective registry files under `src/features/chessboard/overlays/` to make them available in the UI and terminal automatically.
- The in-app terminal supports `heatmap` commands (status, scheme set/list, sub-scheme set, colors set/list, include, check). Update the help output when behaviour changes.
