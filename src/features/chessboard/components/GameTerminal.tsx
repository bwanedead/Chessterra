import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { Move } from 'chess.js';
import { createScopedLogger } from '@/shared/utils/logger';

const SPEED_STEP_MS = 200;

interface GameTerminalProps {
  className?: string;
  moves: Move[];
  currentPly: number;
  isAutoPlaying: boolean;
  autoDelay: number;
  consoleLines: string[];
  boardWidth: number;
  marginTop: number;
  isCanvasExpanded: boolean;
  portalTarget?: HTMLElement | null;
  onStepForward: () => void;
  onStepBackward: () => void;
  onJumpToPly: (ply: number) => void;
  onToggleAutoplay: () => void;
  onAdjustSpeed: (delta: number) => void;
  onSubmitCommand: (command: string) => void;
}

type MoveRow = {
  turn: number;
  white?: Move;
  black?: Move;
  whiteIndex: number;
  blackIndex: number;
};

const buildMoveRows = (moves: Move[]): MoveRow[] =>
  moves.reduce<MoveRow[]>((rows, move, index) => {
    const rowIndex = Math.floor(index / 2);
    if (!rows[rowIndex]) {
      rows[rowIndex] = {
        turn: rowIndex + 1,
        whiteIndex: rowIndex * 2,
        blackIndex: rowIndex * 2 + 1,
      } as MoveRow;
    }
    if (move.color === 'w') {
      rows[rowIndex].white = move;
    } else {
      rows[rowIndex].black = move;
    }
    return rows;
  }, []);

export const GameTerminal = ({
  className,
  moves,
  currentPly,
  isAutoPlaying,
  autoDelay,
  consoleLines,
  boardWidth,
  marginTop,
  isCanvasExpanded,
  portalTarget,
  onStepForward,
  onStepBackward,
  onJumpToPly,
  onToggleAutoplay,
  onAdjustSpeed,
  onSubmitCommand,
}: GameTerminalProps) => {
  const [input, setInput] = useState('');
  const consoleRef = useRef<HTMLDivElement | null>(null);
  const activeMoveRef = useRef<HTMLButtonElement | null>(null);
  const moveListRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const lastSnapshotRef = useRef<{ mode: boolean; boardWidth: number; marginTop: number } | null>(null);
  const lastScrollParentRef = useRef<HTMLElement | null>(null);
  const layoutLogger = useMemo(() => createScopedLogger('terminal/layout'), []);

  const rows = useMemo(() => buildMoveRows(moves), [moves]);
  const activeIndex = currentPly - 1;
  const clampedWidth = useMemo(() => Math.max(240, Math.round(boardWidth)), [boardWidth]);
  const shouldPortal = Boolean(isCanvasExpanded && portalTarget);

  useEffect(() => {
    if (!consoleRef.current) {
      return;
    }
    consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [consoleLines]);

  useEffect(() => {
    const container = moveListRef.current;
    const element = activeMoveRef.current;
    if (!container || !element) {
      return;
    }

    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;
    const elementTop = element.offsetTop - container.offsetTop;
    const elementBottom = elementTop + element.offsetHeight;

    if (elementTop < containerTop) {
      container.scrollTop = elementTop;
    } else if (elementBottom > containerBottom) {
      container.scrollTop = elementBottom - container.clientHeight;
    }
  }, [activeIndex]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }

    const element = terminalRef.current;
    if (!element) {
      layoutLogger.warn('terminal-missing');
      return;
    }

    const describeElement = (target: Element | null) => {
      if (!target || !(target instanceof HTMLElement)) {
        return null;
      }

      const rect = target.getBoundingClientRect();
      const computed = window.getComputedStyle(target);

      return {
        tagName: target.tagName.toLowerCase(),
        id: target.id || undefined,
        className: target.className || undefined,
        rect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
        position: computed.position,
        overflowX: computed.overflowX,
        overflowY: computed.overflowY,
        display: computed.display,
      };
    };

    const getScrollParent = (node: HTMLElement | null): HTMLElement | null => {
      if (!node) {
        return null;
      }

      const scrollablePattern = /(auto|scroll|overlay)/i;
      let current: HTMLElement | null = node.parentElement;

      while (current) {
        const style = window.getComputedStyle(current);
        if (
          scrollablePattern.test(style.overflow) ||
          scrollablePattern.test(style.overflowY) ||
          scrollablePattern.test(style.overflowX)
        ) {
          return current;
        }
        current = current.parentElement;
      }

      return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null;
    };

    const emitMetrics = (context: string) => {
      const rect = element.getBoundingClientRect();
      const computed = window.getComputedStyle(element);
      const offsetParent = element.offsetParent instanceof HTMLElement ? element.offsetParent : null;
      const scrollParent = getScrollParent(element);
      const offsetParentSummary = describeElement(offsetParent);
      const scrollParentSummary = describeElement(scrollParent);

      layoutLogger.debug('terminal-metrics', {
        context,
        mode: isCanvasExpanded ? 'canvas' : 'classic',
        boardWidth,
        marginTop,
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
        viewport: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
        },
        clientWidth: element.clientWidth,
        offsetWidth: element.offsetWidth,
        className: element.className,
        inlineStyle: element.getAttribute('style') ?? undefined,
        computedStyle: {
          position: computed.position,
          top: computed.top,
          left: computed.left,
          right: computed.right,
          bottom: computed.bottom,
          marginTop: computed.marginTop,
          marginBottom: computed.marginBottom,
          marginLeft: computed.marginLeft,
          marginRight: computed.marginRight,
          display: computed.display,
          transform: computed.transform,
        },
        offsetParent: offsetParentSummary,
        scrollParent: scrollParentSummary,
      });

      if (scrollParent !== lastScrollParentRef.current) {
        lastScrollParentRef.current = scrollParent;
        layoutLogger.debug('terminal-scroll-context', {
          mode: isCanvasExpanded ? 'canvas' : 'classic',
          scrollParent: scrollParentSummary,
        });
      }
    };

    const previousSnapshot = lastSnapshotRef.current;
    if (!previousSnapshot) {
      emitMetrics('init');
    } else if (previousSnapshot.mode !== isCanvasExpanded) {
      emitMetrics('mode-change');
    } else if (
      previousSnapshot.boardWidth !== boardWidth ||
      previousSnapshot.marginTop !== marginTop
    ) {
      emitMetrics('dimension-update');
    } else {
      emitMetrics('layout-sync');
    }

    lastSnapshotRef.current = {
      mode: isCanvasExpanded,
      boardWidth,
      marginTop,
    };

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => emitMetrics('resize'));
      observer.observe(element);
      return () => observer.disconnect();
    }

    const handleResize = () => emitMetrics('resize');
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [boardWidth, isCanvasExpanded, layoutLogger, marginTop, portalTarget]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName ?? '';
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable;
      const normalized = event.key.toLowerCase();
      const isLeft = normalized === 'arrowleft' || normalized === 'a';
      const isRight = normalized === 'arrowright' || normalized === 'd';
      const isUp = normalized === 'arrowup';
      const isDown = normalized === 'arrowdown';
      const isSpace = normalized === ' ';
      const isPlus = normalized === '+' || normalized === '=';
      const isMinus = normalized === '-' || normalized === '_';

      const preventNavigation = () => {
        const { scrollX, scrollY } = window;
        event.preventDefault();
        event.stopPropagation();
        if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
          requestAnimationFrame(() => {
            window.scrollTo(scrollX, scrollY);
          });
        }
      };

      if (isLeft || isRight || isUp || isDown) {
        if (!isTyping) {
          preventNavigation();
          if (isLeft || isUp) {
            onStepBackward();
          } else if (isRight || isDown) {
            onStepForward();
          }
        }
        return;
      }

      if (isSpace && !isTyping) {
        preventNavigation();
        onToggleAutoplay();
        return;
      }

      if (isPlus && !isTyping) {
        preventNavigation();
        onAdjustSpeed(-SPEED_STEP_MS);
        return;
      }

      if (isMinus && !isTyping) {
        preventNavigation();
        onAdjustSpeed(SPEED_STEP_MS);
      }
    };

    const listenerOptions: AddEventListenerOptions = { capture: true };
    window.addEventListener('keydown', handleKey, listenerOptions);
    return () => window.removeEventListener('keydown', handleKey, listenerOptions);
  }, [onAdjustSpeed, onStepBackward, onStepForward, onToggleAutoplay]);

  const submitCommand = useCallback(() => {
    const command = input.trim();
    if (command) {
      onSubmitCommand(command);
      setInput('');
    }
  }, [input, onSubmitCommand]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submitCommand();
      }
    },
    [submitCommand],
  );

  const containerClasses = [
    'relative z-20 flex w-full max-w-[560px] flex-col gap-3 rounded-2xl border border-slate-900/70 bg-[#0b0f18] px-5 py-5 text-slate-100 shadow-[0_18px_44px_rgba(10,15,35,0.48)] transition-colors',
    shouldPortal ? '' : 'mx-auto',
    'font-mono text-[13px]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const containerHeight = 280;
  const containerStyle: CSSProperties = shouldPortal
    ? { width: 'min(580px, 100%)', height: containerHeight }
    : { width: Math.max(clampedWidth, 520), marginTop, height: containerHeight };

  const streamStyle: CSSProperties = { backgroundColor: '#0d1726', color: '#e2e8f0' };

  const terminalNode = (
    <aside
      ref={terminalRef}
      className={containerClasses}
      style={{
        ...containerStyle,
        visibility: isCanvasExpanded && !shouldPortal ? 'hidden' : undefined,
        pointerEvents: isCanvasExpanded && !shouldPortal ? 'none' : undefined,
      }}
    >
      <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-500">
        <span>Move Feed</span>
        <span className={isAutoPlaying ? 'text-emerald-300' : 'text-slate-600'}>
          {isAutoPlaying ? `Auto - ${autoDelay}ms` : 'Paused'}
        </span>
      </div>

      <div
        ref={moveListRef}
        className="max-h-48 overflow-y-auto rounded-xl border border-slate-800/70 px-3 py-3"
        style={streamStyle}
      >
        <button
          type="button"
          onClick={() => onJumpToPly(0)}
          className={[
            'mb-2 w-full cursor-pointer rounded px-2 py-1 text-left transition',
            activeIndex < 0 ? 'bg-emerald-500/15 text-emerald-200' : 'text-slate-500 hover:bg-slate-900/70',
          ].join(' ')}
        >
          {'>> Start'}
        </button>
        {rows.length === 0 ? (
          <div className="text-slate-600">No moves recorded.</div>
        ) : (
          rows.map((row) => {
            const whiteActive = activeIndex === row.whiteIndex;
            const blackActive = activeIndex === row.blackIndex;
            return (
              <div key={row.turn} className="flex items-center gap-4 py-0.5">
                <span className="w-8 text-right text-slate-600">{`${row.turn}.`}</span>
                <div className="flex flex-1 items-center gap-4">
                  <button
                    type="button"
                    disabled={!row.white}
                    ref={whiteActive ? activeMoveRef : null}
                    className={[
                      'min-w-[60px] cursor-pointer rounded px-2 py-1 text-left transition',
                      whiteActive
                        ? 'bg-emerald-500/20 text-emerald-200'
                        : 'text-slate-300 hover:bg-slate-900/70',
                      !row.white ? 'cursor-default opacity-30 hover:bg-transparent' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => row.white && onJumpToPly(row.whiteIndex + 1)}
                  >
                    {row.white?.san ?? '...'}
                  </button>
                  <button
                    type="button"
                    disabled={!row.black}
                    ref={blackActive ? activeMoveRef : null}
                    className={[
                      'min-w-[60px] cursor-pointer rounded px-2 py-1 text-left transition',
                      blackActive
                        ? 'bg-emerald-500/20 text-emerald-200'
                        : 'text-slate-300 hover:bg-slate-900/70',
                      !row.black ? 'cursor-default opacity-30 hover:bg-transparent' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => row.black && onJumpToPly(row.blackIndex + 1)}
                  >
                    {row.black?.san ?? ''}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-1 overflow-hidden rounded-xl border border-slate-800/70" style={streamStyle}>
        <div
          ref={consoleRef}
          className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3 text-[12px]"
        >
          {consoleLines.map((line, index) => (
            <div key={`${line}-${index}`} className="whitespace-pre-wrap">
              {line}
            </div>
          ))}
          <div className="flex items-start gap-3 text-[12px] text-slate-100">
            <span className="mt-1 select-none text-emerald-400">{'>'}</span>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              placeholder="Type a command or paste PGN (Enter to run, Shift+Enter for newline)"
              className="flex-1 resize-none bg-transparent leading-[1.45] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
              style={{
                border: 'none',
                outline: 'none',
                outlineWidth: '0px',
                outlineColor: 'transparent',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                color: '#f8fafc',
              }}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>
      </div>
    </aside>
  );

  if (shouldPortal && portalTarget) {
    return createPortal(terminalNode, portalTarget);
  }

  return terminalNode;
};

GameTerminal.displayName = 'GameTerminal';
