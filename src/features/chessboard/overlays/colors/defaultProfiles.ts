import type { HeatmapColorProfileDefinition } from '@/features/chessboard/overlays/colors/types';

export const classicProfile: HeatmapColorProfileDefinition = {
  id: 'classic',
  label: 'Classic',
  description: 'Deep blues for white influence, crimson reds for black, and warm gold contested highlights.',
  pieces: {
    white: {
      p: { primary: '#3b82f6', accent: '#60a5fa' },
      n: { primary: '#2563eb', accent: '#1d4ed8' },
      b: { primary: '#1d4ed8', accent: '#1e3a8a' },
      r: { primary: '#1e3a8a', accent: '#1e40af' },
      q: { primary: '#1e40af', accent: '#1e3a8a' },
      k: { primary: '#312e81', accent: '#3730a3' },
    },
    black: {
      p: { primary: '#ef4444', accent: '#f87171' },
      n: { primary: '#dc2626', accent: '#ef4444' },
      b: { primary: '#b91c1c', accent: '#dc2626' },
      r: { primary: '#991b1b', accent: '#b91c1c' },
      q: { primary: '#7f1d1d', accent: '#991b1b' },
      k: { primary: '#450a0a', accent: '#7f1d1d' },
    },
  },
  heatmap: {
    white: { base: '#5dd3f6', target: '#003fa7' },
    black: { base: '#ffb1c4', target: '#a8002a' },
  },
  contested: {
    divider: '#94a3b8',
    flag: '#facc15',
    glow: '#fde047',
  },
  check: {
    inCheck: '#f97316',
    checkmate: '#facc15',
    looming: '#fb923c',
  },
};

export const mutedProfile: HeatmapColorProfileDefinition = {
  id: 'muted',
  label: 'Muted',
  description: 'Desaturated teals and plums tuned for low-light or distraction-free study.',
  pieces: {
    white: {
      p: { primary: '#2dd4bf', accent: '#5eead4' },
      n: { primary: '#14b8a6', accent: '#0d9488' },
      b: { primary: '#0f766e', accent: '#115e59' },
      r: { primary: '#0d9488', accent: '#0f766e' },
      q: { primary: '#0f766e', accent: '#134e4a' },
      k: { primary: '#134e4a', accent: '#115e59' },
    },
    black: {
      p: { primary: '#c084fc', accent: '#d8b4fe' },
      n: { primary: '#a855f7', accent: '#c084fc' },
      b: { primary: '#9333ea', accent: '#a855f7' },
      r: { primary: '#7e22ce', accent: '#9333ea' },
      q: { primary: '#6b21a8', accent: '#7e22ce' },
      k: { primary: '#581c87', accent: '#6b21a8' },
    },
  },
  heatmap: {
    white: { base: '#5fe9d0', target: '#0f766e' },
    black: { base: '#dcb4ff', target: '#6b21a8' },
  },
  contested: {
    divider: '#a1a1aa',
    flag: '#f59e0b',
    glow: '#fcd34d',
  },
  check: {
    inCheck: '#f97316',
    checkmate: '#fb923c',
    looming: '#fbbf24',
  },
};

export const contrastProfile: HeatmapColorProfileDefinition = {
  id: 'contrast',
  label: 'High Contrast',
  description: 'Accessibility focused palette with bold cyans and magentas and distinct contested markers.',
  pieces: {
    white: {
      p: { primary: '#06b6d4', accent: '#22d3ee' },
      n: { primary: '#0891b2', accent: '#0e7490' },
      b: { primary: '#0ea5e9', accent: '#0284c7' },
      r: { primary: '#0369a1', accent: '#0e7490' },
      q: { primary: '#1d4ed8', accent: '#1e40af' },
      k: { primary: '#1e3a8a', accent: '#312e81' },
    },
    black: {
      p: { primary: '#f472b6', accent: '#f9a8d4' },
      n: { primary: '#ec4899', accent: '#f472b6' },
      b: { primary: '#db2777', accent: '#ec4899' },
      r: { primary: '#be185d', accent: '#db2777' },
      q: { primary: '#9d174d', accent: '#be185d' },
      k: { primary: '#831843', accent: '#9d174d' },
    },
  },
  heatmap: {
    white: { base: '#38d0f5', target: '#0369a1' },
    black: { base: '#f99ac9', target: '#be185d' },
  },
  contested: {
    divider: '#e2e8f0',
    flag: '#fbbf24',
    glow: '#fde68a',
  },
  check: {
    inCheck: '#f97316',
    checkmate: '#facc15',
    looming: '#fbbf24',
  },
};

export const defaultProfiles: HeatmapColorProfileDefinition[] = [classicProfile, mutedProfile, contrastProfile];
