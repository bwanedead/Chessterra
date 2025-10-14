import { useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { useCanvasMode } from '@/features/chessboard/canvas/CanvasModeContext';
import { useLayerDiagnostics } from '@/features/chessboard/hooks/useLayerDiagnostics';
import { createScopedLogger } from '@/shared/utils/logger';

interface CanvasViewportProps {
  children: ReactNode;
  className?: string;
}

export const CanvasViewport = ({ children, className }: CanvasViewportProps) => {
  const { isExpanded, notifyInteraction, updateViewportSize } = useCanvasMode();
  const rafRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const diagnosticsEnabled = process.env.NODE_ENV === 'development';
  const logger = useMemo(() => createScopedLogger('chessboard/canvas-viewport'), []);

  useLayerDiagnostics({
    ref: containerRef,
    logger,
    label: 'viewport',
    enabled: diagnosticsEnabled && isExpanded,
    dependencies: [isExpanded],
    extra: () => {
      const element = containerRef.current;
      if (!element) {
        return undefined;
      }

      return {
        childCount: element.childElementCount,
        childLayouts: Array.from(element.children).map((child, index) => {
          const childElement = child as HTMLElement;
          const rect = childElement.getBoundingClientRect();
          return {
            index,
            tagName: childElement.tagName.toLowerCase(),
            className: childElement.className,
            rect: {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            },
            position: getComputedStyle(childElement).position,
          };
        }),
      };
    },
  });

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const handlePointerMove = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        notifyInteraction();
      });
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('mousedown', notifyInteraction, { passive: true });
    window.addEventListener('touchstart', notifyInteraction, { passive: true });

    const updateSize = () => {
      updateViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mousedown', notifyInteraction);
      window.removeEventListener('touchstart', notifyInteraction);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isExpanded, notifyInteraction, updateViewportSize]);

  const containerClass = useMemo(
    () =>
      [
        'relative',
        isExpanded ? 'z-[1100] transition-colors duration-300 bg-transparent' : '',
        className,
      ]
        .filter(Boolean)
        .join(' '),
    [className, isExpanded],
  );

  return (
    <div ref={containerRef} className={containerClass}>
      {children}
    </div>
  );
};
