import { forwardRef, memo, useEffect, useMemo, useRef } from 'react';
import styles from './BoardWorkspaceLayout.module.css';
import { CustomChessboard } from '@/features/chessboard/components/CustomChessboard';
import { HeatmapControlsPanel } from '@/features/chessboard/components/HeatmapControlsPanel';
import { NormalizeBoardToggle } from '@/features/chessboard/components/NormalizeBoardToggle';
import { ExpandCanvasToggle } from '@/features/chessboard/components/ExpandCanvasToggle';
import { CanvasChrome, CanvasModeProvider, CanvasViewport, useCanvasMode } from '@/features/chessboard/canvas';
import { ExpandedHeatmapOverlay } from '@/features/chessboard/components/canvas/ExpandedHeatmapOverlay';
import { useHeatmapControls } from '@/features/chessboard/hooks/useHeatmapControls';
import { useHeatmapOverlay, type HeatmapOverlayOutput } from '@/features/chessboard/hooks/useHeatmapOverlay';
import { useLayerDiagnostics } from '@/features/chessboard/hooks/useLayerDiagnostics';
import { createScopedLogger } from '@/shared/utils/logger';

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

  return (
    <CanvasModeProvider>
      <HeatmapBoardContent
        fen={fen}
        orientation={orientation}
        moveMode={moveMode}
        boardSize={boardSize}
        onMove={onMove}
        controls={controls}
        overlay={overlay}
      />
    </CanvasModeProvider>
  );
};

interface HeatmapBoardContentProps extends HeatmapBoardProps {
  controls: ReturnType<typeof useHeatmapControls>;
  overlay: HeatmapOverlayOutput;
}

const HeatmapBoardContent = ({
  fen,
  orientation,
  moveMode,
  boardSize,
  onMove,
  controls,
  overlay,
}: HeatmapBoardContentProps) => {
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const boardShellRef = useRef<HTMLDivElement | null>(null);
  const trayRef = useRef<HTMLDivElement | null>(null);
  const { isExpanded, viewportSize, scrollContainer } = useCanvasMode();
  const expandedOverlayRef = useRef<HTMLDivElement | null>(null);
  const autoScrollPerformedRef = useRef(false);
  const lastScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const diagnosticsLogger = useMemo(() => createScopedLogger('chessboard/expanded-stage'), []);
  const lastViewportSizeRef = useRef<{ width: number; height: number } | null>(null);

  useLayerDiagnostics({
    ref: expandedOverlayRef,
    logger: diagnosticsLogger,
    label: 'expanded-board-overlay',
    enabled: process.env.NODE_ENV === 'development' && isExpanded,
    dependencies: [boardSize, controls.normalizedBoard, isExpanded],
    extra: () => ({
      requestedBoardSize: boardSize,
      virtualBoardSize: boardSize * (14 / 8),
      normalized: controls.normalizedBoard,
      viewport: viewportSize,
    }),
  });
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    diagnosticsLogger.debug('board-size-calculation', {
      isExpanded,
      requestedBoardSize: boardSize,
      virtualBoardSize: boardSize * (14 / 8),
      baseSquareSize: boardSize / 8,
      viewport: viewportSize,
    });
  }, [boardSize, diagnosticsLogger, isExpanded, viewportSize]);

  const boardElement = (
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
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || isExpanded) {
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
  }, [boardSize, isExpanded]);

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

  useEffect(() => {
    if (!isExpanded) {
      autoScrollPerformedRef.current = false;
      lastScrollContainerRef.current = null;
      lastViewportSizeRef.current = null;
      return;
    }

    if (scrollContainer && scrollContainer !== lastScrollContainerRef.current) {
      lastScrollContainerRef.current = scrollContainer;
      autoScrollPerformedRef.current = false;
    }

    const nextSize = {
      width: viewportSize.width ?? 0,
      height: viewportSize.height ?? 0,
    };
    const lastSize = lastViewportSizeRef.current;
    if (!lastSize || lastSize.width !== nextSize.width || lastSize.height !== nextSize.height) {
      lastViewportSizeRef.current = nextSize;
      autoScrollPerformedRef.current = false;
    }

    if (!scrollContainer || autoScrollPerformedRef.current) {
      return;
    }

    const targetContainer = scrollContainer;
    const squareSize = boardSize / 8;
    const coreOffset = squareSize * 3;
    const extendedSize = squareSize * 14;
    const viewportPadding = Math.max(squareSize, 48);
    const viewportHeight = viewportSize.height ?? 0;
    const viewportWidth = viewportSize.width ?? 0;
    const needsVerticalScroll = viewportHeight < extendedSize;
    const needsHorizontalScroll = viewportWidth < extendedSize;

    if (!needsVerticalScroll && !needsHorizontalScroll) {
      if (process.env.NODE_ENV === 'development') {
        diagnosticsLogger.debug('auto-scroll-skip', {
          reason: 'viewport-covers-canvas',
          viewportHeight,
          viewportWidth,
          extendedSize,
        });
      }
      autoScrollPerformedRef.current = true;
      return;
    }

    const scrollTarget = needsVerticalScroll ? Math.max(coreOffset - viewportPadding, 0) : 0;
    const horizontalPadding = Math.max(squareSize, 48);
    const horizontalTarget = needsHorizontalScroll ? Math.max(coreOffset - horizontalPadding, 0) : 0;
    const rafId = window.requestAnimationFrame(() => {
      if (!targetContainer) {
        return;
      }
      if (typeof targetContainer.scrollTo === 'function') {
        targetContainer.scrollTo({
          top: scrollTarget,
          left: horizontalTarget,
          behavior: 'auto',
        });
      } else {
        targetContainer.scrollTop = scrollTarget;
        targetContainer.scrollLeft = horizontalTarget;
      }
      autoScrollPerformedRef.current = true;
      if (process.env.NODE_ENV === 'development') {
        diagnosticsLogger.debug('auto-scroll', {
          scrollTarget,
          horizontalTarget,
          squareSize,
          coreOffset,
          viewportPadding,
          needsVerticalScroll,
          needsHorizontalScroll,
        });
      }
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [boardSize, diagnosticsLogger, isExpanded, scrollContainer, viewportSize.height, viewportSize.width]);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const squareSize = boardSize / 8;
    const coreOffset = squareSize * 3;
    const viewportPadding = Math.max(squareSize, 48);
    const targetContainer = scrollContainer;

    if (!targetContainer) {
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      diagnosticsLogger.debug('scroll-bounds', {
        containerHeight: targetContainer.clientHeight,
        containerWidth: targetContainer.clientWidth,
        scrollHeight: targetContainer.scrollHeight,
        scrollWidth: targetContainer.scrollWidth,
        currentScrollTop: targetContainer.scrollTop,
        currentScrollLeft: targetContainer.scrollLeft,
        squareSize,
        coreOffset,
        viewportPadding,
      });
    }
  }, [boardSize, diagnosticsLogger, isExpanded, scrollContainer]);

  if (isExpanded) {
    const squareSize = boardSize / 8;
    const extendedSize = squareSize * 14;
    const coreOffset = squareSize * 3;
    const viewportHeight = viewportSize.height ?? 0;
    const viewportPadding = Math.max(squareSize, 48);
    const centeredOffset = Math.max((viewportHeight - extendedSize) / 2, 0);
    const verticalCompensation = Math.max(centeredOffset - viewportPadding, 0);
    const canvasVars = {
      ['--canvas-size' as const]: `${extendedSize}px`,
      ['--canvas-offset' as const]: `${coreOffset}px`,
      ['--board-size' as const]: `${boardSize}px`,
      ['--canvas-vertical-compensation' as const]: `${verticalCompensation}px`,
    };
    const viewportVars = {
      ['--canvas-viewport-padding' as const]: `${viewportPadding}px`,
    };
    if (process.env.NODE_ENV === 'development') {
      diagnosticsLogger.debug('expanded-layout-vars', {
        squareSize,
        extendedSize,
        coreOffset,
        viewportHeight,
        viewportPadding,
        centeredOffset,
        verticalCompensation,
      });
    }

    return (
      <CanvasViewport className={styles.expandedViewport} style={viewportVars}>
        <div className={styles.expandedRoot} style={canvasVars}>
          <CanvasChrome className={`${styles.expandedChrome} ${styles.expandedChromeLeft}`}>
            <HeatmapControlsPanel
              toggles={controls.toggles}
              onToggle={controls.togglePiece}
              onClear={controls.clearPieces}
            />
          </CanvasChrome>
          <div className={styles.expandedBoardArea}>
            <ExpandedBoardOverlay
              ref={expandedOverlayRef}
              boardSize={boardSize}
              normalized={controls.normalizedBoard}
              overlays={overlay.overlays}
              orientation={orientation}
            />
            <div
              className={styles.boardCoreExpanded}
              style={{ width: `${boardSize}px`, height: `${boardSize}px` }}
            >
              {boardElement}
            </div>
          </div>
          <CanvasChrome className={`${styles.expandedChrome} ${styles.expandedChromeRight}`}>
            <NormalizeBoardToggle
              normalized={controls.normalizedBoard}
              onToggleNormalized={controls.setNormalizedBoard}
              showPieces={controls.showPieces}
              onToggleShowPieces={controls.setShowPieces}
            />
            <ExpandCanvasToggle />
          </CanvasChrome>
        </div>
      </CanvasViewport>
    );
  }

  return (
    <CanvasViewport>
      <div
        ref={layoutRef}
        className={styles.layout}
        style={{ ['--board-shell-width' as const]: `${boardSize}px` }}
      >
        <div ref={trayRef} className={styles.trayZone} data-testid="heatmap-tray-zone">
          <CanvasChrome>
            <HeatmapControlsPanel
              toggles={controls.toggles}
              onToggle={controls.togglePiece}
              onClear={controls.clearPieces}
            />
          </CanvasChrome>
        </div>

        <div ref={boardShellRef} className={styles.boardShell} data-testid="heatmap-board-shell">
          <div className={styles.boardShellInner}>{boardElement}</div>
        </div>

        <div className={styles.boardAuxZone}>
          <CanvasChrome className="items-end">
            <NormalizeBoardToggle
              normalized={controls.normalizedBoard}
              onToggleNormalized={controls.setNormalizedBoard}
              showPieces={controls.showPieces}
              onToggleShowPieces={controls.setShowPieces}
            />
            <ExpandCanvasToggle />
          </CanvasChrome>
        </div>
      </div>
    </CanvasViewport>
  );
};
interface ExpandedBoardOverlayProps {
  boardSize: number;
  normalized: boolean;
  overlays: HeatmapOverlayOutput['overlays'];
  orientation: 'white' | 'black';
}

const ExpandedBoardOverlay = memo(
  forwardRef<HTMLDivElement, ExpandedBoardOverlayProps>(
    ({ boardSize, normalized, overlays, orientation }, ref) => {
      const squareSize = boardSize / 8;
      const coreOffset = squareSize * 3;
      const extendedSize = squareSize * 14;
      const gridColor = normalized ? 'rgba(148, 163, 184, 0.22)' : 'rgba(148, 113, 82, 0.25)';
      const frameColor = normalized ? 'rgba(255, 255, 255, 0.4)' : 'rgba(249, 220, 163, 0.6)';

      return (
        <div
          ref={ref}
          className={styles.expandedOverlay}
          style={{
            width: `${extendedSize}px`,
            height: `${extendedSize}px`,
          }}
        >
          <div className={styles.expandedBackdropLayer} />
          <div
            className={styles.expandedVirtualGrid}
            style={{
              backgroundImage: [
                `linear-gradient(to right, ${gridColor} 1px, transparent 1px)`,
                `linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
              ].join(', '),
              backgroundSize: `${squareSize}px ${squareSize}px`,
            }}
          />
          <ExpandedHeatmapOverlay
            overlays={overlays}
            orientation={orientation}
            squareSize={squareSize}
            coreOffset={coreOffset}
            extendedSize={extendedSize}
            boardSize={boardSize}
          />
          <div
            className={styles.expandedBoardFrame}
            style={{
              width: `${boardSize}px`,
              height: `${boardSize}px`,
              top: `${coreOffset}px`,
              left: `${coreOffset}px`,
              borderColor: frameColor,
            }}
          />
        </div>
      );
    },
  ),
);

ExpandedBoardOverlay.displayName = 'ExpandedBoardOverlay';
