import type { ReactNode } from 'react';

interface HeatmapTrayProps {
  title?: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export const HeatmapTray = ({ title, description, footer, children }: HeatmapTrayProps) => (
  <aside className="flex w-56 flex-shrink-0 flex-col gap-5 rounded-3xl border border-slate-800/60 bg-slate-950/70 p-5 text-slate-100 shadow-xl shadow-slate-950/50 backdrop-blur-lg">
    {title ? (
      <header className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">{title}</h2>
        {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      </header>
    ) : null}

    <div className="flex-1 space-y-2">{children}</div>

    {footer ? <footer>{footer}</footer> : null}
  </aside>
);
