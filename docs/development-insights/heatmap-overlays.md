## Heatmap Overlay Rendering Notes

Last updated: 2025-10-18

### Architecture overview
- `generateInfluenceSummary` (src/features/chessboard/overlays/heatmapEngine.ts) produces a canonical board snapshot. Every square now carries white and black contributor lists, total weights, and canvas samples so renderers do not need to re-run ray tracing.
- Scheme renderers live in `src/features/chessboard/overlays/schemes/`. Each implementation receives the summary plus trace mode (`line-of-sight` or `absolute`), colour profile data, and user preferences, and returns square/canvas overlay descriptors.
- Colour handling is centralised in `src/features/chessboard/overlays/colors/`. Profiles define per-piece primaries, contested accents, and check/mate highlight tones. Future per-piece overrides will merge through the same resolver.
- `HeatmapSettingsProvider` (src/features/chessboard/state/heatmapSettingsContext.tsx) stores scheme selection, sub-scheme, include-both-sides flag, colour profile, overrides, and check highlight state. Board UI, the control tray, and terminal commands all subscribe to this store.

### Default schemes
| Scheme ID        | Label           | Behaviour                                                                    |
|------------------|-----------------|-------------------------------------------------------------------------------|
| `neutral-cancel` | Neutral Cancel  | Mirrors the legacy behaviour: contested squares clear out, dominant side fills. |
| `contested-mixed`| Contested Mix   | Contested squares render segmented bars sized by the number of contributors. |
| `contested-flag` | Contested Flag  | Any contested square receives a dedicated flag colour while clear squares tint normally. |

Additions follow a simple recipe: implement `HeatmapSchemeDefinition`, register the scheme in `schemes/registry.ts`, and Storybook/terminal/UI immediately pick it up.

### Colour profiles
- Profiles are defined in `overlays/colors/defaultProfiles.ts` and registered via `colors/registry.ts`.
- `resolveColorProfile` merges profile defaults with optional overrides, supplying solid, segmented, and flag overlays with consistent hues.
- Check and checkmate highlights are part of the profile so they match the active palette (and can be disabled via settings).

### Terminal controls
The in-app terminal now exposes the entire overlay configuration surface:

```
heatmap status
heatmap scheme list
heatmap scheme set <scheme-id>
heatmap sub-scheme set <line-of-sight|absolute>
heatmap colors list
heatmap colors set <profile-id>
heatmap include <both|single>
heatmap check <on|off|toggle>
heatmap help
```

Each command validates input and echoes the resulting state (including automatic trace-mode shifts when a new scheme does not support the previous mode).

### Control tray
- `HeatmapControlsPanel` now renders scheme buttons, trace mode toggles, a colour profile select, and switches for “include both sides” plus “check highlights”.
- Button and select options come straight from the registries, so adding schemes or profiles automatically updates the UI and terminal help.

### Rendering behaviour
- `ChessboardSquare` consumes `SquareOverlayDescriptor` objects and supports solid, segmented, and flag overlays without manipulating the base tile colour directly.
- `ExpandedHeatmapOverlay` reuses the same descriptors for the canvas, keeping expanded views visually aligned with the board core.
- Check and checkmate states hook into the overlay pipeline and use the profile-defined colours; they can be toggled with `heatmap check off`.

### Follow-up ideas
1. Surface a legend component that reads `render.legend` from the active scheme to explain gradients/segments.
2. Add Storybook stories that cover each scheme/trace-mode/profile combination for visual regression confidence.
3. Implement per-piece colour overrides (UI pickers + persistence) and feed them through the profile resolver.
4. Add unit tests for `generateInfluenceSummary` and the scheme renderers to guard against double-counting or ratio regressions.

### Related documentation
- `docs/project-visions/normalized-board-phase-two.md` for the expanded canvas roadmap.
- `docs/development-insights/normalized-grid-overlay.md` for board rendering considerations when overlays and the normalized grid interact.
