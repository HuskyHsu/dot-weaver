import { create } from 'zustand';
import { encodeStateToUrl, decodeStateFromUrl } from '../utils/urlState';

export type BeadState = Record<string, string>; // 'x,y': 'color'

interface BeadsState {
  beads: BeadState;
  undoStack: BeadState[];
  redoStack: BeadState[];
  placeBead: (x: number, y: number, color: string) => void;
  removeBead: (x: number, y: number) => void;
  setBeads: (beads: BeadState) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  // Note: Flood fill is complex, we will implement it in a separate hook or util
  // but call setBeads directly.
}

const pushToUndo = (current: BeadState, undoStack: BeadState[]): BeadState[] => {
  const newStack = [...undoStack, current];
  return newStack.slice(-50); // limit history
};

export const useBeadsStore = create<BeadsState>((set) => {
  // Initialize from URL if available
  const urlState = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('s') : null;
  const initialBeads = urlState ? decodeStateFromUrl(urlState) || {} : {};

  return {
    beads: initialBeads,
    undoStack: [],
    redoStack: [],
    placeBead: (x, y, color) => set((state) => {
      const key = `${x},${y}`;
      if (state.beads[key] === color) return state; // No change
      
      const newBeads = { ...state.beads, [key]: color };
      return {
        beads: newBeads,
        undoStack: pushToUndo(state.beads, state.undoStack),
        redoStack: [],
      };
    }),
    removeBead: (x, y) => set((state) => {
      const key = `${x},${y}`;
      if (!state.beads[key]) return state; // No change
      
      const newBeads = { ...state.beads };
      delete newBeads[key];
      return {
        beads: newBeads,
        undoStack: pushToUndo(state.beads, state.undoStack),
        redoStack: [],
      };
    }),
    setBeads: (newBeads) => set((state) => ({
      beads: newBeads,
      undoStack: pushToUndo(state.beads, state.undoStack),
      redoStack: [],
    })),
    undo: () => set((state) => {
      if (state.undoStack.length === 0) return state;
      const prev = state.undoStack[state.undoStack.length - 1];
      const newUndo = state.undoStack.slice(0, -1);
      return {
        beads: prev,
        undoStack: newUndo,
        redoStack: [...state.redoStack, state.beads],
      };
    }),
    redo: () => set((state) => {
      if (state.redoStack.length === 0) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      const newRedo = state.redoStack.slice(0, -1);
      return {
        beads: next,
        undoStack: pushToUndo(state.beads, state.undoStack),
        redoStack: newRedo,
      };
    }),
    clear: () => set((state) => {
       if (Object.keys(state.beads).length === 0) return state;
       return {
         beads: {},
         undoStack: pushToUndo(state.beads, state.undoStack),
         redoStack: []
       }
    })
  };
});

// Sync to URL
if (typeof window !== 'undefined') {
  useBeadsStore.subscribe((state) => {
    // Debounce this in a real app, but for now simple sync
    const currentUrl = new URL(window.location.href);
    if (Object.keys(state.beads).length > 0) {
      currentUrl.searchParams.set('s', encodeStateToUrl(state.beads));
    } else {
      currentUrl.searchParams.delete('s');
    }
    window.history.replaceState({}, '', currentUrl.toString());
  });
}
