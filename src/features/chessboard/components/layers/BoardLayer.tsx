import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

interface BoardLayerProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  zIndex: number;
  pointerEvents?: 'auto' | 'none';
}

export const BoardLayer = forwardRef<HTMLDivElement, BoardLayerProps>(
  ({ children, className, style, zIndex, pointerEvents = 'none', ...rest }, ref) => (
    <div
      ref={ref}
      className={['absolute inset-0', className].filter(Boolean).join(' ')}
      style={{
        zIndex,
        pointerEvents,
        width: '100%',
        height: '100%',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  ),
);

BoardLayer.displayName = 'BoardLayer';
