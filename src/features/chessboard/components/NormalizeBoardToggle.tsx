import styles from './ControlStack.module.css';
import { BubbleButton } from './controls/BubbleButton';

interface NormalizeButtonProps {
  normalized: boolean;
  onToggleNormalized: (value: boolean) => void;
  className?: string;
}

interface PiecesButtonProps {
  showPieces: boolean;
  onToggleShowPieces: (value: boolean) => void;
  className?: string;
}

const controlButtonClasses = styles.controlButton;

export const NormalizeBoardButton = ({ normalized, onToggleNormalized, className }: NormalizeButtonProps) => (
  <BubbleButton
    label="Normalize Board"
    active={normalized}
    onClick={() => onToggleNormalized(!normalized)}
    className={[controlButtonClasses, className].filter(Boolean).join(' ')}
  />
);

export const PiecesVisibilityButton = ({ showPieces, onToggleShowPieces, className }: PiecesButtonProps) => (
  <BubbleButton
    label="Pieces"
    active={showPieces}
    onClick={() => onToggleShowPieces(!showPieces)}
    className={[controlButtonClasses, className].filter(Boolean).join(' ')}
  />
);
