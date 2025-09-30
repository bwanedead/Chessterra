# Repository Guidelines

## Project Structure & Module Organization
Chessterra is a Next.js (app router) workspace. UI routes, layouts, and server actions live in `src/app`, shared UI elements in `src/components`, and chess utilities in `src/lib`. Storybook-ready UI examples live beside components under `src/stories`, while exploratory scenarios sit in the top-level `stories/`. Static assets and icons belong in `public/`, and `.storybook/` hosts Storybook configuration. Review `PROJECT_PLAN.md` for roadmap context before planning sizeable changes.

## Build, Test, and Development Commands
- `npm install` � install dependencies; rerun after pulling new packages.
- `npm run dev` � launch the local app at `http://localhost:3001` with hot reloading.
- `npm run build` � production build verification; fix build warnings before deployment.
- `npm start` � serve the built app locally.
- `npm run lint` � run the Next.js ESLint suite; must be clean before shipping.
- `npm run storybook` � open component sandbox on port 6006 for visual QA.
- `npm run build-storybook` � generate the static Storybook bundle for previews.

## Coding Style & Naming Conventions
Use TypeScript with strict, explicit typing for shared utilities. Follow ESLint�s `next/core-web-vitals` guidance and keep indentation at two spaces. Favor React function components, hooks over classes, and descriptive prop names (`selectedSquare`, `heatmapMode`). Prefer Tailwind utility classes; limit module CSS to layout edge cases. Name files in kebab-case for routes (`move-history`), PascalCase for components, and camelCase for helpers.

## Testing Guidelines
We rely on Storybook interaction tests while formal test suites evolve. Add visual stories for every interactive component and cover edge cases with `play` functions. Co-locate future Jest/RTL specs as `Component.test.tsx` near their sources. Before submitting, run `npm run lint` and execute Storybook tests via `npx storybook test --watch` when altering UI logic. Document manual chessboard reproduction steps in the PR if automated coverage is missing.

## Commit & Pull Request Guidelines
Keep commits focused and imperative (e.g., `Add heatmap legend toggle`). Reference issue IDs when applicable. Pull requests need a summary, testing notes (commands run, Storybook checks), and screenshots or screen recordings for UI updates. Mention cross-browser or performance considerations when relevant, and ensure reviewers know which parts of the board evaluation logic changed.

## Security & Configuration Tips
Store Supabase keys and other secrets in `.env.local`; never commit them. Mirror any new environment variables in `PROJECT_PLAN.md` and team documentation. Validate that analytics or logging code guards against leaking PGN data before merging.

## Architecture Expectations
All development must follow modular, scalable architecture with strict separation of concerns. Code should not be placed into large, catch-all files or allowed to deteriorate into spaghetti structures. Each module or component should have a clearly defined responsibility, and coupling between unrelated parts of the system should be avoided. Maintainability, clarity, extensibility, and long-term soundness take priority over any fast workaround or short-term patch. When there is a choice between a quick implementation and a structurally correct solution, the more robust and reliable option should always be taken. Shortcuts that compromise future stability, readability, or adaptability should not be used.