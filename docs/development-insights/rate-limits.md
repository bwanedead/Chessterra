# Match API rate limits

Abuse guards on the match endpoints. Implemented in `src/server/security/`.

## Current limits (per actor, sliding window)

| Action | Limit | Window | Notes |
|--------|-------|--------|-------|
| create | 10 | 5 min | Also limited per IP (30 / 5 min) because guest ids are client-chosen |
| join | 20 | 5 min | |
| move | 120 | 1 min | 2/s sustained — covers bullet bursts, blocks engine floods |
| resign | 10 | 1 min | |

Responses over the limit return **429** with `{ error, code: "rate_limited" }` and a
`Retry-After` header (seconds). The client maps this to friendly copy via
`describeMatchError`.

## Guest mode notes

- Guests are keyed by their `guest-*` id for all per-actor budgets.
- Because a script can rotate guest ids freely, **match creation is additionally
  keyed by client IP** (`x-forwarded-for` first hop on Vercel).
- Rated play already requires a signed-in account, so rating writes cannot be
  reached from guest spam at all.

## Production caveats

The limiter is **in-memory per server instance**. On Vercel serverless this
means each warm instance keeps its own counters:

- Good enough for: tight client loops, buggy retry storms, casual scripted spam.
- Not sufficient for: distributed attacks or precise global quotas.

Production upgrades, in order of preference:

1. **Vercel WAF rate-limit rules** on `/api/matches/*` (no code change).
2. Shared store limiter (Upstash Redis / Vercel KV) behind the same
   `checkRateLimit` interface if product-level quotas become necessary.

GET endpoints (snapshot fetch, history, events) are intentionally uncapped in
code for now — the polling fallback legitimately calls every 1.5 s; platform
protection covers pathological cases.
