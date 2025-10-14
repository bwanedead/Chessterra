import { BubbleButton } from './controls/BubbleButton';
import { useCanvasMode } from '@/features/chessboard/canvas';

export const ExpandCanvasToggle = () => {
  const { isExpanded, toggle, notifyInteraction } = useCanvasMode();
  const label = isExpanded ? 'Exit canvas' : 'Expand canvas';

  return (
    <BubbleButton
      label={label}
      active={isExpanded}
      onClick={() => {
        toggle();
        notifyInteraction();
      }}
      className={isExpanded ? 'shadow-[0_0_20px_rgba(56,189,248,0.45)] border-sky-200/70 text-slate-900 bg-sky-100' : undefined}
    />
  );
};
