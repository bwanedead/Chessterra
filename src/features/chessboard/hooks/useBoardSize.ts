import { useEffect, useState } from 'react';

const DEFAULT_MAX_WIDTH = 480;

export const useBoardSize = (maxWidth: number = DEFAULT_MAX_WIDTH) => {
  const [width, setWidth] = useState(maxWidth);

  useEffect(() => {
    const calculate = () => {
      if (typeof window === 'undefined') return;
      const candidate = Math.min(window.innerWidth * 0.7, maxWidth);
      setWidth(Math.max(240, candidate));
    };

    calculate();
    window.addEventListener('resize', calculate);
    return () => window.removeEventListener('resize', calculate);
  }, [maxWidth]);

  return width;
};
