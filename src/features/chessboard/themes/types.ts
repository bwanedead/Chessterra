export interface BoardAppearance {
  mode: 'classic' | 'normalized';
  lightSquare: string;
  darkSquare: string;
  wireframeColor?: string;
  backgroundColor?: string;
}

export interface BoardTheme extends BoardAppearance {
  id: string;
  label: string;
  description?: string;
}

export type BoardThemeId = BoardTheme['id'];
