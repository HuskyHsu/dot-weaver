import { create } from 'zustand';
import { useBeadsStore } from './useBeadsStore';

interface CanvasState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  setTransform: (transform: Partial<{ x: number; y: number; scale: number; rotation: number }>) => void;
  resetView: (offsetX?: number, offsetY?: number) => void;
  rotate: (degrees: number) => void;
}

const getInitialOffsets = () => {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  const beads = useBeadsStore.getState().beads;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  Object.keys(beads).forEach(coord => {
    const [bx, by] = coord.split(',').map(Number);
    if (bx < minX) minX = bx;
    if (bx > maxX) maxX = bx;
    if (by < minY) minY = by;
    if (by > maxY) maxY = by;
  });

  if (minX !== Infinity) {
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    return { x: -centerX * 20, y: -centerY * 20 };
  }
  return { x: 0, y: 0 };
};

const initial = getInitialOffsets();

export const useCanvasStore = create<CanvasState>((set) => ({
  x: initial.x,
  y: initial.y,
  scale: 1,
  rotation: 0,
  setTransform: (transform) => set((state) => ({ ...state, ...transform })),
  resetView: (offsetX = 0, offsetY = 0) => set({ x: -offsetX, y: -offsetY, scale: 1, rotation: 0 }),
  rotate: (degrees) => set((state) => ({ rotation: state.rotation + degrees })),
}));
