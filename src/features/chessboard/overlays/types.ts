import { ReactNode } from 'react';

export type OverlayLayerType = 'board-layer' | 'piece-decorator';

export interface OverlayGroupDescriptor {
  id: string;
  exclusive?: boolean;
}

export type OverlayOptionsRecord = Record<string, unknown>;

export interface OverlayRenderContext<TOptions extends OverlayOptionsRecord = OverlayOptionsRecord> {
  fen: string;
  orientation: 'white' | 'black';
  boardSize: number;
  squareSize: number;
  options: TOptions;
}

export interface OverlayRegistration<TOptions extends OverlayOptionsRecord = OverlayOptionsRecord> {
  id: string;
  label: string;
  description?: string;
  type: OverlayLayerType;
  order?: number;
  zIndex?: number;
  defaultActive?: boolean;
  defaultOptions: TOptions;
  group?: OverlayGroupDescriptor;
  pointerEvents?: 'auto' | 'none';
  render: (context: OverlayRenderContext<TOptions>) => ReactNode;
}

export interface OverlayToolbarProps<TOptions extends OverlayOptionsRecord = OverlayOptionsRecord> {
  overlayId: string;
  options: TOptions;
  active: boolean;
  setActive: (active: boolean) => void;
  updateOptions: (options: Partial<TOptions>) => void;
}

export interface OverlayToolbarRegistration<TOptions extends OverlayOptionsRecord = OverlayOptionsRecord> {
  overlayId: string;
  render: (props: OverlayToolbarProps<TOptions>) => ReactNode;
}
