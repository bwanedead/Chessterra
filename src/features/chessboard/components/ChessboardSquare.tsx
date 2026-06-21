import { Fragment, type ReactNode, useEffect, useRef } from 'react';
import type { BoardAppearance } from '@/features/chessboard/themes/types';
import type { SquareOverlayDescriptor } from '@/features/chessboard/overlays/schemes';

import type { BoardSquareHighlight } from '@/features/chessboard/interaction/types';
import { getHighlightColor } from '@/features/chessboard/interaction/highlights';

interface ChessboardSquareProps {
  square: string;
  color: 'light' | 'dark';
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerEnter?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLDivElement>) => void;
  children?: ReactNode;
  highlight?: boolean;
  interactionHighlight?: BoardSquareHighlight | null;
  className?: string;
  overlay?: SquareOverlayDescriptor | null;
  showContent?: boolean;
  appearance: BoardAppearance;
  showIntensityLabel?: boolean;
}

const HIGHLIGHT_COLOR = 'rgba(59, 130, 246, 0.25)';

const hexToRgb = (hex: string) => {
  const sanitized = hex.replace('#', '');
  const bigint = Number.parseInt(sanitized.length === 3 ? sanitized.repeat(2) : sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

const parseColor = (color: string) => {
  if (color.startsWith('#')) {
    const { r, g, b } = hexToRgb(color);
    return { r, g, b, a: 1 };
  }
  const match = color.match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    return null;
  }
  const parts = match[1].split(',').map((value) => value.trim());
  return {
    r: Number(parts[0]),
    g: Number(parts[1]),
    b: Number(parts[2]),
    a: parts[3] ? Number(parts[3]) : 1,
  };
};

const colorWithAlpha = (color: string, alpha: number) => {
  const parsed = parseColor(color);
  if (!parsed) {
    return color;
  }
  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${Math.min(1, Math.max(0, alpha))})`;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const composeGlow = (glow: SquareOverlayDescriptor['style']['glow'], intensity: number) => {
  if (!glow) {
    return undefined;
  }
  const strength = glow.strength ?? 0.5;
  const base = clamp01(intensity * strength);
  const primary = colorWithAlpha(glow.color, 0.45 + base * 0.35);
  const secondary = colorWithAlpha(glow.color, 0.3 + base * 0.25);
  return `0 0 14px ${primary}, 0 0 36px ${secondary}`;
};

const renderOverlay = (overlay: SquareOverlayDescriptor | null | undefined) => {
  if (!overlay) {
    return null;
  }

  const { style } = overlay;
  const intensity = clamp01(style.intensity ?? 0);
  if (intensity <= 0) {
    return null;
  }

  const glow = composeGlow(style.glow, intensity);

  if (style.kind === 'solid' || style.kind === 'flag') {
    return (
      <div
        data-overlay-kind={style.kind}
        className="absolute inset-0 pointer-events-none rounded-md transition-all duration-150"
        style={{
          opacity: intensity,
          backgroundColor: style.color,
          boxShadow: glow,
        }}
      />
    );
  }

  if (style.kind === 'segmented') {
    const segments = style.segments;
    const orientation = style.orientation ?? 'horizontal';
    const dividerColor = style.dividerColor ? colorWithAlpha(style.dividerColor, 0.9) : undefined;

    return (
      <div
        data-overlay-kind="segmented"
        className="absolute inset-0 pointer-events-none transition-all duration-150"
        style={{
          width: '100%',
          height: '100%',
          opacity: intensity,
          display: 'flex',
          flexDirection: orientation === 'horizontal' ? 'row' : 'column',
          boxShadow: glow,
        }}
      >
        {segments.map((segment, index) => (
          <Fragment key={`${segment.color}-${index}`}>
            <div
              data-overlay-segment="true"
              data-overlay-segment-index={index}
              data-overlay-segment-label={segment.label ?? ''}
              data-overlay-segment-color={segment.color}
            style={{
              flexGrow: Math.max(segment.proportion, 0.01),
              flexShrink: 0,
              flexBasis: 0,
              width: orientation === 'horizontal' ? undefined : '100%',
              height: orientation === 'horizontal' ? '100%' : undefined,
              backgroundColor: segment.color,
            }}
          />
            {dividerColor && index < segments.length - 1 ? (
              <div
                data-overlay-divider="true"
                style={{
                  width: orientation === 'horizontal' ? '2px' : '100%',
                  height: orientation === 'horizontal' ? '100%' : '2px',
                  backgroundColor: dividerColor,
                  opacity: clamp01(intensity + 0.2),
                }}
              />
            ) : null}
          </Fragment>
        ))}
      </div>
    );
  }

  return null;
};

export const ChessboardSquare = ({
  square,
  color,
  onPointerDown,
  onPointerEnter,
  onPointerUp,
  children,
  highlight,
  interactionHighlight,
  className,
  overlay,
  showContent = true,
  appearance,
  showIntensityLabel = false,
}: ChessboardSquareProps) => {
  const squareRef = useRef<HTMLDivElement | null>(null);
  const normalized = appearance.mode === 'normalized';
  let backgroundColor = color === 'light' ? appearance.lightSquare : appearance.darkSquare;
  let overlayNode: ReactNode = null;

  if (overlay) {
    const { style } = overlay;
    if (style.kind === 'solid' || style.kind === 'flag') {
      const alpha = Math.min(0.95, Math.max(0.35, style.intensity ?? 0.75));
      backgroundColor = colorWithAlpha(style.color, alpha);
      overlayNode = renderOverlay(overlay);
    } else {
      overlayNode = renderOverlay(overlay);
    }
  }

  let intensityLabel: string | null = null;
  if (showIntensityLabel && overlay) {
    const meta = overlay.meta;
    const total =
      meta?.count ??
      meta?.contested?.totalContributors ??
      null;
    if (total !== null && total !== undefined && total > 0) {
      intensityLabel = String(total);
    }
  }

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    if (!overlay || overlay.style.kind !== 'segmented') {
      return;
    }
    const { style } = overlay;
    console.log('[overlay descriptor]', {
      square,
      kind: style.kind,
      segments: style.segments.map((segment) => ({
        color: segment.color,
        proportion: segment.proportion,
        label: segment.label,
      })),
      orientation: style.orientation ?? 'horizontal',
      dividerColor: style.dividerColor ?? '(none)',
      intensity: style.intensity,
      glow: style.glow,
    });
  }, [overlay, square]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    if (!overlay || overlay.style.kind !== 'segmented') {
      return;
    }
    const root = squareRef.current;
    if (!root) {
      return;
    }

    const logComputedStyles = () => {
      const overlayContainer = root.querySelector('[data-overlay-kind="segmented"]') as HTMLDivElement | null;
      if (!overlayContainer) {
        console.warn('[overlay descriptor] segmented container missing', { square });
        return;
      }
      const computed = window.getComputedStyle(overlayContainer);
      const parentComputed = window.getComputedStyle(root);
      const segmentNodes = Array.from(
        overlayContainer.querySelectorAll<HTMLElement>('[data-overlay-segment="true"]'),
      );
      const segmentComputed = segmentNodes.map((node, index) => {
        const styles = window.getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return {
          index: node.dataset.overlaySegmentIndex ?? index.toString(),
          label: node.dataset.overlaySegmentLabel ?? null,
          expectedColor: node.dataset.overlaySegmentColor ?? null,
          backgroundColor: styles.backgroundColor,
          flexGrow: styles.flexGrow,
          flexBasis: styles.flexBasis,
          width: Number.isFinite(rect.width) ? Number(rect.width.toFixed(2)) : rect.width,
          height: Number.isFinite(rect.height) ? Number(rect.height.toFixed(2)) : rect.height,
          opacity: styles.opacity,
        };
      });
      console.log('[overlay computed styles]', {
        square,
        containerClass: overlayContainer.className,
        containerStyle: {
          display: computed.display,
          flexDirection: computed.flexDirection,
          opacity: computed.opacity,
          backgroundColor: computed.backgroundColor,
          boxShadow: computed.boxShadow,
        },
        parentClass: root.className,
        parentInlineStyle: root.getAttribute('style') ?? '(none)',
        parentComputed: {
          position: parentComputed.position,
          display: parentComputed.display,
          backgroundColor: parentComputed.backgroundColor,
        },
        dividerCount: overlayContainer.querySelectorAll('[data-overlay-divider="true"]').length,
        segments: segmentComputed,
      });
    };

    const raf = requestAnimationFrame(logComputedStyles);
    return () => cancelAnimationFrame(raf);
  }, [overlay, square]);

  return (
    <div
      role="presentation"
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerUp={onPointerUp}
      data-square={square}
      ref={squareRef}
      className={[
        'relative flex items-center justify-center overflow-hidden transition-colors duration-150',
        normalized ? '' : 'rounded-md',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        backgroundColor,
      }}
    >
      {intensityLabel ? (
        <span
          className="pointer-events-none absolute z-30 rounded-sm bg-slate-900/80 px-1.5 text-[10px] font-semibold leading-none text-slate-50 shadow-[0_1px_4px_rgba(15,23,42,0.55)]"
          style={{ top: 4, right: 4 }}
        >
          {intensityLabel}
        </span>
      ) : null}
      {overlayNode}
      {highlight && (
        <div
          className={[
            'absolute inset-0 pointer-events-none',
            normalized ? '' : 'rounded-md',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ backgroundColor: HIGHLIGHT_COLOR }}
        />
      )}
      {interactionHighlight && (
        <div
          className={[
            'absolute inset-0 pointer-events-none transition-colors duration-150',
            normalized ? '' : 'rounded-md',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ backgroundColor: getHighlightColor(interactionHighlight.kind) }}
        />
      )}
      <div className="relative z-10 flex h-full w-full select-none items-center justify-center pointer-events-none">
        {showContent ? children : null}
      </div>
    </div>
  );
};
