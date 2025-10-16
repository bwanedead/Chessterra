import styles from './ControlStack.module.css';
import { BubbleButton } from './controls/BubbleButton';

interface NormalizeBoardToggleProps {
  normalized: boolean;
  onToggleNormalized: (value: boolean) => void;
  showPieces: boolean;
  onToggleShowPieces: (value: boolean) => void;
  className?: string;
}

export const NormalizeBoardToggle = ({
  normalized,
  onToggleNormalized,
  showPieces,
  onToggleShowPieces,
  className,
}: NormalizeBoardToggleProps) => (
  <div
    className={[
      'flex flex-col items-start text-slate-200',
      styles.stackSpacing,
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    <BubbleButton label="Normalized board" active={normalized} onClick={() => onToggleNormalized(!normalized)} />
    <BubbleButton label="Pieces" active={showPieces} onClick={() => onToggleShowPieces(!showPieces)} />
  </div>
);
