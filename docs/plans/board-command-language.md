# Board Command Language

**Status:** Active — agent + human editable board  
**Route:** `/board-lab`  
**Code:** `src/domain/board-commands/`, `src/domain/board-config/`, `src/features/board/EditableBoard`

---

## Purpose

Let humans and **agents** design game variants by:

1. **CLI commands** — edit graph, meta, pieces, play moves
2. **`BoardVariantConfig` JSON** — single-shot variant from natural language → agent → `config apply`
3. **Raw patches** — maximum flexibility for novel rules

The board renderer stays dumb; all truth lives in `BoardGraph` + `BoardSession`.

---

## Command reference

| Command | Example |
|---------|---------|
| `help` | `help` |
| `status` | `status` |
| `fen` | `fen` |
| `ruleset list` | lists registered rulesets |
| `ruleset set <id>` | switch ruleset |
| `load fen <fen>` | load position |
| `move <from> <to> [promo]` | `move e2 e4` |
| `play <san>` | `play Nf3` |
| `meta list\|get\|set` | `meta set activeColor w` |
| `piece place\|remove\|list` | `piece place e4 w q` |
| `node show\|tag\|attr` | `node tag e4 add hot` |
| `legal [square]` | `legal e2` |
| `graph summary` | node/edge/piece counts |
| `history` | session move log |
| `config export` | JSON variant config |
| `config apply <json>` | apply agent config |
| `patch json <array>` | raw `BoardPatch[]` |
| `reset [fen]` | reset to start or custom FEN |

---

## Agent schema: `BoardVariantConfig`

Agents should emit this JSON for `config apply`:

```json
{
  "version": 1,
  "label": "KQ vs KR endgame",
  "description": "Balanced queen vs rook ending for blitz practice",
  "rulesetId": "standard-fide",
  "themeId": "endgame-slate",
  "setup": {
    "fen": "4k2q/8/8/8/8/8/4R3/4K3 w - - 0 1",
    "meta": {
      "activeColor": "w",
      "variant": "endgame-hero"
    },
    "nodeTags": {
      "e4": ["center", "critical"]
    },
    "pieces": [],
    "patches": []
  }
}
```

### Without FEN (piece list setup)

```json
{
  "version": 1,
  "label": "Custom K+P vs K",
  "rulesetId": "standard-fide",
  "setup": {
    "meta": { "activeColor": "w" },
    "pieces": [
      { "square": "e1", "owner": "w", "kind": "k" },
      { "square": "e8", "owner": "b", "kind": "k" },
      { "square": "e4", "owner": "w", "kind": "p" }
    ]
  }
}
```

### Raw patches (advanced)

```json
{
  "version": 1,
  "label": "Tagged promotion square",
  "setup": {
    "fen": "8/4k3/8/8/8/8/4P3/4K3 w - - 0 1",
    "patches": [
      {
        "op": "set-node",
        "node": { "id": "e8", "tags": ["promotion-rank-white"] }
      }
    ]
  }
}
```

---

## Agent workflow

1. User describes variant in natural language
2. Agent reads `docs/plans/universal-board-foundation.md` + this doc
3. Agent emits `BoardVariantConfig` JSON
4. User or agent runs: `config apply '<json>'`
5. Optional: `config export` to save/share

### Example agent prompt fragment

```
Output a BoardVariantConfig JSON (version 1) for:
"A pawn endgame where white has K+e2+p and black has K+e7 only, white to move."

Use rulesetId standard-fide. Include label and description.
```

---

## Architecture

```
User/Agent input
    → executeBoardCommand() / config apply
    → ProgressMessage[]
    → BoardSession.apply()
    → BoardGraph mutated
    → BoardSessionView re-renders
```

Commands never touch React. Same executor runs on server later for validation.

---

## Extension points

| Need | Add |
|------|-----|
| New command | `BOARD_COMMANDS` in `commands.ts` |
| New ruleset | `registerRuleset()` |
| Custom piece kind | piece rule + ruleset (movement plugins next) |
| UCI notation | extend `play` / `notation` message handler |
| Server sync | stream `ProgressMessage` over WebSocket |

---

## Related

- `docs/plans/universal-board-foundation.md`
- `src/domain/board-core/types.ts` — `BoardPatch`, `BoardGraph`
- `src/features/board/EditableBoard.tsx`
