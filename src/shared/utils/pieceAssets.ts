const REMOTE_WIKI_SET: Record<string, string> = {
  wP: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  wN: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  wB: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  wR: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  wQ: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  wK: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
  bP: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  bN: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  bB: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  bR: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  bQ: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  bK: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
};

export const DEFAULT_PIECE_STYLE = process.env.NEXT_PUBLIC_PIECE_STYLE ?? 'style-2';

const resolveLocalSprite = (piece: string, style: string) => `/assets/pieces/${style}/${piece}.png`;

const STYLE_RESOLVERS: Record<string, (piece: string) => string> = {
  'wiki-classic': (piece: string) => REMOTE_WIKI_SET[piece] ?? '',
  'style-1': (piece: string) => resolveLocalSprite(piece, 'style-1'),
  'style-2': (piece: string) => resolveLocalSprite(piece, 'style-2'),
};

export const getPieceSprite = (piece: string, style: string = DEFAULT_PIECE_STYLE) => {
  const resolver = STYLE_RESOLVERS[style] ?? STYLE_RESOLVERS['wiki-classic'];
  return resolver(piece);
};

export const listPieceStyles = () => Object.keys(STYLE_RESOLVERS);
