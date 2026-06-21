# Endgame — Product Vision

**Status:** North star (active pursuit)  
**Working name:** Endgame (may rebrand)  
**Parent product:** Chessterra evolves from chess analytics into a competitive endgame platform while retaining and improving heatmap-driven study tools.

---

## One-line pitch

A browser-based, rated 1v1 game where every match starts in the endgame — standard chess rules, high decision density, deep skill ceiling, and analytics that help players actually improve.

---

## Why this exists

### Player problem
- Competitive chess in the browser (Chess.com, Lichess) is excellent but opening-prep heavy; many casual competitors never reach satisfying endgame practice in live games.
- Steam/PC skill games have high friction; browser-first removes install barriers.
- Endgame study is traditionally puzzle-based and passive — this makes endgame **play** the main loop.

### Product opportunity
- Draws the existing chess enthusiast audience (rules are familiar; improvement transfers to full chess).
- Unique positioning: **the entire game is the endgame** — not a mode inside traditional chess.
- Chessterra's heatmap analytics and normalized board aesthetic become differentiators for post-game study and spatial intuition, not clones of wood-and-felt Chess.com.

### Design thesis
Endgames exaggerate positional truths (king activity, space, piece coordination) because there are fewer pieces. Starting in the endgame makes those lessons immediate and repeatable. The product should feel like a **student of the game** playground: many sub-skills, natural improvement ramp, optional depth forever.

---

## Experience pillars

| Pillar | What it means |
|--------|----------------|
| **Instant play** | Open browser → find game → play. No client, no account required for first touch (Phase 0). |
| **Fair starts** | Every position is engine-validated as practically equal before it enters the pool. |
| **Rated growth** | Skill measurement per time control (later: per material class). Glicko-2, not vanity numbers. |
| **Study loop** | Post-game replay with heatmaps, move critique, and optional engine line — analytics are part of the game, not a separate product. |
| **Spatial identity** | Normalized/wireframe board aesthetic optional; player-oriented rotation; future canvas mode for immersive review. |
| **Modular variants** | Core rated pool first; fixed hero positions, draft, and bans are layered later without rewriting core architecture. |

---

## What is in scope (rules)

- **Standard FIDE chess rules** applied from a custom starting FEN (castling rights, en passant, promotion all preserved).
- **No variant rules in v1** (no cylindrical board, no custom promotion directions, no draft).
- **Position source:** curated pool only — never runtime-random unvalidated FENs in rated play.

---

## What is explicitly later

| Feature | Phase | Notes |
|---------|-------|-------|
| Draft pieces + squares | 3+ | Requires ban/pick anti-meta; separate queue |
| Per-arrangement ELO | 2+ | Only when bucket has enough games (~500+) |
| Time bank beyond increment | 2+ | Marketing differentiator, not validation blocker |
| True 360° / symmetric rules | — | Different game; use visual identity instead |
| Tournaments / teams / chat | 3+ | After core loop proven |

---

## Game modes (phased)

### Phase 0 — Local validation (no accounts)
- Play vs Stockfish from a curated position pool.
- Clock UI (local).
- Win/loss/draw flow.
- Route: `/play` or `/endgame` (TBD).

### Phase 1 — Competitive core
- Auth (Supabase).
- Invite-link or simple queue matchmaking.
- Server-authoritative game state and move validation.
- One global rating per time control (e.g. Blitz 3+2).
- Position assigned at game start from pool.

### Phase 2 — Matchmaking + study
- Skill-based pairing (rating window widens over wait time).
- Profiles, game history, rematch.
- Post-game heatmap replay (reuse Chessterra overlay stack).
- Featured fixed position (weekly).
- Sub-ratings by piece-count tier when pools are large enough.

### Phase 3 — Variants
- Draft + ban queues (approved pools only).
- Training mode: "grind KQ vs KR."
- Puzzles generated from pool positions.

---

## Position fairness (load-bearing)

Positions are **curated offline**, not generated at match time.

### Pipeline

```
Sources → Filter → Engine eval → Tablebase check → Tag → Spot-check → Publish
```

### Sources
- Lichess game database (positions at move N in games).
- Syzygy tablebase draws and "practically equal" positions.
- Constrained random generation with material templates.

### Filters (hard gates)
- Total piece count (including kings) within band, e.g. 4–7 for v1.
- `|eval| ≤ 0.25` pawns at depth ≥ 30 (Stockfish).
- No forced mate in ≤ 3 for either side (tablebase).
- Both sides have legal moves; game not already dead by rule unless category intends it.

### Tags (metadata per position)
- `materialSignature` — e.g. `KQ-KR`, `KR-K`, `KPP-KP`
- `pieceCount`
- `evalCp`, `evalDepth`, `engineVersion`
- `source`, `playedCount`, `resultStats` (updated from live games)

### Storage
- Postgres table `position_pool` (see domain model below).
- Batch refresh via `scripts/curate-positions/` (Node + Stockfish CLI or WASM).

---

## Rating model

- **Algorithm:** Glicko-2 (handles low game count and inactivity better than plain Elo).
- **Launch:** One rating per time control preset (`blitz_3_2`, etc.).
- **Provisional:** First ~20 games; wide RD; hidden or marked provisional in UI.
- **Phase 2 sub-ratings:** `piece_tier_4`, `piece_tier_5`, or material class — only when statistically viable.
- **Never:** Per-position ELO at launch (fragmentation kills queues).

---

## Time controls

| Phase | Controls |
|-------|----------|
| v1 | Fischer: base + increment (3+2 blitz primary) |
| v2 | Additional presets (5+3 rapid, 1+0 bullet) |
| v3 | Optional time bank (reserve seconds usable on critical moves) |

Server owns clock state; client displays authoritative remaining time.

---

## Architecture (technical constitution)

### Principles
1. **Server owns game truth** — clients send move intents; server validates with `chess.js` (or server-side equivalent) and persists state.
2. **Domain-first** — game, match, position, and rating logic live in `src/domain/endgame/`, not in React components.
3. **Reuse board stack** — `CustomChessboard`, heatmap overlays, and timeline hooks are shared between analytics and live play.
4. **Registry patterns** — new position categories, time controls, and overlay schemes register via existing registry files; no central god files.
5. **Feature flags** — draft mode and sub-ratings ship behind flags until pools exist.

### High-level diagram

```
Browser                    API / Realtime              Offline jobs
───────                    ──────────────              ────────────
Board + Clock UI    →      Game room (moves, clock)    Stockfish batch
Matchmaking UI      →      Matchmaking service    →    Position curation
Post-game heatmap   →      Postgres (games, pool,      Syzygy verify
                           ratings, users)
```

### Module layout (target)

```
src/
  domain/
    endgame/
      position.ts       # PositionPoolEntry, MaterialSignature, filters
      match.ts          # Match, GameState, Clock, Result, MoveRecord
      rating.ts         # Glicko-2 update, TimeControlPreset
      matchmaking.ts    # Queue rules, pairing window
  features/
    endgame/
      components/       # Clock, MatchmakingPanel, ResultModal, PositionBanner
      hooks/            # useGameRoom, useClock, useMatchmaking
      state/            # gameRoomContext
    chessboard/         # (existing) shared board + heatmap
  app/
    play/               # Live game route
    api/
      games/[id]/move/
      matchmaking/
  scripts/
    curate-positions/   # Batch pipeline
```

### Data model (sketch)

```typescript
// position_pool
{
  id: uuid
  fen: string
  materialSignature: string   // "KQ-KR"
  pieceCount: number
  evalCp: number
  evalDepth: number
  tags: string[]
  active: boolean
}

// games
{
  id: uuid
  positionId: uuid
  whiteUserId, blackUserId
  timeControl: string
  status: 'active' | 'completed' | 'aborted'
  result: '1-0' | '0-1' | '1/2-1/2' | null
  pgn: string
  startedAt, endedAt
}

// moves (append-only)
{
  gameId, ply, san, fen, clockWhiteMs, clockBlackMs, createdAt
}

// ratings (glicko)
{
  userId, timeControl, rating, rd, volatility, gamesPlayed, updatedAt
}
```

### Realtime options
- **MVP:** Supabase Realtime channels per game room.
- **Scale:** Dedicated WebSocket service or Liveblocks/Partykit if Supabase limits hit.

### Security
- Rate-limit move endpoints.
- Never trust client FEN; server replays from move list.
- Engine-move correlation monitoring (Phase 2+, same class of problem as Lichess).

---

## Relationship to heatmap analytics

Heatmaps are not deprecated — they become the **study layer** of Endgame.

| Context | Heatmap role |
|---------|----------------|
| Post-game replay | Scrub moves with influence overlays; compare player move vs engine top line |
| Pre-game warmup | Optional "position briefing" for featured positions |
| Training mode | Highlight king activity, weak squares for current material class |
| Brand | Normalized board + wireframe pieces = distinct from Chess.com aesthetic |

Implementation: post-game view reuses `heatmapSettingsContext`, overlay registries, and timeline from `src/domain/game/timeline.ts`. Do not fork overlay logic for live play.

---

## Visual / spatial identity

- **Player-oriented board:** Each player sees their pieces at the bottom (standard chess UX).
- **Normalized mode:** Optional analytical skin (existing Chessterra canvas direction).
- **Do not** change promotion direction or ranks in v1 — that is a different game.

Reference: `docs/project-visions/normalized-board-phase-two.md` for canvas expansion; Endgame live play can adopt expanded canvas for post-game review first.

---

## Success metrics

| Phase | Signal |
|-------|--------|
| 0 | Testers play 5+ games vs bot in one sitting; request rematch |
| 1 | Two humans complete rated game; <1% move disputes; clock sync within 200ms |
| 2 | Median queue wait < 30s at prime time (or bot backfill invisible) |
| 3 | Draft queue retention within 20% of standard queue |

---

## Risks

| Risk | Mitigation |
|------|------------|
| Uneven positions | Strict curation pipeline; disable positions with bad live stats |
| Empty queues | Bot backfill; invite-link first; single time control |
| Scope creep (draft, 360 rules) | Phase gates in `docs/backlog/prd.json`; `/goal` skill enforces active phase |
| Rating inflation | Glicko-2 + provisional period |
| Chessterra identity drift | This doc + `AGENTS.md` anchor; analytics remain first-class |

---

## Related documents

- **Execution (Phase 0):** `docs/plans/endgame-phase-zero.md`
- **Backlog:** `docs/backlog/prd.json`
- **Session state:** `docs/progress.md`, `.cursor/goals.md`
- **Canvas / aesthetic:** `docs/project-visions/normalized-board-phase-two.md`
- **Heatmap implementation:** `docs/development-insights/heatmap-overlays.md`

---

## Open decisions

1. **Brand:** Chessterra `/play` vs standalone `endgame.*` domain — decide before public launch.
2. **First opponent:** Bot-first (Phase 0) validates positions before human queue investment.
3. **Hero position:** Whether to ship one canonical "signature" position alongside random pool for marketing.

Track resolutions in `.cursor/goals.md` → Decisions section.
