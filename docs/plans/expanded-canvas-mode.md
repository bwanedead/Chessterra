# Expanded Canvas Mode Plan

## Objective
- Allow users to toggle into a full-viewport “canvas” view where heatmap overlays can extend beyond the 8×8 board, while retaining a clearly delineated board frame.
- Provide an immersive experience where UI chrome auto-hides, reappears on interaction, and is easy to extend for future controls.

## Architecture Overview
- **CanvasModeController**
  - React context + hook that manages `isExpanded`, `viewportSize`, `cursorActivity`, hide timers, and keyboard shortcuts.
  - Exposes imperative entry points (`enter`, `exit`, `toggle`, `registerChrome`) and events for consumers.
- **CanvasViewport**
  - Wrapper that swaps between the current heatmap layout and a fullscreen absolute viewport when expanded.
  - Responsible for viewport sizing, centering the board, and rendering any “infinite grid” backdrop.
- **CanvasChrome**
  - Container for UI elements (normalize toggle, expand button, future controls).
  - Subscribes to controller visibility state; applies fade/glow transitions and handles pointer movement listeners.
- **Board + Overlays Integration**
  - Board remains constrained by `boardSize` via `BoardLayerStack`.
  - Heatmap layers and future overlays read `CanvasModeContext` to know when they can render beyond board bounds.
- **Diagnostics & Stories**
  - Extend `useLayerDiagnostics` to the canvas viewport in development.
  - Add Storybook stories for normal vs expanded states with mock overlays.

## Implementation Steps
1. **Controller Scaffold**
   - Build `CanvasModeProvider` with state + timers; hook Escape key, pointer movement.
   - Provide registration API so chrome elements auto-hide/show together.
2. **Viewport Shell**
   - Create `CanvasViewport` that wraps `HeatmapBoard`; apply fullscreen styles and transitions.
   - Integrate diagnostics hook to confirm viewport dimensions.
3. **Chrome Components**
   - Implement `CanvasChrome` + `ExpandCanvasToggle` button with aura glow and hide-on-idle behavior.
   - Update existing normalize toggle placement to sit inside chrome container.
4. **Overlay Awareness**
   - Update heatmap overlay logic to read expanded viewport size.
   - Ensure board outline remains anchored while overlays can extend.
5. **Polish & Testing**
   - Storybook story for expanded canvas.
   - Manual QA for hide/show timing, Escape handling, responsiveness.

## Open Questions
- Desired default idle timeout (proposal: 2 seconds)?
- Should expanded mode remember the last state when returning to the page?
- Any planned additional chrome (titles, legends) that should be pre-registered now?

