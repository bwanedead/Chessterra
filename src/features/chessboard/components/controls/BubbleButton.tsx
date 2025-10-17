import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface BubbleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
}

export const BubbleButton = forwardRef<HTMLButtonElement, BubbleButtonProps>(
  ({ label, active = false, className, onClick, ...rest }, ref) => (
    <button
      type="button"
      ref={ref}
      onClick={onClick}
      aria-pressed={active}
      className={[
        'inline-flex items-center justify-center rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-center transition-colors transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
        active
          ? 'border-sky-200/90 bg-sky-100/95 text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.6)] ring-1 ring-sky-200/80'
          : 'border-slate-600/70 bg-slate-800/55 text-slate-300 hover:border-slate-400 hover:text-slate-100 hover:shadow-[0_0_18px_rgba(148,163,184,0.4)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {label}
    </button>
  ),
);

BubbleButton.displayName = 'BubbleButton';
