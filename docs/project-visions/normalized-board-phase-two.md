# Phase 2 Vision: Infinite Grid Heatmap Playground

## Why this exists
The normalized board toggle lets us strip the wood-and-felt styling down to a minimal wireframe so patterns in the heatmap overlays take center stage. Phase two pushes that idea further, transforming the chessboard into a projected grid that can expand beyond 8×8 and feel closer to a Conway-style simulation space.

## Experience pillars
- **Normalized canvas as base mode** — Treat the black background plus white wireframe as the canonical substrate for analytical playbacks. Users should feel like they have entered a data theater focused on structure and flow instead of piece aesthetics.
- **Board boundary detachment** — Allow heatmap shapes, directional rays, and temporal echoes to spill past the 8×8 boundary while still anchoring moves to legal squares.
- **Customizable ambience** — Expose background and wireframe color controls (including future presets such as “neon nebula” or “terminal green”) so players can tailor the analytic vibe without editing code.
- **Narrative playback** — Pair the expanded grid with move-by-move scrubbing controls, creating a cinematic replay that highlights evolving pressure and influence fields.

## Implementation sketch
1. **Board rendering primitives**
   - Promote the new `BoardAppearance` model so other components and stories can request specific palettes.
   - Extract grid rendering into a dedicated surface component that understands padding, wireframe thickness, and outer glow variants.
   - Support board scaling factors that can increase the drawable canvas while keeping the legal square coordinates pinned to an 8×8 logical grid.
   - Maintain a library of “wireframe” piece treatments (outlines, neon glows, motion blur hooks) that match the normalized surface and can be swapped independently from the traditional sprites.
2. **Heatmap projection**
   - Extend overlay generators so they can return values outside of `a1`–`h8`, using virtual coordinates that the renderer can translate into positions beyond the board.
   - Add falloff functions so influence fades smoothly as it travels away from the legal board.
3. **Playback controls**
   - Introduce timeline controls (scrubber, autoplay, tempo adjustments) with hooks that stream overlay frames for each move.
   - Cache overlay snapshots per move to avoid regenerating heatmaps during timeline scrubbing.
4. **Customization surface**
   - Build a color preset system backed by CSS variables or Tailwind themes.
   - Surface presets alongside the normalize toggle so users can preview aesthetics rapidly.
5. **Performance guardrails**
   - Profile canvas expansion on devices with integrated graphics; target 60 fps for overlay animations.
   - Provide fallback rendering (reduced grid density, simplified gradients) when the browser hits resource thresholds.

## Open questions
- How should expanded overlays interact with existing board highlights (e.g., last move, legal move hints)?
- Do we snap expanded visuals to square centers or allow free-form vector paths?
- Should normalization automatically hide piece sprites, or should that remain a separate control?
- What is the most intuitive way to communicate that the extra grid space is analytic rather than legal for moves?

## Next steps
1. Design UI sketches for the expanded grid state and color preset selector.
2. Prototype an overlay renderer that accepts coordinates beyond `h8` and renders them to a 12×12 canvas.
3. Gather feedback from analysts/coaches to validate whether expanded overlays improve storytelling.
4. Add a dedicated “Hide pieces” toggle so analysts can focus on influence maps without manually muting sprites.
