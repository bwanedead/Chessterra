# Universal Board Foundation

**Status:** Active load-bearing layer  
**Supersedes:** ad-hoc FEN + chess.js wiring in UI components  
**Consumers:** `UniversalBoard`, `PlayBoard`, future multiplayer sync, custom variants

---

## Design goal

One **elite, fluid playing board** where:

1. **State** is a mutable graph (nodes, edges, pieces, meta) — not hard-coded 8×8 arrays in React
2. **Rules** are pluggable rulesets with per-piece rule definitions
3. **Progression** uses minimal messages (`move`, `notation`, `patch`, `load`)
4. **Rendering** is a separate skin layer (themes, animations later) over a view model

```
ProgressMessage  →  BoardSession  →  BoardGraph  →  BoardViewModel  →  Renderer
                         ↑
                   RulesetDefinition (legal moves, apply, outcome)
```

---

## Layer map

| Path | Responsibility |
|------|----------------|
| `src/domain/board-core/` | Graph, topology, patches, FEN codec |
| `src/domain/board-rules/` | Ruleset + piece rule registry |
| `src/domain/board-session/` | Session, messages, view model |
| `src/features/board/` | `UniversalBoard`, `useBoardSession` |
| `src/features/chessboard/` | Renderer (CustomChessboard, themes, drag) |

**Domain never imports React.**

---

## Board graph (canonical state)

```typescript
BoardGraph {
  topologyId      // e.g. 'grid-8x8'
  nodes           // squares/cells — id, coords, tags, attrs
  edges           // adjacency, lines, jumps — for custom topologies
  pieces          // piece instances — kind, owner, nodeId, attrs
  occupancy       // nodeId → pieceId
  meta            // turn, castling, en passant, custom flags
}
```

### Why a graph?

- **Custom topologies** — hex, larger boards, sparse graphs
- **Novel pieces** — register `PieceRuleDefinition` with movement profiles
- **Per-piece attrs** — direction, cooldown, charges in `piece.attrs`
- **Arbitrary patches** — place/remove/move without a full rules engine round-trip

---

## Progression messages (minimal wire format)

| Message | Payload | Use |
|---------|---------|-----|
| `load` | full `BoardSnapshot` | init, reconnect, spectate join |
| `move` | `{ from, to, promotion? }` | primary gameplay |
| `notation` | `{ value, codec?: 'san' }` | compact replay / PGN step |
| `patch` | `BoardPatch[]` | editor, custom abilities, setup |
| `set-meta` | `{ key, value }` | turn flags without piece movement |

Example multiplayer frame:

```json
{ "type": "move", "from": "e2", "to": "e4" }
```

Server validates via same `RulesetDefinition.applyMove` as client.

---

## Rulesets

```typescript
RulesetDefinition {
  id, topologyId, turnOrder
  pieceRules: Record<PieceKind, PieceRuleDefinition>
  createInitial(config)
  normalizeSnapshot(snapshot)
  getActivePlayer(graph)
  legalMoves(graph, fromNodeId?)
  applyMove(graph, intent)
  applyNotation?(graph, san)
}
```

**Registered:** `standard-fide` (chess.js adapter, graph synced from FEN)

### Adding a custom piece (future)

1. Register `PieceRuleDefinition` with `kind: 'archbishop'`
2. Register ruleset referencing new piece kinds
3. Implement movement in ruleset or plug-in generator (not in renderer)

---

## Board session

```typescript
const session = createBoardSession({ rulesetId: 'standard-fide', fen });
session.apply({ type: 'move', from: 'e2', to: 'e4' });
const vm = buildBoardViewModel(session.getState());
```

- Append-only `history` of messages + applied moves
- `revision` increments for React `useSyncExternalStore`
- `outcome` terminal flag blocks further moves

---

## View model → renderer

`BoardViewModel` is renderer-agnostic:

- `cells[]` with piece descriptors
- `legalTargetsByFrom` for interaction
- `fen` codec cache for existing `CustomChessboard`
- `lastMove`, `activePlayer`, `terminal`

Future: swap `CustomChessboard` for WebGL/canvas skin without touching session.

---

## Extension roadmap

| Phase | Work |
|-------|------|
| Now | Graph + standard-fide + UniversalBoard |
| Next | Custom ruleset stub + patch-only setup position |
| Later | Per-piece movement plugins, non-grid topology |
| Later | Skin pipeline (sprites, animation curves) |
| Later | Network sync = stream of `ProgressMessage` |

---

## Usage

```tsx
import { UniversalBoard } from '@/features/board';

<UniversalBoard
  rulesetId="standard-fide"
  fen={DEV_START_FEN}
  boardSize={480}
  playerColor="w"
  themeId="endgame-slate"
  onProgress={({ message, fen, lastMove }) => { /* sync, bot, clock */ }}
/>
```

Programmatic advance:

```typescript
session.apply({ type: 'notation', value: 'Nf3', codec: 'san' });
session.apply({ type: 'patch', patches: [{ op: 'place-piece', piece: { ... } }] });
```

---

## Related

- `docs/plans/foundation-architecture.md` — matchmaking, ratings, modes
- `docs/plans/endgame-phase-zero.md` — Phase 0 play loop
- `src/domain/endgame/devPosition.ts` — stable dev FEN
