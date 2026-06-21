# Endgame Phase 0 — Local Play Validation

**Objective:** Prove the core loop is fun — play from curated endgame positions vs a bot, with a working clock and standard chess rules — before investing in multiplayer, auth, or ratings.

**Vision reference:** `docs/project-visions/endgame.md`  
**Backlog:** `docs/backlog/prd.json` (stories `eg-001` … `eg-008`)

---

## Definition of done (phase)

- [ ] User opens `/play` and receives a random position from a static curated pool (≥ 50 positions for dev; target 200+ before Phase 1).
- [ ] User plays vs Stockfish (browser WASM or API) with legal move validation via `chess.js`.
- [ ] Clock counts down on the active side; flag fall ends the game.
- [ ] Game ends correctly on checkmate, stalemate, draw rules, resignation, flag.
- [ ] `npm run lint` and `npm run build` clean.
- [ ] Storybook story covers play shell in at least one position.
- [ ] `docs/progress.md` updated with evidence.

---

## Architecture (Phase 0 only)

Keep scope minimal; structure for Phase 1 extension.

```
src/
  domain/endgame/
    position.ts          # PoolEntry type, loadPool(), pickRandom()
    match.ts             # LocalMatch state machine (no network)
    clock.ts             # Clock tick logic (pure functions)
  features/endgame/
    components/
      PlayShell.tsx      # Layout: board + clock + result
      GameClock.tsx      # Display + low-time styling
      BotOpponent.tsx    # Stockfish worker hookup (or stub delay for v0)
    hooks/
      useLocalMatch.ts   # FEN, moves, turn, result
      useGameClock.ts    # Interval, flag detection
  app/play/
    page.tsx             # Route entry
  data/
    position-pool.json   # Curated FENs + metadata (until DB)
```

### Boundaries
- **No Supabase** in Phase 0.
- **No ratings.**
- **No matchmaking** — bot only.
- Board UI: reuse `CustomChessboard` from `src/features/chessboard/`.

### Position pool (interim)
- JSON file checked into repo for Phase 0.
- Each entry: `{ id, fen, materialSignature, pieceCount, note? }`.
- Phase 1 migrates to Postgres + curation script.

### Bot
- Preferred: Stockfish WASM in Web Worker (`stockfish.wasm` or `stockfish.js`).
- Fallback for first slice: random legal move or `chess.js` greedy — replace before calling Phase 0 done.

### Clock
- Default: 3+2 (3 minutes + 2 second increment per move).
- Clock pauses on game end; increment applied on move commit server-side pattern (apply on move locally for Phase 0).

---

## Implementation steps

### Step 1 — Domain scaffold (`eg-001`)
- Create `src/domain/endgame/position.ts`, `match.ts`, `clock.ts`.
- Types: `PositionPoolEntry`, `LocalMatch`, `MatchResult`, `ClockState`.
- Unit-testable pure functions for clock tick and flag detection.

### Step 2 — Position pool (`eg-002`)
- Add `src/data/position-pool.json` with ≥ 50 validated FENs (manual + engine-checked subset).
- `pickRandomPosition(pool, excludeIds?)` in domain layer.

### Step 3 — Play route shell (`eg-003`)
- `src/app/play/page.tsx` with `PlayShell` layout.
- Wire `useLocalMatch` + `CustomChessboard`.
- New game → random position → white to move (or respect FEN side).

### Step 4 — Clock UI (`eg-004`)
- `GameClock` component; active side highlight; flag fall → loss on time.

### Step 5 — Bot opponent (`eg-005`)
- Stockfish worker or staged bot; move after human move with short delay.
- Bot plays correct side automatically.

### Step 6 — Game end + rematch (`eg-006`)
- Result modal: outcome, reason, rematch button (new random position).
- Optional: link to analytics view with same FEN (future).

### Step 7 — Storybook + QA (`eg-007`)
- Story: midgame position loaded, clocks visible.
- Manual repro steps in PR.

### Step 8 — Navigation entry (`eg-008`)
- Link from home or header to `/play` (minimal, no redesign).

---

## Verification commands

```bash
npm run lint
npm run build
npm run storybook   # visual check PlayShell story
```

Manual: play 3 complete games — win, loss, draw or flag.

---

## Extension points (do not build yet)

- `domain/endgame/match.ts` → later `ServerMatch` with same event shape.
- `position-pool.json` → `position_pool` table + API.
- `PlayShell` → add matchmaking panel slot (empty in Phase 0).

---

## Open questions

- Stockfish WASM bundle size vs server-side bot for Phase 0?
- Should `/play` use heatmap board or standard board default? (Proposal: standard for play; heatmap in post-game Phase 2.)
