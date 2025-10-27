import styles from './ChessteraTitle.module.css';

type ChessteraTitleProps = {
  hidden?: boolean;
};

const GLYPH_HEIGHT = 7;
const WORD = 'chesstera';

const GLYPHS: Record<string, string[]> = {
  c: ['011110', '110011', '110000', '110000', '110000', '110011', '011110'],
  h: ['110011', '110011', '110011', '111111', '110011', '110011', '110011'],
  e: ['111111', '110000', '110000', '111110', '110000', '110000', '111111'],
  s: ['011111', '110000', '110000', '011110', '000011', '000011', '111110'],
  t: ['111111', '001100', '001100', '001100', '001100', '001100', '001100'],
  r: ['111110', '110011', '110011', '111110', '110110', '110011', '110011'],
  a: ['011110', '110011', '110011', '111111', '110011', '110011', '110011'],
  blank: ['000000', '000000', '000000', '000000', '000000', '000000', '000000'],
};

const buildMatrixRows = (): string[] =>
  Array.from({ length: GLYPH_HEIGHT }, (_, rowIndex) =>
    WORD.split('')
      .map((letter, idx) => {
        const glyph = GLYPHS[letter] ?? GLYPHS.blank;
        const rowBits = glyph[rowIndex] ?? GLYPHS.blank[rowIndex];
        const spacer = idx < WORD.length - 1 ? '0' : '';
        return `${rowBits}${spacer}`;
      })
      .join('')
  );

const MATRIX_ROWS = buildMatrixRows();

const buildAccentMask = (): string[] =>
  MATRIX_ROWS.map((row, rowIndex) =>
    row
      .split('')
      .map((cell, columnIndex) => {
        if (cell !== '1') {
          return '0';
        }
        const neighbours = [
          MATRIX_ROWS[rowIndex]?.[columnIndex - 1],
          MATRIX_ROWS[rowIndex]?.[columnIndex + 1],
          MATRIX_ROWS[rowIndex - 1]?.[columnIndex],
          MATRIX_ROWS[rowIndex + 1]?.[columnIndex],
        ];
        return neighbours.some((value) => value !== '1') ? '1' : '0';
      })
      .join('')
  );

const ACCENT_ROWS = buildAccentMask();

const isDeadPixel = (row: number, col: number) => ((row * 89 + col * 53) % 193 === 0);
const isFlickerPixel = (row: number, col: number) => ((row * 71 + col * 41) % 137 === 0);

export const ChessteraTitle = ({ hidden = false }: ChessteraTitleProps) => {
  if (hidden) {
    return null;
  }

  return (
    <div className={styles.wrapper} aria-hidden>
      <div className={styles.scanOverlay} />
      <div className={styles.backdrop} />
      <div className={styles.matrix}>
        {MATRIX_ROWS.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className={styles.row}>
            {row.split('').map((cell, columnIndex) => {
              const filled = cell === '1';
              const accent = ACCENT_ROWS[rowIndex]?.[columnIndex] === '1';
              const dead = !filled && isDeadPixel(rowIndex, columnIndex);
              const flicker = filled && isFlickerPixel(rowIndex, columnIndex);
              const classes = [
                styles.cell,
                filled ? styles.filled : styles.empty,
                accent ? styles.accent : '',
                dead ? styles.dead : '',
                flicker ? styles.flicker : '',
              ]
                .filter(Boolean)
                .join(' ');
              const delay = (columnIndex * 0.018 + rowIndex * 0.07).toFixed(3);

              return (
                <span
                  key={`cell-${rowIndex}-${columnIndex}`}
                  className={classes}
                  style={filled ? { animationDelay: `${delay}s` } : undefined}
                >
                  {filled ? '\u2588' : ' '}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

ChessteraTitle.displayName = 'ChessteraTitle';

