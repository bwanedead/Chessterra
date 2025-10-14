import { BubbleButton } from './controls/BubbleButton';

interface NormalizeBoardToggleProps {
  normalized: boolean;
  onToggleNormalized: (value: boolean) => void;
  showPieces: boolean;
  onToggleShowPieces: (value: boolean) => void;
}

export const NormalizeBoardToggle = ({
  normalized,
  onToggleNormalized,
  showPieces,
  onToggleShowPieces,
}: NormalizeBoardToggleProps) => (
  <div className="flex flex-col items-end gap-2 text-slate-200">
    <BubbleButton label="Normalized board" active={normalized} onClick={() => onToggleNormalized(!normalized)} />
    <BubbleButton label="Pieces" active={showPieces} onClick={() => onToggleShowPieces(!showPieces)} />
  </div>
);
