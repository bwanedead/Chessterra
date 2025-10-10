import type { HeatmapToggle } from '@/features/chessboard/hooks/useHeatmapControls';
import { ChessPieceSprite } from '@/features/chessboard/components/ChessPieceSprite';

interface HeatmapToggleButtonProps {
  toggle: HeatmapToggle;
  onToggle: (id: string) => void;
}

export const HeatmapToggleButton = ({ toggle, onToggle }: HeatmapToggleButtonProps) => {
  const indicator = toggle.active
    ? 'ring-2 ring-sky-400/70 ring-offset-2 ring-offset-slate-950 shadow-[0_0_18px_rgba(2,132,199,0.45)]'
    : 'shadow-inner shadow-slate-950/40';

  return (
    <button
      type="button"
      onClick={() => onToggle(toggle.id)}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/40 transition hover:bg-slate-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 ${indicator}`}
      aria-pressed={toggle.active}
      title={toggle.label}
    >
      <ChessPieceSprite piece={toggle.piece} size={22} />
    </button>
  );
};
