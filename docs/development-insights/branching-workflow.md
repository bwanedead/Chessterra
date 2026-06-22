# Branching Workflow

This project uses a simple production/integration split so agents can continue building platform infrastructure without immediately changing the live site.

## Branch roles

- `main` is the live production source branch. Treat it as stable and release-bound.
- `cursor/dev-main-2440` is the shared integration branch for staging in-progress work.
- `cursor/<descriptive-name>-2440` branches are feature or agent work branches.

## Default flow

1. Start new non-production work from the intended integration base:
   ```bash
   git fetch origin cursor/dev-main-2440
   git checkout -b cursor/<descriptive-name>-2440 origin/cursor/dev-main-2440
   ```
2. Commit and push the feature branch:
   ```bash
   git push -u origin cursor/<descriptive-name>-2440
   ```
3. Open or update the PR with base branch `cursor/dev-main-2440`.
4. Run the usual validation for the change, at minimum `npm run lint` and `npm run build` when code changes affect the app.
5. Merge into `cursor/dev-main-2440` only after review/sanity checks.
6. Promote `cursor/dev-main-2440` to `main` only when the user intentionally wants a production release.

## Existing stacked PRs

Some older agent branches may already be open against `main`. Retargeting their PR base to `cursor/dev-main-2440` is safe when:

- the branch has not already been merged into `main`;
- the integration branch was created from current `main`;
- the PR is still intended as pre-production work.

Retargeting a PR does not rewrite the feature branch or remove the other agent's commits. It only changes where GitHub proposes to merge the branch. If an agent is still actively working, leave a note in the PR or continue from the same branch base so the next agent can see the updated target.

## Production fixes

For urgent production fixes, branch from `main`, use the normal `cursor/<descriptive-name>-2440` name, and target the PR at `main`. After release, back-merge or cherry-pick the fix into `cursor/dev-main-2440` so integration does not drift.

## Why this exists

The live hosting source follows `main`, while platform/auth/realtime work can be large and iterative. Keeping `cursor/dev-main-2440` as the integration branch gives the project a stable place to combine agent work, run deployment previews, and test without accidentally shipping unfinished infrastructure.
