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

**Next:** Push `cursor/platform-fixes-2440` and merge to `cursor/dev-main-2440`; close PR #11; configure Vercel preview env; run E2E checklist

---

## Phase checklist

### Phase 1 code
- [x] eg-105 platform hardening + atomic commit + typed errors

### Phase 6 (ops)
- [ ] Vercel Supabase env on integration preview
- [ ] Apply migrations including `commit_match_update` RPC
- [ ] Two-user invite game E2E
- [ ] Close PR #11 (superseded)
