interface NormalizeBoardToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export const NormalizeBoardToggle = ({ checked, onChange }: NormalizeBoardToggleProps) => {
  return (
    <div className="flex w-full max-w-[15rem] flex-col gap-2 rounded-xl border border-slate-700/70 bg-slate-900/75 p-3 text-slate-200 shadow-[0_22px_36px_-28px_rgba(15,23,42,0.9)] backdrop-blur">
      <label className="flex items-center justify-between gap-3 text-sm font-semibold uppercase tracking-[0.15em] text-slate-300">
        Normalize board
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="h-[18px] w-[18px] accent-slate-50"
        />
      </label>
      <p className="text-xs leading-relaxed text-slate-400">
        Renders an even black grid with a white wireframe so heatmaps sit front and center. We will surface color
        customization and expanded canvases from here in phase two.
      </p>
    </div>
  );
};
