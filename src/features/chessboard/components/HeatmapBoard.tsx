import { forwardRef, memo, useEffect, useMemo, useRef } from 'react';
import styles from './BoardWorkspaceLayout.module.css';
import { CustomChessboard } from '@/features/chessboard/components/CustomChessboard';
import { HeatmapControlsPanel } from '@/features/chessboard/components/HeatmapControlsPanel';
import { NormalizeBoardButton, PiecesVisibilityButton } from '@/features/chessboard/components/NormalizeBoardToggle';
import { ExpandCanvasToggle } from '@/features/chessboard/components/ExpandCanvasToggle';
import { CanvasChrome, CanvasModeProvider, CanvasViewport, useCanvasMode } from '@/features/chessboard/canvas';
import { ExpandedHeatmapOverlay } from '@/features/chessboard/components/canvas/ExpandedHeatmapOverlay';
import { useHeatmapControls } from '@/features/chessboard/hooks/useHeatmapControls';
import { useHeatmapOverlay, type HeatmapOverlayOutput } from '@/features/chessboard/hooks/useHeatmapOverlay';
import { useLayerDiagnostics } from '@/features/chessboard/hooks/useLayerDiagnostics';
import { createScopedLogger, layoutDebugEnabled } from '@/shared/utils/logger';
import type { PieceColor, PromotionPieceType } from '@/features/chessboard/types';

interface HeatmapBoardProps {
  fen: string;
  orientation: 'white' | 'black';
  moveMode: boolean;
  boardSize: number;
  onMove: (from: string, to: string) => boolean;
  promotionRequest?: {
    square: string;
    color: PieceColor;
  };
  onSelectPromotion?: (piece: PromotionPieceType) => void;
  onCancelPromotion?: () => void;
  onCanvasModeChange?: (expanded: boolean) => void;
  onExpandedAttachmentTargetChange?: (element: HTMLElement | null) => void;
}

export const HeatmapBoard = ({
  fen,
  orientation,
  moveMode,
  boardSize,
  onMove,
  promotionRequest,
  onSelectPromotion,
  onCancelPromotion,
  onCanvasModeChange,
  onExpandedAttachmentTargetChange,
}: HeatmapBoardProps) => {
  const controls = useHeatmapControls();
  const overlay = useHeatmapOverlay({
    fen,
    orientation,
    activeToggleIds: controls.activeToggleIds,
    schemeId: controls.schemeId,
    subScheme: controls.subScheme,
    includeBothSides: controls.includeBothSides,
    colorProfileId: controls.colorProfileId,
    colorOverrides: controls.colorOverrides,
    highlightChecks: controls.checkHighlightsEnabled,
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
        onCanvasModeChange={onCanvasModeChange}
        onExpandedAttachmentTargetChange={onExpandedAttachmentTargetChange}
        promotionRequest={promotionRequest}
        onSelectPromotion={onSelectPromotion}
        onCancelPromotion={onCancelPromotion}
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
  promotionRequest,
  onSelectPromotion,
  onCancelPromotion,
  onCanvasModeChange,
  onExpandedAttachmentTargetChange,
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
  const attachmentZoneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onCanvasModeChange?.(isExpanded);
  }, [isExpanded, onCanvasModeChange]);

  useEffect(() => {
    if (!onExpandedAttachmentTargetChange) {
      return;
    }

    if (!isExpanded) {
      onExpandedAttachmentTargetChange(null);
      return;
    }

    onExpandedAttachmentTargetChange(attachmentZoneRef.current ?? null);

    return () => {
      onExpandedAttachmentTargetChange(null);
    };
  }, [isExpanded, onExpandedAttachmentTargetChange]);

  useLayerDiagnostics({
    ref: expandedOverlayRef,
    logger: diagnosticsLogger,
    label: 'expanded-board-overlay',
    enabled: layoutDebugEnabled && isExpanded,
    dependencies: [boardSize, controls.normalizedBoard, isExpanded, layoutDebugEnabled],
    extra: () => ({
      requestedBoardSize: boardSize,
      virtualBoardSize: boardSize * (14 / 8),
      normalized: controls.normalizedBoard,
      viewport: viewportSize,
    }),
  });
  useEffect(() => {
    if (!layoutDebugEnabled) {
      return;
    }

    diagnosticsLogger.debug('board-size-calculation', {
      isExpanded,
      requestedBoardSize: boardSize,
      virtualBoardSize: boardSize * (14 / 8),
      baseSquareSize: boardSize / 8,
      viewport: viewportSize,
    });
  }, [boardSize, diagnosticsLogger, isExpanded, layoutDebugEnabled, viewportSize]);

  const boardElement = (
    <CustomChessboard
      fen={fen}
      orientation={orientation}
      moveMode={moveMode && !promotionRequest}
      boardSize={boardSize}
      onMove={onMove}
      squareOverlays={overlay.squares}
      showPieces={controls.showPieces}
      normalizedBoard={controls.normalizedBoard}
      promotionRequest={
        promotionRequest && onSelectPromotion
          ? {
              square: promotionRequest.square,
              color: promotionRequest.color,
              onSelect: onSelectPromotion,
              onCancel: onCancelPromotion,
            }
          : undefined
      }
    />
  );

  useEffect(() => {
    if (!layoutDebugEnabled || isExpanded) {
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

      diagnosticsLogger.debug('layout', {
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
  }, [boardSize, diagnosticsLogger, isExpanded, layoutDebugEnabled]);

  useEffect(() => {
    if (!layoutDebugEnabled) {
      return;
    }

    const overlaySquareCount = Object.keys(overlay.squares).length;
    diagnosticsLogger.debug('overlay-summary', {
      toggles: controls.activeToggleIds,
      overlaySquares: overlaySquareCount,
      hasOverlay: overlay.hasOverlay,
    });
  }, [controls.activeToggleIds, diagnosticsLogger, layoutDebugEnabled, overlay.hasOverlay, overlay.squares]);

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
      if (layoutDebugEnabled) {
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
      if (layoutDebugEnabled) {
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
  }, [boardSize, diagnosticsLogger, isExpanded, layoutDebugEnabled, scrollContainer, viewportSize.height, viewportSize.width]);

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

    if (layoutDebugEnabled) {
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
  }, [boardSize, diagnosticsLogger, isExpanded, layoutDebugEnabled, scrollContainer]);

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
    if (layoutDebugEnabled) {
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
              schemeId={controls.schemeId}
              onSchemeChange={controls.setSchemeId}
              subScheme={controls.subScheme}
              onSubSchemeChange={controls.setSubScheme}
              includeBothSides={controls.includeBothSides}
              onIncludeBothSidesChange={controls.setIncludeBothSides}
              colorProfileId={controls.colorProfileId}
              onColorProfileChange={controls.setColorProfileId}
              checkHighlightsEnabled={controls.checkHighlightsEnabled}
              onCheckHighlightsChange={controls.setCheckHighlightsEnabled}
            />
          </CanvasChrome>
          <div className={styles.expandedBoardArea}>
            <ExpandedBoardOverlay
              ref={expandedOverlayRef}
              boardSize={boardSize}
              normalized={controls.normalizedBoard}
              canvasOverlays={overlay.canvas}
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
            <NormalizeBoardButton
              normalized={controls.normalizedBoard}
              onToggleNormalized={controls.setNormalizedBoard}
            />
            <ExpandCanvasToggle />
            <PiecesVisibilityButton showPieces={controls.showPieces} onToggleShowPieces={controls.setShowPieces} />
          </CanvasChrome>
          <div ref={attachmentZoneRef} className={styles.expandedAttachments} data-attachment-zone />
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
              schemeId={controls.schemeId}
              onSchemeChange={controls.setSchemeId}
              subScheme={controls.subScheme}
              onSubSchemeChange={controls.setSubScheme}
              includeBothSides={controls.includeBothSides}
              onIncludeBothSidesChange={controls.setIncludeBothSides}
              colorProfileId={controls.colorProfileId}
              onColorProfileChange={controls.setColorProfileId}
              checkHighlightsEnabled={controls.checkHighlightsEnabled}
              onCheckHighlightsChange={controls.setCheckHighlightsEnabled}
            />
          </CanvasChrome>
        </div>

        <div ref={boardShellRef} className={styles.boardShell} data-testid="heatmap-board-shell">
          <div className={styles.boardShellInner}>{boardElement}</div>
        </div>

        <div className={styles.boardAuxZone}>
          <CanvasChrome className="items-start">
            <NormalizeBoardButton
              normalized={controls.normalizedBoard}
              onToggleNormalized={controls.setNormalizedBoard}
            />
            <ExpandCanvasToggle />
            <PiecesVisibilityButton showPieces={controls.showPieces} onToggleShowPieces={controls.setShowPieces} />
          </CanvasChrome>
        </div>
      </div>
    </CanvasViewport>
  );
};
interface ExpandedBoardOverlayProps {
  boardSize: number;
  normalized: boolean;
  canvasOverlays: HeatmapOverlayOutput['canvas'];
  orientation: 'white' | 'black';
}

const ExpandedBoardOverlay = memo(
  forwardRef<HTMLDivElement, ExpandedBoardOverlayProps>(
    ({ boardSize, normalized, canvasOverlays, orientation }, ref) => {
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
            canvasOverlays={canvasOverlays}
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
