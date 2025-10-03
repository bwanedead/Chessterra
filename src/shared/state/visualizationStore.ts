import { useEffect } from 'react';
import { create } from 'zustand';
import {
  getOverlayRegistration,
  getOverlayRegistrations,
} from '@/features/chessboard/overlays/registry';
import { OverlayOptionsRecord } from '@/features/chessboard/overlays/types';

type OverlayState<TOptions extends OverlayOptionsRecord = OverlayOptionsRecord> = {
  id: string;
  active: boolean;
  options: TOptions;
};

interface VisualizationStoreState {
  overlays: Record<string, OverlayState>;
  hasInitialized: boolean;
  initialize: () => void;
  setOverlayActive: (id: string, active: boolean) => void;
  toggleOverlay: (id: string) => void;
  updateOverlayOptions: <TOptions extends OverlayOptionsRecord>(
    id: string,
    updater: (options: TOptions) => TOptions,
  ) => void;
}

export const useVisualizationStore = create<VisualizationStoreState>((set, get) => ({
  overlays: {},
  hasInitialized: false,
  initialize: () => {
    const registrations = getOverlayRegistrations();

    set((state) => {
      const overlays = { ...state.overlays };

      registrations.forEach((registration) => {
        if (!overlays[registration.id]) {
          overlays[registration.id] = {
            id: registration.id,
            active: registration.defaultActive ?? false,
            options: { ...registration.defaultOptions },
          };
        }
      });

      return {
        overlays,
        hasInitialized: true,
      };
    });
  },
  setOverlayActive: (id, active) => {
    const registration = getOverlayRegistration(id);
    if (!registration) {
      throw new Error(`Overlay with id "${id}" is not registered.`);
    }

    set((state) => {
      const current = state.overlays[id];
      if (!current) {
        return state;
      }

      const overlays = { ...state.overlays, [id]: { ...current, active } };

      if (active && registration.group?.exclusive && registration.group.id) {
        const { id: groupId } = registration.group;
        const registrationsInGroup = getOverlayRegistrations().filter(
          (item) => item.group?.id === groupId && item.id !== id,
        );

        registrationsInGroup.forEach((item) => {
          const candidate = overlays[item.id];
          if (candidate?.active) {
            overlays[item.id] = { ...candidate, active: false };
          }
        });
      }

      return { overlays };
    });
  },
  toggleOverlay: (id) => {
    const { overlays } = get();
    const current = overlays[id];
    if (!current) {
      throw new Error(`Overlay state for id "${id}" is missing.`);
    }

    get().setOverlayActive(id, !current.active);
  },
  updateOverlayOptions: (id, updater) => {
    set((state) => {
      const current = state.overlays[id];
      if (!current) {
        throw new Error(`Overlay state for id "${id}" is missing.`);
      }

      const registration = getOverlayRegistration(id);
      if (!registration) {
        throw new Error(`Overlay with id "${id}" is not registered.`);
      }

      const nextOptions = updater({
        ...(current.options as OverlayOptionsRecord),
      } as Parameters<typeof updater>[0]);

      return {
        overlays: {
          ...state.overlays,
          [id]: {
            ...current,
            options: nextOptions,
          },
        },
      };
    });
  },
}));

export const useOverlayState = <TOptions extends OverlayOptionsRecord = OverlayOptionsRecord>(
  id: string,
) =>
  useVisualizationStore((state) => state.overlays[id] as OverlayState<TOptions> | undefined);

export const useVisualizationInitialization = () => {
  const hasInitialized = useVisualizationStore((state) => state.hasInitialized);
  const initialize = useVisualizationStore((state) => state.initialize);

  useEffect(() => {
    if (!hasInitialized) {
      initialize();
    }
  }, [hasInitialized, initialize]);
};
