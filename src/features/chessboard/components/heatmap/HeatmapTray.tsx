import type { ReactNode } from 'react';

interface HeatmapTrayProps {
  title?: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export const HeatmapTray = ({ title, description, footer, children }: HeatmapTrayProps) => (
  <aside
    className="flex flex-shrink-0 flex-col gap-4 text-slate-100"
    style={{ width: 'var(--tray-width, 9.5rem)' }}
  >
    {title ? (
      <header className="space-y-1 text-center">
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">{title}</h2>
        {description ? <p className="text-[11px] text-slate-500">{description}</p> : null}
      </header>
    ) : null}

    <div className="flex-1 space-y-3">{children}</div>

    {footer ? <footer>{footer}</footer> : null}
  </aside>
);
