import { registerBoardTheme } from './registry';

registerBoardTheme({
  id: 'classic',
  label: 'Classic',
  description: 'Traditional wood-and-cream board.',
  mode: 'classic',
  lightSquare: '#f5deab',
  darkSquare: '#8b5a2b',
});

registerBoardTheme({
  id: 'normalized',
  label: 'Normalized',
  description: 'Wireframe analytical surface.',
  mode: 'normalized',
  lightSquare: '#000000',
  darkSquare: '#000000',
  wireframeColor: '#ffffff',
  backgroundColor: '#000000',
});

registerBoardTheme({
  id: 'endgame-slate',
  label: 'Endgame Slate',
  description: 'Cool slate palette for competitive play.',
  mode: 'classic',
  lightSquare: '#cbd5e1',
  darkSquare: '#475569',
});

registerBoardTheme({
  id: 'endgame-midnight',
  label: 'Endgame Midnight',
  description: 'High-contrast dark board for focused play.',
  mode: 'classic',
  lightSquare: '#334155',
  darkSquare: '#0f172a',
});
