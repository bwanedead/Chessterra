import { BubbleButton } from './controls/BubbleButton';
import { useCanvasMode } from '@/features/chessboard/canvas';

interface ExpandCanvasToggleProps {
  className?: string;
}

export const ExpandCanvasToggle = ({ className }: ExpandCanvasToggleProps) => {
  const { isExpanded, toggle, notifyInteraction } = useCanvasMode();
  const label = isExpanded ? 'Exit canvas' : 'Expand canvas';
  const activeClassName = isExpanded
    ? 'shadow-[0_0_20px_rgba(56,189,248,0.45)] border-sky-200/70 text-slate-900 bg-sky-100'
    : undefined;
  const combinedClassName = [className, activeClassName].filter(Boolean).join(' ') || undefined;

  return (
    <BubbleButton
      label={label}
      active={isExpanded}
      onClick={() => {
        toggle();
        notifyInteraction();
      }}
      className={combinedClassName}
    />
  );
};
