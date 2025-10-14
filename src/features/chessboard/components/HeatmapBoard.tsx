import { useEffect, useRef } from 'react';
import styles from './BoardWorkspaceLayout.module.css';
import { CustomChessboard } from '@/features/chessboard/components/CustomChessboard';
import { HeatmapControlsPanel } from '@/features/chessboard/components/HeatmapControlsPanel';
import { NormalizeBoardToggle } from '@/features/chessboard/components/NormalizeBoardToggle';
import { useHeatmapControls } from '@/features/chessboard/hooks/useHeatmapControls';
import { useHeatmapOverlay } from '@/features/chessboard/hooks/useHeatmapOverlay';

interface HeatmapBoardProps {
  fen: string;
  orientation: 'white' | 'black';
  moveMode: boolean;
  boardSize: number;
  onMove: (from: string, to: string) => boolean;
}

export const HeatmapBoard = ({ fen, orientation, moveMode, boardSize, onMove }: HeatmapBoardProps) => {
  const controls = useHeatmapControls();
  const overlay = useHeatmapOverlay({
    fen,
    orientation,
    activeToggleIds: controls.activeToggleIds,
    scheme: controls.scheme,
    includeBothSides: controls.includeBothSides,
  });

  const layoutRef = useRef<HTMLDivElement | null>(null);
  const boardShellRef = useRef<HTMLDivElement | null>(null);
  const trayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const layout = layoutRef.current;
    const boardShell = boardShellRef.current;
    const tray = trayRef.current;

    if (!layout) {
      return;
    }

    const logMetrics = () => {
      const layoutRect = layout.getBoundingClientRect();
      const boardRect = boardShell?.getBoundingClientRect();
      const trayRect = tray?.getBoundingClientRect();

      if (trayRect?.width) {
        layout.style.setProperty('--tray-width', `${Math.round(trayRect.width)}px`);
      }

      const trayGap =
        boardRect && trayRect ? Number((boardRect.left - trayRect.right).toFixed(2)) : null;
      const layoutStyles = window.getComputedStyle(layout);
      const trayStyles = tray ? window.getComputedStyle(tray) : null;

      console.log('heatmap-board/layout', {
        viewportWidth: window.innerWidth,
        layoutWidth: layoutRect.width,
        layoutDisplay: layoutStyles.display,
        breakpointActive: window.innerWidth >= 768 ? 'md+' : 'base',
        boardShellWidth: boardRect?.width,
        trayWidth: trayRect?.width,
        layoutGap: layoutStyles.gap,
        gridTemplateColumns: layoutStyles.gridTemplateColumns,
        trayPosition: trayStyles?.position,
        trayGapFromBoard: trayGap,
      });
    };

    const observer = new ResizeObserver(logMetrics);
    observer.observe(layout);
    if (boardShell) {
      observer.observe(boardShell);
    }
    if (tray) {
      observer.observe(tray);
    }

    window.addEventListener('resize', logMetrics);
    logMetrics();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', logMetrics);
    };
  }, [boardSize]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const overlaySquareCount = Object.keys(overlay.overlays).length;
    console.log('heatmap-board/overlay-summary', {
      toggles: controls.activeToggleIds,
      overlaySquares: overlaySquareCount,
      hasOverlay: overlay.hasOverlay,
    });
  }, [controls.activeToggleIds, overlay.hasOverlay, overlay.overlays]);

  return (
    <div
      ref={layoutRef}
      className={styles.layout}
      style={{ ['--board-shell-width' as const]: `${boardSize}px` }}
    >
      <div ref={trayRef} className={styles.trayZone} data-testid="heatmap-tray-zone">
        <HeatmapControlsPanel
          toggles={controls.toggles}
          onToggle={controls.togglePiece}
          onClear={controls.clearPieces}
        />
      </div>

      <div
        ref={boardShellRef}
        className={styles.boardShell}
        data-testid="heatmap-board-shell"
      >
        <div style={{ width: `${boardSize}px`, height: `${boardSize}px` }}>
          <CustomChessboard
            fen={fen}
            orientation={orientation}
            moveMode={moveMode}
            boardSize={boardSize}
            onMove={onMove}
            squareOverlays={overlay.overlays}
            showPieces={controls.showPieces}
            normalizedBoard={controls.normalizedBoard}
          />
        </div>
      </div>

      <div className={styles.boardAuxZone}>
        <NormalizeBoardToggle
          normalized={controls.normalizedBoard}
          onToggleNormalized={controls.setNormalizedBoard}
          showPieces={controls.showPieces}
          onToggleShowPieces={controls.setShowPieces}
        />
      </div>
    </div>
  );
};
