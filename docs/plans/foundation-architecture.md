# Foundation Architecture

**Status:** Active load-bearing layer  
**Vision:** `docs/project-visions/endgame.md`  
**Phase 0 plan:** `docs/plans/endgame-phase-zero.md`

This document describes the lowest-level stack Chessterra builds on for Endgame — structured so many game modes, matchmaking pools, rating leaderboards, and time controls can coexist without rewrites.

---

## Layer model (bottom → top)

```
┌─────────────────────────────────────────────────────────────┐
│  App routes (src/app/)           — pages, API, realtime     │
├─────────────────────────────────────────────────────────────┤
│  Features (src/features/)        — PlayBoard, clocks, queue UI│
├─────────────────────────────────────────────────────────────┤
│  Domain (src/domain/)            — rules, match, ratings    │
├─────────────────────────────────────────────────────────────┤
│  Platform (src/platform/)        — IDs, Result types        │
├─────────────────────────────────────────────────────────────┤
│  Chess engine adapter            — chess.js today, swappable │
└─────────────────────────────────────────────────────────────┘
```

**Rule:** UI never owns game rules. Domain never imports React.

---

## Platform (`src/platform/`)

| Module | Purpose |
|--------|---------|
| `ids.ts` | Branded ID types (`UserId`, `MatchId`, `GameModeId`, …) |
| `result.ts` | `Result<T, E>` for explicit error paths |

Prevents mixing identifiers across matchmaking, ratings, and storage.

---

## Domain — Play (`src/domain/play/`)

### Chess engine (`chess/`)

- `ChessEngine` interface — load FEN, legal moves, commit move, outcome
- `chessJsEngine.ts` — chess.js adapter (replaceable for server-side validation)

### Game modes (`game-mode/`)

Registry pattern — each mode is a `GameModeDefinition`:

| Field | Role |
|-------|------|
| `id` | Stable key (`endgame-standard`, `endgame-draft`, …) |
| `positionProvider` | `curated-pool`, `fixed-fen`, `draft-pool` |
| `supportedTimeControlIds` | Which clocks this mode allows |
| `ratingNamespace` | Prefix for rating buckets |
| `rated` | Whether ELO updates apply |

**Presets registered:** `endgame-standard`, `endgame-fixed`, `endgame-training`, `endgame-draft`

Add a mode = register definition + optional position provider. No changes to match reducer.

### Time controls (`time-control/`)

Registry of `TimeControlDefinition` + pure clock functions in `clock.ts`:

- `createMatchClock`, `tickClock`, `commitMoveClock`, `detectFlagFall`
- Presets: `bullet_1_0`, `blitz_3_2`, `rapid_10_0`, `unlimited`

### Ratings (`rating/`)

| Concept | Implementation |
|---------|----------------|
| Bucket key | `gameModeId::timeControlId[::subdivision]` |
| Algorithm | Glicko-2-inspired update in `glicko2.ts` (full Glicko-2 at scale) |
| Leaderboard | `leaderboard.ts` — sort, provisional filter |
| Provisional | First 20 games per bucket |

Each **game mode × time control × optional subdivision** gets its own leaderboard without schema changes.

### Matchmaking (`matchmaking/`)

| Concept | Implementation |
|---------|----------------|
| Pool key | `gameModeId::timeControlId::rated\|casual[::subdivision]` |
| Pairing | `pairing.ts` — rating window widens with wait time |
| Bot backfill | `shouldOfferBotBackfill` after `maxWaitMs` |

Queues are **per pool key** — draft mode and standard mode never share a queue.

### Match (`match/`)

Event-sourced reducer:

```
MATCH_CREATED → MATCH_STARTED → MOVE_COMMITTED* → (RESIGN | CLOCK_TICK | DRAW_ACCEPTED)
```

- `MatchSnapshot` — full serializable state for DB + realtime sync
- `reduceMatch(state, event)` — server and client can share logic

### Endgame-specific (`src/domain/endgame/`)

- `position.ts` — pool types, `pickRandomPosition`, filters by material/piece count
- Phase 0 uses JSON pool; Phase 1 migrates to Postgres

---

## Features — Board (`src/features/chessboard/`)

### Themes (`themes/`)

Registry of `BoardTheme` — classic, normalized, endgame-slate, endgame-midnight.

`CustomChessboard` accepts `themeId` for customizable appearance without forked components.

### Interaction (`interaction/`)

- `useBoardInteraction` — select square, legal move highlights, click-to-move
- Highlight kinds: selected, legal-move, last-move, check
- Works with existing drag (`usePieceDrag`) — tap vs drag distinguished in surface

### Animation (`animation/`)

- `useMoveAnimation` — FEN diff → last-move detection (foundation for slide animations)

### Play feature (`src/features/play/`)

- `PlayBoard` — wires engine + interaction + themed `CustomChessboard`
- Controlled or self-contained FEN state

---

## Extensibility recipes

### Add a new game mode

1. `registerGameMode({ id, … })` in `game-mode/presets.ts` or a new preset file
2. Wire position provider for that mode
3. UI lists modes via `listGameModes()`

### Add a new time control

1. `registerTimeControl({ id, initialMs, incrementMs, … })`
2. Add ID to mode's `supportedTimeControlIds`

### Add a sub-leaderboard (e.g. piece-tier-5)

1. Set `subdivision: 'piece-tier-5'` on `RatingBucketKey`
2. Only expose in UI when game count ≥ threshold (~500)

### Add a matchmaking queue

1. `MatchmakingPoolKey` = mode + time control + rated flag + optional subdivision
2. Queue service shards by `buildPoolKeyString(key)`

---

## Import bootstrap

Registering presets requires a side-effect import once at app entry:

```typescript
import '@/domain/play';           // game modes + time controls
import '@/features/chessboard/themes';  // board themes
```

`PlayBoard` and `CustomChessboard` import theme presets; game-mode presets load when `@/domain/play` is imported.

---

## What ships next (Phase 0)

See `docs/plans/endgame-phase-zero.md` and `docs/backlog/prd.json` stories `eg-001`–`eg-008`.

Foundation completes **eg-001** (domain scaffold) and board interaction baseline. Remaining Phase 0: position pool JSON, `/play` route, clock UI, bot.

---

## Verification

```bash
npm run lint
npm run build
npm run storybook   # Play/Foundation/PlayBoard
```

---

## Related

- `docs/project-visions/endgame.md`
- `docs/plans/endgame-phase-zero.md`
- `.cursor/goals.md`
