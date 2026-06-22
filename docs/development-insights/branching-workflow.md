# Branching workflow

Chessterra uses a two-tier integration model so **live production** stays stable while platform work lands on a shared staging branch.

## Branches

| Branch | Role |
|--------|------|
| `main` | **Live production** — what Vercel/hosting deploys. Merge here only when intentionally releasing. |
| `cursor/dev-main-2440` | **Integration / staging** — shared branch for in-progress platform work. Default PR target for feature and agent branches. |
| `cursor/<descriptive-name>-2440` | Short-lived agent or feature branches. Branch from integration (or `main` if integration is behind), merge back into integration. |

## Flow

```
cursor/<descriptive-name>-2440  →  cursor/dev-main-2440  →  main (release)
```

1. Create feature branch from latest `cursor/dev-main-2440` (or `main` if integration has not caught up).
2. Open PRs against **`cursor/dev-main-2440`**, not `main`.
3. Verify on integration: `npm run lint`, `npm run build`, manual smoke tests.
4. Promote integration → `main` only after intentional release review.

## Production hotfixes

- Branch from `main`, fix, merge to `main`.
- Back-merge or cherry-pick into `cursor/dev-main-2440` so integration does not drift.

## Agent defaults

- **Never** target `main` for platform/auth/match work unless explicitly releasing.
- The historical stacked platform PRs were merged into integration in order: **#8 → #9 → #10 → #12**.
- PR #11 is superseded by the integration branch copy of this workflow and should remain closed/ignored rather than merged.
- Verification checklist: `docs/plans/integration-verification.md`
- Record session outcomes in `.cursor/goals.md` and `docs/progress.md`.

## Future naming

A permanent name like `develop` or `staging` is preferable long-term. Until renamed, use `cursor/dev-main-2440` as the integration branch of record.
