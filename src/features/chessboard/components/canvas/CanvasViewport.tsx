import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties, ReactNode } from 'react';
import { useCanvasMode } from '@/features/chessboard/canvas/CanvasModeContext';
import { useLayerDiagnostics } from '@/features/chessboard/hooks/useLayerDiagnostics';
import { createScopedLogger, layoutDebugEnabled } from '@/shared/utils/logger';

interface CanvasViewportProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const CanvasViewport = ({ children, className, style }: CanvasViewportProps) => {
  const { isExpanded, notifyInteraction, updateViewportSize, registerScrollContainer } = useCanvasMode();
  const rafRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [portalHost] = useState<HTMLDivElement | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const host = document.createElement('div');
    host.setAttribute('data-canvas-viewport-host', 'true');
    host.style.position = 'fixed';
    host.style.top = '0';
    host.style.left = '0';
    host.style.right = '0';
    host.style.bottom = '0';
    host.style.zIndex = '1100';
    host.style.pointerEvents = 'auto';
    host.style.display = 'block';
    return host;
  });
  const diagnosticsEnabled = layoutDebugEnabled;
  const logger = useMemo(() => createScopedLogger('chessboard/canvas-viewport'), []);

  useLayerDiagnostics<HTMLDivElement>({
    ref: containerRef,
    logger,
    label: 'viewport',
    enabled: diagnosticsEnabled && isExpanded,
    dependencies: [isExpanded, diagnosticsEnabled],
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

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isExpanded]);

  useEffect(() => {
    if (!portalHost) {
      return;
    }
    if (!isExpanded) {
      if (portalHost.parentNode) {
        portalHost.parentNode.removeChild(portalHost);
      }
      return;
    }

    document.body.appendChild(portalHost);
    return () => {
      if (portalHost.parentNode) {
        portalHost.parentNode.removeChild(portalHost);
      }
    };
  }, [isExpanded, portalHost]);

  useEffect(() => {
    return () => {
      if (portalHost?.parentNode) {
        portalHost.parentNode.removeChild(portalHost);
      }
    };
  }, [portalHost]);

  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      registerScrollContainer(isExpanded ? node : null);
    },
    [isExpanded, registerScrollContainer],
  );

  const containerClass = useMemo(() => {
    const baseClass = isExpanded
      ? 'flex h-full w-full justify-center items-start overflow-auto bg-transparent'
      : 'relative';
    return [baseClass, className].filter(Boolean).join(' ');
  }, [className, isExpanded]);

  const content = (
    <div
      ref={setContainerRef}
      className={containerClass}
      style={style}
      data-expanded={isExpanded ? 'true' : 'false'}
    >
      {children}
    </div>
  );

  if (isExpanded && portalHost) {
    return createPortal(content, portalHost);
  }

  return content;
};
