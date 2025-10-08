<!-- f4b872d5-9e9b-4c7a-bb0b-dd2736a58985 ef10941b-d63d-4f16-8826-2581b44a2929 -->
# Modularize CustomChessboard into hooks + surface

## Goal

Extract board derivation and drag orchestration out of `src/features/chessboard/components/CustomChessboard.tsx` into testable hooks and pure components, keeping `CustomChessboard` as a thin orchestrator.

## Scope

- Immediate fix: make dragged sprite follow the pointer smoothly.
- Keep semantics of `onMove` and orientation; no feature regressions.
- Then modularize to reduce coupling and increase testability.

## Key Extractions (from existing file)

- Board helpers and types:
```34:43:src/features/chessboard/components/CustomChessboard.tsx
const toPieceDescriptor = (piece: Piece | null | undefined): ChessPieceDescriptor | undefined => {
  if (!piece) {
    return undefined;
  }
  return { color: piece.color, type: piece.type };
};
```




`````42:70:src/features/chessboard/components/CustomChessboard.tsx

const getSquareColor = (file: number, rank: number): 'light' | 'dark' => ((file + rank) % 2 === 0 ? 'dark' : 'light');

const buildBoardSquares = (fen: string, orientation: 'white' | 'black'): BoardSquare[] => {

const game = new Chess(fen);

const board = game.board();

const squares: BoardSquare[] = [];

// ... push 64 squares with optional piece ...

return squares;

};

````
- Drag orchestration signatures to move:
```126:152:src/features/chessboard/components/CustomChessboard.tsx
const applyPreviewTransform = useCallback(() => { /* rAF-bound transform */ }, []);
const schedulePreviewSync = useCallback(() => { /* rAF scheduling */ }, [applyPreviewTransform]);
````

```155:237:src/features/chessboard/components/CustomChessboard.tsx

// window pointer listeners: move/up/cancel; compute targetSquare, call onMove

````
- Pure rendering slice:
```295:345:src/features/chessboard/components/CustomChessboard.tsx
// grid of 8x8 squares and preview layer
````

## File and Module Plan

1) Create shared chessboard types

- Add `src/features/chessboard/types.ts` exporting `ChessPieceDescriptor` and `BoardSquare` to decouple `lib` from components.

2) Extract pure board helpers

- New: `src/lib/chessboard/boardState.ts`
  - Exports:
    - `toPieceDescriptor(piece: Piece | null | undefined): ChessPieceDescriptor | undefined`
    - `getSquareColor(fileIdx: number, rankIdx: number): 'light' | 'dark'`
    - `buildBoardSquares(fen: string, orientation: 'white' | 'black'): BoardSquare[]`
  - Uses `chess.js` only; no React/DOM.

3) Add `useBoardSquares` hook

- New: `src/features/chessboard/hooks/useBoardSquares.ts`
  - Input: `{ fen: string, orientation: 'white' | 'black', boardSize: number }`
  - Output: `{ squares: BoardSquare[], piecePixelSize: number }`
  - Internals: `useMemo(buildBoardSquares)`, compute `piecePixelSize = max(24, floor(boardSize/8*0.9))`.

4) Add `usePieceDrag` hook

- New: `src/features/chessboard/hooks/usePieceDrag.ts`
  - Input: `{ boardRef, moveMode, onMove, orientation }`
  - Owns refs: `pointerIdRef`, `dragMetaRef`, `latestPositionRef`, `animationFrameRef`.
  - Manages window `pointermove` (passive+capture), `pointerup`/`pointercancel` (capture) listeners.
  - Calculates `targetSquare` using pure function:
    - Either keep `getSquareFromCoordinates` in the hook, or extract `src/lib/chessboard/geometry.ts`:
```72:96:src/features/chessboard/components/CustomChessboard.tsx
const getSquareFromCoordinates = (clientX, clientY, boardRect, orientation) => { /* DOMRect math */ };
`````

        - Returns: `{ dragVisual, beginDrag, cancelDrag, previewRef }`.
        - Emits telemetry via `createScopedLogger('chessboard/interaction')`.

5) Split rendering into pure components

- New: `src/features/chessboard/components/ChessboardSurface.tsx`
        - Props: `{ squares: BoardSquare[], piecePixelSize: number, dragSourceSquare?: string, onSquarePointerDown(squareId, piece, event) }`
        - Renders 8x8 grid using existing `ChessboardSquare` and `ChessPieceSprite`.
- New: `src/features/chessboard/components/DragPreviewLayer.tsx`
        - Props: `{ dragVisual: { square: string; piece: ChessPieceDescriptor } | null, piecePixelSize: number, previewRef: React.Ref<HTMLDivElement> }`
        - Pure; no side-effects.

6) Thin `CustomChessboard` orchestrator

- Keep in `src/features/chessboard/components/CustomChessboard.tsx`:
        - Use `useBoardSquares` and `usePieceDrag`.
        - Pass `beginDrag` to `ChessboardSurface`, and `dragVisual/piecePixelSize/previewRef` to `DragPreviewLayer`.

7) Stories & QA

- Update `stories/ChessGame.stories.tsx` to ensure drag still works.
- Add knobs/controls for `orientation`, `moveMode` and an interaction test that drags from a known square to another and asserts `onMove` was called with correct SAN or coords.

## Essential Signatures (new files)

```ts
// src/features/chessboard/types.ts
export type ChessPieceDescriptor = { color: 'w' | 'b'; type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k' };
export type BoardSquare = { id: string; color: 'light' | 'dark'; piece?: ChessPieceDescriptor };
```



`````ts

// src/lib/chessboard/boardState.ts

import type { Piece } from 'chess.js';

import { Chess } from 'chess.js';

import type { BoardSquare, ChessPieceDescriptor } from '@/features/chessboard/types';

export const toPieceDescriptor = (piece: Piece | null | undefined): ChessPieceDescriptor | undefined => {

if (!piece) return undefined;

return { color: piece.color, type: piece.type };

};

export const getSquareColor = (fileIdx: number, rankIdx: number): 'light' | 'dark' => ((fileIdx + rankIdx) % 2 === 0 ? 'dark' : 'light');

export const buildBoardSquares = (fen: string, orientation: 'white' | 'black'): BoardSquare[] => { /* as-is */ };

````
```ts
// src/features/chessboard/hooks/useBoardSquares.ts
import { useMemo } from 'react';
import { buildBoardSquares } from '@/lib/chessboard/boardState';
import type { BoardSquare } from '@/features/chessboard/types';
export const useBoardSquares = (fen: string, orientation: 'white' | 'black', boardSize: number): { squares: BoardSquare[]; piecePixelSize: number } => {
  const squares = useMemo(() => buildBoardSquares(fen, orientation), [fen, orientation]);
  const piecePixelSize = Math.max(24, Math.floor((boardSize / 8) * 0.9));
  return { squares, piecePixelSize };
};
````

```ts

// src/features/chessboard/hooks/usePieceDrag.ts

export type DragVisual = { square: string; piece: ChessPieceDescriptor } | null;

export const usePieceDrag = ({ boardRef, moveMode, onMove, orientation }: { boardRef: React.RefObject<HTMLDivElement>; moveMode: boolean; onMove: (from: string, to: string) => boolean; orientation: 'white' | 'black'; }): { dragVisual: DragVisual; beginDrag: (squareId: string, piece: ChessPieceDescriptor, event: React.PointerEvent<HTMLDivElement>) => void; cancelDrag: () => void; previewRef: React.RefObject<HTMLDivElement>; } => { /* extracted logic */ };

````
```tsx
// src/features/chessboard/components/ChessboardSurface.tsx
export function ChessboardSurface(props: { squares: BoardSquare[]; piecePixelSize: number; dragSourceSquare?: string; onSquarePointerDown: (squareId: string, piece: ChessPieceDescriptor, event: React.PointerEvent<HTMLDivElement>) => void; }) { /* pure grid */ }
````

```tsx

// src/features/chessboard/components/DragPreviewLayer.tsx

export function DragPreviewLayer({ dragVisual, piecePixelSize, previewRef }: { dragVisual: DragVisual; piecePixelSize: number; previewRef: React.RefObject<HTMLDivElement>; }) { /* preview only */ }

`````

## Incremental Commit Order

1. Move `ChessPieceDescriptor` (and `BoardSquare`) to `src/features/chessboard/types.ts`; update imports in `ChessPieceSprite.tsx` and `CustomChessboard.tsx`.
2. Add `src/lib/chessboard/boardState.ts`; switch `CustomChessboard` to use it.
3. Introduce `useBoardSquares` and update `CustomChessboard` to consume it.
4. Introduce `usePieceDrag`; wire into `CustomChessboard` while keeping existing JSX.
5. Split render into `ChessboardSurface` and `DragPreviewLayer` and use them in `CustomChessboard`.
6. Refresh stories/interaction tests; lint & verify build.

## Success Criteria

- Drag works with mouse and touch, including pointer capture behavior as before.
- `onMove(from, to)` fires only when `moveMode` is enabled and squares differ.
- No regressions in square coloring, piece sizing, or orientation behavior.
- ESLint passes; Storybook play test covers a basic drag interaction.

### To-dos

- [ ] Move ChessPieceDescriptor/BoardSquare to src/features/chessboard/types.ts
- [ ] Create src/lib/chessboard/boardState.ts with board helpers
- [ ] Add useBoardSquares hook and update CustomChessboard to consume
- [ ] Add usePieceDrag hook with window pointer orchestration
- [ ] Create ChessboardSurface pure grid renderer component
- [ ] Create DragPreviewLayer component for drag piece preview
- [ ] Thin CustomChessboard to orchestrate hooks/components
- [ ] Update stories and add interaction test for drag
- [ ] Run lint/build and fix issues