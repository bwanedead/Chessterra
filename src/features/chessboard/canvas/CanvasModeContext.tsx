import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createScopedLogger } from '@/shared/utils/logger';

const DEFAULT_HIDE_DELAY = 2000;

interface CanvasModeContextValue {
  isExpanded: boolean;
  isChromeVisible: boolean;
  lastInteractionAt: number | null;
  viewportSize: { width: number; height: number };
  scrollContainer: HTMLDivElement | null;
  enter: () => void;
  exit: () => void;
  toggle: () => void;
  notifyInteraction: () => void;
  setHideDelay: (delay: number) => void;
  updateViewportSize: (size: { width: number; height: number }) => void;
  registerScrollContainer: (element: HTMLDivElement | null) => void;
}

const CanvasModeContext = createContext<CanvasModeContextValue | null>(null);

interface CanvasModeProviderProps {
  children: ReactNode;
  hideDelay?: number;
}

export const CanvasModeProvider = ({ children, hideDelay = DEFAULT_HIDE_DELAY }: CanvasModeProviderProps) => {
  const [isExpanded, setExpanded] = useState(false);
  const [isChromeVisible, setChromeVisible] = useState(true);
  const [currentHideDelay, setCurrentHideDelay] = useState(hideDelay);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);
  const lastInteractionRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const logger = useMemo(() => createScopedLogger('chessboard/canvas'), []);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(
    (delay: number = currentHideDelay) => {
      clearHideTimer();
      if (!isExpanded) {
        return;
      }
      hideTimerRef.current = window.setTimeout(() => {
        setChromeVisible(false);
        hideTimerRef.current = null;
        logger.debug('chrome-hidden', { delay });
      }, delay);
    },
    [clearHideTimer, currentHideDelay, isExpanded, logger],
  );

  const notifyInteraction = useCallback(() => {
    const timestamp = Date.now();
    lastInteractionRef.current = timestamp;
    setChromeVisible(true);
    if (isExpanded) {
      scheduleHide();
    }
  }, [isExpanded, scheduleHide]);

  const enter = useCallback(() => {
    if (isExpanded) {
      notifyInteraction();
      return;
    }

    setExpanded(true);
    setChromeVisible(true);
    lastInteractionRef.current = Date.now();
    logger.debug('enter');
    scheduleHide(currentHideDelay);
  }, [currentHideDelay, isExpanded, logger, notifyInteraction, scheduleHide]);

  const exit = useCallback(() => {
    if (!isExpanded) {
      return;
    }

    setExpanded(false);
    setChromeVisible(true);
    lastInteractionRef.current = Date.now();
    clearHideTimer();
    logger.debug('exit');
  }, [clearHideTimer, isExpanded, logger]);

  const toggle = useCallback(() => {
    if (isExpanded) {
      exit();
    } else {
      enter();
    }
  }, [enter, exit, isExpanded]);

  const setHideDelay = useCallback(
    (delay: number) => {
      setCurrentHideDelay(delay);
      if (isExpanded) {
        scheduleHide(delay);
      }
    },
    [isExpanded, scheduleHide],
  );

  const updateViewportSize = useCallback(
    (size: { width: number; height: number }) => {
      setViewportSize((prev) => {
        if (prev.width === size.width && prev.height === size.height) {
          return prev;
        }
        logger.debug('viewport-size', size);
        return size;
      });
    },
    [logger],
  );

  const registerScrollContainer = useCallback(
    (element: HTMLDivElement | null) => {
      setScrollContainer((previous) => {
        if (previous === element) {
          return previous;
        }
        if (process.env.NODE_ENV === 'development') {
          logger.debug('scroll-container', {
            action: element ? 'register' : 'unregister',
            hasElement: Boolean(element),
          });
        }
        return element;
      });
    },
    [logger],
  );

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        exit();
      } else if (event.key === 'Tab') {
        notifyInteraction();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [exit, isExpanded, notifyInteraction]);

  useEffect(() => {
    return () => {
      clearHideTimer();
    };
  }, [clearHideTimer]);

  const value = useMemo<CanvasModeContextValue>(
    () => ({
      isExpanded,
      isChromeVisible,
      lastInteractionAt: lastInteractionRef.current,
      viewportSize,
      scrollContainer,
      enter,
      exit,
      toggle,
      notifyInteraction,
      setHideDelay,
      updateViewportSize,
      registerScrollContainer,
    }),
    [
      enter,
      exit,
      isChromeVisible,
      isExpanded,
      notifyInteraction,
      registerScrollContainer,
      setHideDelay,
      toggle,
      updateViewportSize,
      viewportSize,
      scrollContainer,
    ],
  );

  return <CanvasModeContext.Provider value={value}>{children}</CanvasModeContext.Provider>;
};

export const useCanvasMode = () => {
  const context = useContext(CanvasModeContext);
  if (!context) {
    throw new Error('useCanvasMode must be used within a CanvasModeProvider');
  }
  return context;
};
