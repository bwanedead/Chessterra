/**
 * Generates src/data/position-pool.json with validated endgame FENs.
 * Run: node scripts/generate-position-pool.mjs
 */
import { Chess } from 'chess.js';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const TARGET = 500;
const __dirname = dirname(fileURLToPath(import.meta.url));

const SEED_FENS = [
  '6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1',
  '6k1/ppp5/8/8/8/8/5PPP/6K1 w - - 0 1',
  '5k2/5ppp/8/8/8/8/5PPP/4K3 w - - 0 1',
  '4k3/5ppp/8/8/8/8/5PPP/5K2 w - - 0 1',
  '8/5k2/5ppp/8/8/8/5PPP/5K2 w - - 0 1',
  '8/8/4k3/5ppp/8/8/5PPP/5K2 w - - 0 1',
  '8/8/8/4k3/5ppp/8/5PPP/5K2 w - - 0 1',
  '8/8/8/8/4k3/5ppp/8/5PPP/5K2 w - - 0 1',
  '8/8/8/8/8/4k3/5ppp/5PPP/5K2 w - - 0 1',
  '8/4k3/8/5ppp/8/8/5PPP/5K2 w - - 0 1',
  '8/8/8/4k3/8/5ppp/5PPP/5K2 w - - 0 1',
  '8/8/8/8/4k3/5ppp/5PPP/4K3 w - - 0 1',
  '8/8/8/8/4k3/5ppp/4PPP/4K3 w - - 0 1',
  '8/8/8/8/4k3/4ppp/5PPP/4K3 w - - 0 1',
  '8/8/8/8/4k3/5ppp/4PPP/4K3 w - - 0 1',
  '8/8/8/8/4k3/5ppp/5PPP/4K3 b - - 0 1',
  '8/8/8/8/4k3/5ppp/5PPP/5K2 b - - 0 1',
  '8/8/8/4k3/8/5ppp/5PPP/5K2 b - - 0 1',
  '8/8/4k3/5ppp/8/8/5PPP/5K2 b - - 0 1',
  '6k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1',
  '8/8/8/8/4k3/8/4R3/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/R7/4K3 w - - 0 1',
  '8/8/8/4k3/8/8/4R3/4K3 w - - 0 1',
  '8/8/4k3/8/8/8/4R3/4K3 w - - 0 1',
  '8/4k3/8/8/8/8/4R3/4K3 w - - 0 1',
  '4k3/8/8/8/8/8/4R3/4K3 w - - 0 1',
  '8/8/8/8/4k3/4r3/8/4K2R w - - 0 1',
  '8/8/8/8/4k3/4r3/8/R3K3 w - - 0 1',
  '8/8/8/4k3/8/4r3/8/4K2R w - - 0 1',
  '8/8/4k3/8/8/4r3/8/4K2R w - - 0 1',
  '8/8/8/8/4k3/8/4r3/4K2R w - - 0 1',
  '8/8/8/8/4k3/8/4R3/4k3 w - - 0 1',
  '8/8/8/8/3k4/8/4R3/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/3R4/4K3 w - - 0 1',
  '8/8/8/3k4/8/8/4R3/4K3 w - - 0 1',
  '8/8/3k4/8/8/8/4R3/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/4R3/4K3 b - - 0 1',
  '8/8/8/8/4k3/4r3/8/4K2R b - - 0 1',
  '8/8/8/8/4k3/8/4r3/4K2R b - - 0 1',
  '8/8/8/8/4k3/8/4B3/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/7B/4K3 w - - 0 1',
  '8/8/8/4k3/8/8/2B5/4K3 w - - 0 1',
  '8/8/4k3/8/8/8/2B5/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/4b3/4K1B1 w - - 0 1',
  '8/8/8/8/4k3/4b3/8/4K1B1 w - - 0 1',
  '8/8/8/8/4k3/8/4N3/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/5N2/4K3 w - - 0 1',
  '8/8/8/4k3/8/8/2N5/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/4n3/4K1N1 w - - 0 1',
  '8/8/8/8/4k3/4n3/8/4K1N1 w - - 0 1',
  '8/8/8/8/4k3/8/4Q3/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/7Q/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/4q3/4K1Q1 w - - 0 1',
  '8/8/8/8/4k3/4q3/8/4K1Q1 w - - 0 1',
  '8/8/8/8/4k3/8/3Q4/4K3 w - - 0 1',
  '8/8/8/3k4/8/8/3Q4/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/4R3/5K2 w - - 0 1',
  '8/8/8/8/4k3/8/5R2/5K2 w - - 0 1',
  '8/8/8/8/4k3/8/6R1/5K2 w - - 0 1',
  '8/8/8/8/4k3/8/4R3/5K1P w - - 0 1',
  '8/8/8/8/4k3/5p2/4R3/5K1P w - - 0 1',
  '8/8/8/8/4k3/5ppp/4R3/5K2 w - - 0 1',
  '8/8/8/8/4k3/5ppp/4R3/5KP2 w - - 0 1',
  '8/8/8/8/4k3/4ppp/4R3/5K2 w - - 0 1',
  '8/8/8/8/4k3/8/4R2P/5K2 w - - 0 1',
  '8/8/8/8/4k3/8/5RP1/5K2 w - - 0 1',
  '8/8/8/8/4k3/8/4BN2/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/4NB2/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/4BP2/4K3 w - - 0 1',
  '8/8/8/8/4k3/4pp2/4BN2/4K3 w - - 0 1',
  '8/8/8/8/4k3/5pp1/4BN2/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/3BN2/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/4R1N1/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/4RN2/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/4R1B1/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/4RB1/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/2R1B3/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/2RB4/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/1R2B3/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/1RB5/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/R3B3/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/RB6/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/4Q1R1/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/4QR2/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/2Q1R3/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/2QR4/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/1Q2R3/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/1QR5/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/Q3R3/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/QR6/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/4Q1N1/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/4QN2/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/3Q1N2/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/3QN3/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/2Q1N3/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/2QN4/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/1Q2N3/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/1QN6/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/Q2N4/4K3 w - - 0 1',
  '8/8/8/8/4k3/8/QN7/4K3 w - - 0 1',
];

const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const countPieces = (game) => {
  const board = game.board();
  let total = 0;
  const kings = { w: 0, b: 0 };
  for (const row of board) {
    for (const square of row) {
      if (!square) continue;
      total += 1;
      if (square.type === 'k') {
        kings[square.color] += 1;
      }
    }
  }
  return { total, kings };
};

const isPlayableEndgame = (game) => {
  if (game.isGameOver()) {
    return false;
  }
  const { total, kings } = countPieces(game);
  if (kings.w !== 1 || kings.b !== 1) {
    return false;
  }
  if (total < 3 || total > 14) {
    return false;
  }
  return true;
};

const materialSignature = (game) => {
  const order = ['q', 'r', 'b', 'n', 'p'];
  const tally = { w: {}, b: {} };
  const board = game.board();
  for (const row of board) {
    for (const square of row) {
      if (!square || square.type === 'k') continue;
      const side = square.color;
      tally[side][square.type] = (tally[side][square.type] ?? 0) + 1;
    }
  }
  const formatSide = (side) =>
    order
      .map((piece) => {
        const count = tally[side][piece] ?? 0;
        if (count === 0) return '';
        return count === 1 ? piece.toUpperCase() : `${piece.toUpperCase()}${count}`;
      })
      .join('');
  return `w:${formatSide('w') || 'K'}:b:${formatSide('b') || 'K'}`;
};

const inferTags = (signature, pieceCount) => {
  const tags = ['endgame'];
  if (signature.includes('P')) tags.push('pawns');
  if (signature.includes('R')) tags.push('rooks');
  if (signature.includes('Q')) tags.push('queens');
  if (signature.includes('B')) tags.push('bishops');
  if (signature.includes('N')) tags.push('knights');
  if (pieceCount <= 5) tags.push('light');
  if (pieceCount >= 9) tags.push('heavy');
  return tags;
};

const tryAdd = (fenSet, entries, fen) => {
  if (fenSet.has(fen)) {
    return false;
  }
  const game = new Chess();
  try {
    game.load(fen);
  } catch {
    return false;
  }
  if (!isPlayableEndgame(game)) {
    return false;
  }
  fenSet.add(fen);
  const { total } = countPieces(game);
  const signature = materialSignature(game);
  entries.push({
    fen,
    materialSignature: signature,
    pieceCount: total,
    tags: inferTags(signature, total),
  });
  return true;
};

const expandFromSeed = (fenSet, entries, seed, maxDepth = 6, branch = 10) => {
  const queue = [{ fen: seed, depth: 0 }];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    let game;
    try {
      game = new Chess(current.fen);
    } catch {
      continue;
    }
    const moves = shuffle(game.moves());
    for (const move of moves.slice(0, branch)) {
      const trial = new Chess(current.fen);
      try {
        trial.move(move);
      } catch {
        continue;
      }
      const nextFen = trial.fen();
      if (tryAdd(fenSet, entries, nextFen) && current.depth < maxDepth) {
        queue.push({ fen: nextFen, depth: current.depth + 1 });
      }
      if (entries.length >= TARGET) {
        return;
      }
    }
  }
};

const mirrorFileFen = (fen) => {
  const parts = fen.split(' ');
  const ranks = parts[0].split('/');
  const mirroredRanks = ranks.map((rank) => {
    const expanded = [];
    for (const char of rank) {
      if (char >= '1' && char <= '8') {
        expanded.push(...'.'.repeat(Number(char)).split(''));
      } else {
        expanded.push(char);
      }
    }
    const flipped = expanded.reverse();
    let compressed = '';
    let run = 0;
    for (const cell of flipped) {
      if (cell === '.') {
        run += 1;
      } else {
        if (run > 0) {
          compressed += String(run);
          run = 0;
        }
        compressed += cell;
      }
    }
    if (run > 0) {
      compressed += String(run);
    }
    return compressed;
  });
  return [mirroredRanks.join('/'), ...parts.slice(1)].join(' ');
};

const fenSet = new Set();
const rawEntries = [];

for (const seed of SEED_FENS) {
  tryAdd(fenSet, rawEntries, seed);
  tryAdd(fenSet, rawEntries, mirrorFileFen(seed));
  if (rawEntries.length >= TARGET) break;
}

for (const seed of SEED_FENS) {
  expandFromSeed(fenSet, rawEntries, seed, 5, 12);
  expandFromSeed(fenSet, rawEntries, mirrorFileFen(seed), 5, 12);
  if (rawEntries.length >= TARGET) break;
}

let attempts = 0;
while (rawEntries.length < TARGET && attempts < 50_000) {
  attempts += 1;
  const seed = SEED_FENS[attempts % SEED_FENS.length];
  const game = new Chess(seed);
  const moves = shuffle(game.moves());
  if (moves.length === 0) continue;
  const trial = new Chess(seed);
  for (let i = 0; i < 3; i += 1) {
    const nextMoves = trial.moves();
    if (nextMoves.length === 0) break;
    trial.move(nextMoves[Math.floor(Math.random() * nextMoves.length)]);
  }
  tryAdd(fenSet, rawEntries, trial.fen());
}

if (rawEntries.length < TARGET) {
  throw new Error(`Only generated ${rawEntries.length} positions (target ${TARGET})`);
}

const entries = rawEntries.slice(0, TARGET).map((entry, index) => ({
  id: `eg-pool-${String(index + 1).padStart(3, '0')}`,
  ...entry,
  note: `Generated endgame #${index + 1} (${entry.pieceCount} pieces)`,
}));

const pool = {
  version: 1,
  generatedAt: new Date().toISOString(),
  count: entries.length,
  entries,
};

const outputPath = join(__dirname, '../src/data/position-pool.json');
writeFileSync(outputPath, `${JSON.stringify(pool, null, 2)}\n`);
console.log(`Wrote ${entries.length} positions to ${outputPath}`);
