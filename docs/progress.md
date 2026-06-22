# Agent & Team Progress

**Integration checklist:** `docs/plans/integration-verification.md`  
**Goal ledger:** `.cursor/goals.md`

---

## Current focus

**Phase 6 — integration preview E2E** (blocked on Vercel Supabase env)

---

## Last session

**Date:** 2026-06-21  
**Work:**
- Fixed branch policy docs: `cursor/<name>-2440` (was stale `-117d`)
- Typed `MatchServiceError` codes; API returns `{ error, code }` with stable HTTP mapping
- Atomic match persistence: `commit_match_update` Supabase RPC + `repository.commit()`
- `planRatedMatchCompletion` — rating events in same commit; rating rows saved after
- Noted PR #11 superseded in branching-workflow.md

**Evidence:** `npm run lint` exit 0; `npm run build` blocked by Google Fonts fetch (env network, not code)

**Blocker:** GitHub push failing (`Recv failure: Connection reset by peer`) after 4× retry. **Unpushed commits on `cursor/dev-main-2440`:**

- `1879993` Cross-reference push requirement in branching workflow doc
- `2871233` Require regular git push in AGENTS.md for multi-agent review
- `f610bdd` Harden platform commit boundaries (already on remote platform-fixes; dev-main includes it)

**Manual push required:**

```bash
git push origin cursor/platform-fixes-2440 cursor/dev-main-2440
```

**Next:** Configure Vercel preview env; run E2E checklist; close PR #11 if still open

---

## Phase checklist

### Phase 1 code
- [x] eg-105 platform hardening + atomic commit + typed errors

### Phase 6 (ops)
- [ ] Vercel Supabase env on integration preview
- [ ] Apply migrations including `commit_match_update` RPC
- [ ] Two-user invite game E2E
- [ ] Close PR #11 (superseded)
