# Normalized Board Grid Overlay

## Context
- Goal: render faint grid lines and a clear 8×8 frame when the normalized board mode is active, even when overlays expand beyond the classic board bounds.
- Initial issues: CSS lines were clipped at the board edge and sometimes disappeared because the overlay container collapsed to a few pixels.

## Key Decisions & Solutions
- **Layer Stack Architecture**
  - Added `BoardLayerStack` and `BoardLayer` components so every visual layer shares a sized, positioned container with predictable z-indexing.
  - The stack enforces board dimensions (`width`/`height` = `boardSize`) while layers stretch to 100% using absolute positioning.

- **Dedicated Grid Overlay Component**
  - Factored the wireframe into `NormalizedGridOverlay` which:
    - Renders column/row divs relative to the full board footprint.
    - Applies its own border and color mixing so the board outline stays readable.
    - Accepts thickness/alpha inputs derived from board size for consistent appearance across resolutions.

- **Diagnostics Hook**
  - Introduced `useLayerDiagnostics` to log bounding boxes, computed styles, and child geometries.
  - Enabled quick detection when the overlay collapsed or misaligned, and can be reused for future canvas/overlay debugging.

- **Sizing Fixes**
  - Forwarded `boardSize` from `CustomChessboard` into `ChessboardSurface`.
  - Ensured grid layers explicitly set `width: 100%` and `height: 100%` to avoid shrinking to content size.
  - Adjusted normalized line thickness + alpha to keep lines faint and the frame slimmer.

## Files Touched
- `src/features/chessboard/components/ChessboardSurface.tsx`
- `src/features/chessboard/components/CustomChessboard.tsx`
- `src/features/chessboard/components/layers/BoardLayerStack.tsx`
- `src/features/chessboard/components/layers/BoardLayer.tsx`
- `src/features/chessboard/components/layers/NormalizedGridOverlay.tsx`
- `src/features/chessboard/hooks/useLayerDiagnostics.ts`
- `src/shared/utils/logger.ts`
- `src/stories/chessboard/NormalizedGridOverlay.stories.tsx`

## Takeaways
- Wrapping board visuals in a stack + layer system simplifies overlay composition and prevents DOM drift when adding new visual effects.
- Reusable diagnostics dramatically reduce time-to-fix for layout bugs; we should continue instrumenting new visual layers by default.
- Maintaining a lightweight Storybook scenario for complex overlays gives us a safe sandbox for future iterations (e.g., expanded canvas mode). 

