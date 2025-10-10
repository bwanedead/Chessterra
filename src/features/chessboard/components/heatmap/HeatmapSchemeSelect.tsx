import type { HeatmapScheme } from '@/features/chessboard/overlays/types';

interface HeatmapSchemeSelectProps {
  scheme: HeatmapScheme;
  setScheme: (scheme: HeatmapScheme) => void;
}

const options: { label: string; value: HeatmapScheme }[] = [
  { label: 'Line of Sight', value: 'line-of-sight' },
  { label: 'Absolute', value: 'absolute' },
];

export const HeatmapSchemeSelect = ({ scheme, setScheme }: HeatmapSchemeSelectProps) => {
  return (
    <label className="flex flex-col text-sm text-slate-300">
      Scheme
      <select
        className="mt-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-400 focus:outline-none focus-visible:ring focus-visible:ring-blue-400"
        value={scheme}
        onChange={(event) => setScheme(event.target.value as HeatmapScheme)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

