# Agent & Team Progress

**Integration checklist:** `docs/plans/integration-verification.md`  
**Goal ledger:** `.cursor/goals.md`

---

## Current focus

**Merge foundation-hardening PR stack, then Phase 6 integration preview E2E** (still blocked on Vercel Supabase env)

---

## Last session

**Date:** 2026-07-12  
**Work:**
- Next.js 15.2.1 → 15.2.9 security patch (React2Shell CVEs) — merged (#15)
- Phase A/B verification tooling + match service tests — merged (#14)
- Phase D reconnect resilience: realtime health → poll fallback, resync on reconnect/focus/online, 409 recovery, `MatchApiError` codes, friendly error copy, connection badge — PR #16
- Phase E match history: `toMatchHistoryEntry`, `listCompletedForUser`, `GET /api/me/matches`, `/history` page, nav link — PR #17
- Phase F observability: structured match API logs (no FEN/PGN), safe 500s, participant-scoped `GET /api/matches/:id/events` replay — PR #18
- Phase G rate limits: create/join/move/resign throttled, guest-IP guard on create, `docs/development-insights/rate-limits.md` — PR #19

**Evidence:** `npm run test` 32 passed; `npm run lint` exit 0; `npm run build` exit 0 (all on tip of stack)

**PR stack (merge in order into `cursor/dev-main-2440`):**
1. #16 `cursor/reconnect-polish-2440`
2. #17 `cursor/match-history-2440` (stacked on #16)
3. #18 `cursor/observability-2440` (stacked on #17)
4. #19 `cursor/rate-limits-2440` (stacked on #18; includes docs/backlog updates)

**Next:** Merge stack → configure Vercel preview Supabase env → run full E2E checklist including new reconnect checks → then promote to `main` when green

---

## Phase checklist

### Phase 1 code
- [x] eg-105 platform hardening + atomic commit + typed errors
- [x] eg-106 reconnect resilience (PR #16)
- [x] eg-107 match history (PR #17)
- [x] eg-108 observability + replay (PR #18)
- [x] eg-109 rate limits (PR #19)

### Phase 6 (ops — human)
- [ ] Merge PRs #16–#19
- [ ] Vercel Supabase env on integration preview
- [ ] Apply migrations including `commit_match_update` RPC
- [ ] Two-user invite game E2E + reconnect checks
- [ ] Promote integration → `main` when checklist green

### Blocked (do not start)
- Matchmaking (eg-201) — after eg-105b passes and queue design planned
- Stripe, big UI expansion
