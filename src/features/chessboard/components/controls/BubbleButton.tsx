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
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
        active
          ? 'border-slate-200/80 bg-slate-100 text-slate-900 shadow-[0_0_18px_rgba(148,163,184,0.45)]'
          : 'border-slate-600/70 bg-slate-800/40 text-slate-300 hover:border-slate-400 hover:text-slate-100',
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
