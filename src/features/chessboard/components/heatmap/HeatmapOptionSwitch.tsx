interface HeatmapOptionSwitchProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export const HeatmapOptionSwitch = ({ label, checked, onChange }: HeatmapOptionSwitchProps) => {
  return (
    <label className="flex items-center justify-between text-sm text-slate-300">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-blue-400"
      />
    </label>
  );
};

