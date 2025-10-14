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
}: NormalizeBoardToggleProps) => {
  return (
    <div className="flex flex-col items-end gap-2 text-slate-200">
      <BubbleButton
        label="Normalized board"
        active={normalized}
        onClick={() => onToggleNormalized(!normalized)}
      />
      <BubbleButton
        label="Pieces"
        active={showPieces}
        onClick={() => onToggleShowPieces(!showPieces)}
      />
    </div>
  );
};

interface BubbleButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const BubbleButton = ({ label, active, onClick }: BubbleButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] transition-colors',
        active
          ? 'border-slate-200/80 bg-slate-100 text-slate-900 shadow-[0_0_18px_rgba(148,163,184,0.45)]'
          : 'border-slate-600/70 bg-slate-800/40 text-slate-300 hover:border-slate-400 hover:text-slate-100',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </button>
  );
};
