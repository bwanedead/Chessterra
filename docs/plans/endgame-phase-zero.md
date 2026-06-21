# Endgame Phase 0 — Local Play Validation

**Objective:** Prove the core loop is fun — play from a **stable dev endgame position** vs a bot, with a working clock and standard chess rules — before investing in multiplayer, auth, ratings, or a curated position pool.

**Vision reference:** `docs/project-visions/endgame.md`  
**Backlog:** `docs/backlog/prd.json` (stories `eg-001` … `eg-008`)

---

## Definition of done (phase)

- [ ] User opens `/play` and starts from the stable dev FEN (`DEV_START_FEN` in `src/domain/endgame/devPosition.ts`).
- [ ] User plays vs Stockfish (browser WASM or API) with legal move validation via `chess.js`.
- [ ] Clock counts down on the active side; flag fall ends the game.
- [ ] Game ends correctly on checkmate, stalemate, draw rules, resignation, flag.
- [ ] `npm run lint` and `npm run build` clean.
- [ ] Storybook story covers play shell in at least one position.
- [ ] `docs/progress.md` updated with evidence.

**Deferred to end of Phase 0 / pre-Phase 1:** curated position pool (`eg-002`).

---

## Architecture (Phase 0 only)

Keep scope minimal; structure for Phase 1 extension.

```
src/
  domain/endgame/
    devPosition.ts       # DEV_START_FEN — stable position until pool exists
    position.ts          # Pool types (used when eg-002 ships)
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
    position-pool.json   # (later) Curated FENs — not required for initial build
```

### Boundaries
- **No Supabase** in Phase 0.
- **No ratings.**
- **No matchmaking** — bot only.
- **No position pool required** for first playable slice — fixed `DEV_START_FEN`.
- Board UI: reuse `PlayBoard` / `CustomChessboard` from `src/features/chessboard/`.

### Stable dev position
- `DEV_START_FEN` in `src/domain/endgame/devPosition.ts`
- Default: `6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1` (pawn endgame)
- Rematch resets to same FEN until pool exists

### Position pool (deferred — `eg-002`, last in Phase 0)
- JSON file or Postgres — not blocking play loop
- Each entry: `{ id, fen, materialSignature, pieceCount, note? }`
- Phase 1 may migrate to Postgres + curation script

### Bot
- Preferred: Stockfish WASM in Web Worker (`stockfish.wasm` or `stockfish.js`).
- Fallback for first slice: random legal move or `chess.js` greedy — replace before calling Phase 0 done.

### Clock
- Default: 3+2 (3 minutes + 2 second increment per move).
- Clock pauses on game end; increment applied on move commit locally for Phase 0.

---

## Implementation steps (priority order)

### Step 1 — Domain scaffold (`eg-001`) ✅
- Done via foundation + `src/domain/endgame/`

### Step 2 — Play route shell (`eg-003`) ← **next**
- `src/app/play/page.tsx` with `PlayShell` layout.
- Wire `PlayBoard` with `DEV_START_FEN`.
- Legal moves via chess engine.

### Step 3 — Clock UI (`eg-004`)
- `GameClock` component; active side highlight; flag fall → loss on time.

### Step 4 — Bot opponent (`eg-005`)
- Stockfish worker or staged bot; move after human move with short delay.

### Step 5 — Game end + rematch (`eg-006`)
- Result modal: outcome, reason, rematch (same `DEV_START_FEN` for now).

### Step 6 — Storybook + QA (`eg-007`)
- Story: PlayShell with board + clocks.

### Step 7 — Navigation entry (`eg-008`)
- Link from home or header to `/play`.

### Step 8 — Position pool (`eg-002`) — **last**
- Add `src/data/position-pool.json` when play loop is solid.
- Swap rematch to `pickRandomPosition()` — no other changes if domain boundary is respected.

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

- `position-pool.json` → `position_pool` table + API (eg-002).
- `PlayShell` → add matchmaking panel slot (empty in Phase 0).

---

## Open questions

- Stockfish WASM bundle size vs server-side bot for Phase 0?
- Should `/play` use heatmap board or standard board default? (Proposal: standard for play; heatmap in post-game Phase 2.)
