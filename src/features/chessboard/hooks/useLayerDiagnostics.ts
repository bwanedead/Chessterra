import { useEffect } from 'react';
import type { LoggerApi } from '@/shared/utils/logger';

interface UseLayerDiagnosticsParams {
  ref: React.RefObject<HTMLElement>;
  logger: LoggerApi;
  label: string;
  enabled?: boolean;
  dependencies?: unknown[];
  sampleChildren?: boolean;
  sampleLimit?: number;
  extra?: () => Record<string, unknown> | void;
}

export const useLayerDiagnostics = ({
  ref,
  logger,
  label,
  enabled = process.env.NODE_ENV === 'development',
  dependencies = [],
  sampleChildren = false,
  sampleLimit = 6,
  extra,
}: UseLayerDiagnosticsParams) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const element = ref.current;
    if (!element) {
      logger.warn(`${label}-missing`);
      return;
    }

    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    const payload: Record<string, unknown> = {
      rect: {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top,
      },
      style: {
        position: style.position,
        zIndex: style.zIndex,
        backgroundColor: style.backgroundColor,
        opacity: style.opacity,
        mixBlendMode: style.mixBlendMode,
        pointerEvents: style.pointerEvents,
      },
    };

    if (sampleChildren) {
      const children = Array.from(element.children)
        .slice(0, sampleLimit)
        .map((child, index) => {
          const childElement = child as HTMLElement;
          const childRect = childElement.getBoundingClientRect();
          const childStyle = window.getComputedStyle(childElement);

          return {
            index,
            tagName: childElement.tagName.toLowerCase(),
            className: childElement.className,
            rect: {
              width: childRect.width,
              height: childRect.height,
              left: childRect.left,
              top: childRect.top,
            },
            style: {
              backgroundColor: childStyle.backgroundColor,
              opacity: childStyle.opacity,
              zIndex: childStyle.zIndex,
              mixBlendMode: childStyle.mixBlendMode,
              pointerEvents: childStyle.pointerEvents,
              display: childStyle.display,
            },
          };
        });

      payload.childrenSample = {
        count: element.childElementCount,
        sample: children,
      };
    }

    const extraPayload = extra?.();
    if (extraPayload) {
      payload.extra = extraPayload;
    }

    logger.debug(label, payload);
  }, [enabled, label, logger, ref, sampleChildren, sampleLimit, dependencies, extra]);
};
