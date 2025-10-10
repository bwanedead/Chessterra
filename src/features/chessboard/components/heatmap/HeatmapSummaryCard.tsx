interface HeatmapSummaryCardProps {
  activeLayers: number;
}

export const HeatmapSummaryCard = ({ activeLayers }: HeatmapSummaryCardProps) => {
  return (
    <div className="rounded-md bg-slate-800/70 px-3 py-2 text-xs text-slate-300">
      Active layers <span className="font-semibold text-blue-200">{activeLayers}</span>
    </div>
  );
};
