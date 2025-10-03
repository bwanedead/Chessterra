import { OverlayOptionsRecord, OverlayRegistration, OverlayToolbarRegistration } from './types';

const overlayRegistry = new Map<string, OverlayRegistration<OverlayOptionsRecord>>();
const toolbarRegistry = new Map<string, OverlayToolbarRegistration<OverlayOptionsRecord>>();

export const registerOverlay = <TOptions extends OverlayOptionsRecord>(
  registration: OverlayRegistration<TOptions>,
) => {
  if (overlayRegistry.has(registration.id)) {
    return;
  }

  overlayRegistry.set(registration.id, registration as OverlayRegistration<OverlayOptionsRecord>);
};

export const registerOverlayToolbar = <TOptions extends OverlayOptionsRecord>(
  registration: OverlayToolbarRegistration<TOptions>,
) => {
  toolbarRegistry.set(
    registration.overlayId,
    registration as OverlayToolbarRegistration<OverlayOptionsRecord>,
  );
};

export const getOverlayRegistration = (id: string) => overlayRegistry.get(id);

export const getOverlayRegistrations = () =>
  Array.from(overlayRegistry.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const getOverlayToolbar = (id: string) => toolbarRegistry.get(id);
