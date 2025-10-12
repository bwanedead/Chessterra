## Heatmap Overlay Rendering Notes

Last updated: 2025-10-09

### What changed
- Heatmap weights are normalised against the strongest square returned by `generateHeatmap`. Each square is painted with a bold, discrete colour selected from saturated palettes (deep blues for white influence, crimson for black, indigo for neutral).
- The tint no longer relies on opacity blending. Instead, `ChessboardSquare` swaps the tile background for the computed colour and adds a subtle glow so pieces remain legible even with bold fills.
- Overlay strength currently uses a fixed scale that grows with the influence magnitude, keeping colours punchy without tipping into full opacity.

### Key conditions for overlays to appear

- Heatmap data still flows `useHeatmapOverlay` ➝ `HeatmapBoard` ➝ `CustomChessboard` ➝ `ChessboardSurface`.  
  If the console log `square-overlays` stays at zero after toggling, the active toggle IDs are not matching the board state.

- `useHeatmapOverlay` maps integer influence counts to fixed palette steps. A square influenced by one piece always uses palette slot 1, two pieces slot 2, etc. Intensity merely adjusts the blending strength, not the colour tier:

  ```ts
  const magnitudeLevel = Math.max(1, Math.round(magnitude));
  const index = Math.min(palette.length - 1, magnitudeLevel - 1);
  const strength = clamp(0.6 + (magnitudeLevel - 1) * 0.08, 0.45, 0.85);
  ```

- `ChessboardSquare` expects the overlay data to provide both `color` and `strength`. It mixes the square's base tone with the overlay colour using `0.45 – 0.95` alpha, then adds a glow with the same hue. Missing data causes a graceful fallback to the base tile colour.

### Recommended enhancements / hardening

1. **Intensity presets & reset** – pair the slider with quick presets (Subtle / Balanced / Bold) plus a reset button.
2. **Piece colour pickers** – allow the user to choose the max-intensity colour per piece family (white vs black) and seed the palettes from that choice.
3. **Legend component** – show a small scale legend explaining what the discrete colour steps mean (e.g., "3+ overlapping attacks").
4. **Unit tests** – cover the palette selection + intensity math to guarantee we never regress the mapping as we introduce new schemes.
5. **Storybook scenarios** – create visual regression stories of extreme positions (all rooks, all bishops, etc.) to confirm the palette stays readable.

### Related documentation
- `docs/project-visions/normalized-board-phase-two.md` captures the normalized grid roadmap, including canvas expansion plans that build on these overlay primitives.
