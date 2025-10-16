import type { ReactNode } from 'react';
import styles from '../ControlStack.module.css';
import { useCanvasMode } from '@/features/chessboard/canvas/CanvasModeContext';

interface CanvasChromeProps {
  children: ReactNode;
  className?: string;
}

export const CanvasChrome = ({ children, className }: CanvasChromeProps) => {
  const { isExpanded, isChromeVisible, notifyInteraction } = useCanvasMode();

  return (
    <div
      className={[
        'relative flex flex-col transition-opacity duration-300',
        styles.stackSpacing,
        isExpanded && !isChromeVisible ? 'opacity-0 pointer-events-none' : 'opacity-100',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseMove={notifyInteraction}
      onPointerDown={notifyInteraction}
    >
      {children}
    </div>
  );
};

CanvasChrome.displayName = 'CanvasChrome';
