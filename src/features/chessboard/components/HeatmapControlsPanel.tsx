import { useMemo } from 'react';
import type { HeatmapToggle } from '@/features/chessboard/hooks/useHeatmapControls';
import { HeatmapTray } from '@/features/chessboard/components/heatmap/HeatmapTray';
import { HeatmapToggleColumn } from '@/features/chessboard/components/heatmap/HeatmapToggleColumn';
import type { ChessPieceDescriptor } from '@/features/chessboard/types';

interface HeatmapControlsPanelProps {
  toggles: HeatmapToggle[];
  onToggle: (id: string) => void;
  onClear: () => void;
}

export const HeatmapControlsPanel = ({
  toggles,
  onToggle,
  onClear,
}: HeatmapControlsPanelProps) => {
  const ordered = useMemo(() => {
    const order: ChessPieceDescriptor['type'][] = ['p', 'b', 'n', 'r', 'q', 'k'];
    const selectBy = (color: 'w' | 'b') =>
      order
        .map((type) => toggles.find((toggle) => toggle.piece.color === color && toggle.piece.type === type))
        .filter((toggle): toggle is HeatmapToggle => Boolean(toggle));

    return {
      white: selectBy('w'),
      black: selectBy('b'),
    };
  }, [toggles]);

  return (
    <HeatmapTray>
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-start justify-center gap-2">
          <HeatmapToggleColumn toggles={ordered.black} onToggle={onToggle} />
          <HeatmapToggleColumn toggles={ordered.white} onToggle={onToggle} />
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-slate-700 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
        >
          Clear
        </button>
      </div>
    </HeatmapTray>
  );
};
