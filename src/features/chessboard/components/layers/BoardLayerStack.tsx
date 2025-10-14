import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

interface BoardLayerStackProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const BoardLayerStack = forwardRef<HTMLDivElement, BoardLayerStackProps>(
  ({ children, className, style, ...rest }, ref) => (
    <div
      ref={ref}
      className={['relative h-full w-full', className].filter(Boolean).join(' ')}
      style={{
        contain: 'layout paint size',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  ),
);

BoardLayerStack.displayName = 'BoardLayerStack';
