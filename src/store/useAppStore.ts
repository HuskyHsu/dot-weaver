import { create } from 'zustand';
import { decodeStateFromUrl } from '../utils/urlState';

export type Tool = 'pan' | 'draw' | 'erase' | 'fill';
export type Mode = 'edit' | 'view';
export type ClickHighlightMode = 'row' | 'col' | 'color' | 'none';

interface AppState {
  mode: Mode;
  activeTool: Tool;
  activeColor: string;
  pegboardSize: number; // 0 means infinite/hidden
  highlightQuery: { type: 'row' | 'col' | 'color' | null; value: string[] | null };
  clickHighlightMode: ClickHighlightMode;
  setMode: (mode: Mode) => void;
  setActiveTool: (tool: Tool) => void;
  setActiveColor: (color: string) => void;
  setPegboardSize: (size: number) => void;
  setHighlightQuery: (query: AppState['highlightQuery']) => void;
  setClickHighlightMode: (mode: ClickHighlightMode) => void;
  paletteColors: string[];
  addPaletteColor: (color: string) => void;
  removePaletteColor: (color: string) => void;
}

export const CORE_COLORS = [
  '#000000', // Black
  '#FFFFFF', // White
  'rgba(255, 255, 255, 0.5)', // Translucent White
];

export const PRESET_COLORS = [
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FFA500', // Orange
  '#800080', // Purple
  '#FFC0CB', // Pink
  '#8B4513', // Brown
  '#808080', // Gray
  '#A52A2A', '#DEB887', '#5F9EA0', '#D2691E', '#FF7F50', '#6495ED',
];

const getInitialMode = (): Mode => {
  if (typeof window === 'undefined') return 'edit';
  const urlState = new URLSearchParams(window.location.search).get('s');
  if (!urlState) return 'edit';
  const decoded = decodeStateFromUrl(urlState);
  return decoded && Object.keys(decoded).length > 0 ? 'view' : 'edit';
};

export const useAppStore = create<AppState>((set) => ({
  mode: getInitialMode(),
  activeTool: 'draw',
  activeColor: CORE_COLORS[0],
  paletteColors: CORE_COLORS,
  pegboardSize: 0, // Default hidden
  highlightQuery: { type: null, value: null },
  clickHighlightMode: 'none',
  setMode: (mode) => set({ mode }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setActiveColor: (activeColor) => set({ activeColor }),
  setPegboardSize: (pegboardSize) => set({ pegboardSize }),
  setHighlightQuery: (highlightQuery) => set({ highlightQuery }),
  setClickHighlightMode: (clickHighlightMode: ClickHighlightMode) => set({ clickHighlightMode }),
  addPaletteColor: (color) => set((state) => {
    if (state.paletteColors.includes(color)) return state;
    return { paletteColors: [...state.paletteColors, color] };
  }),
  removePaletteColor: (color) => set((state) => {
    const newColors = state.paletteColors.filter(c => c !== color);
    if (newColors.length === 0) return state; // Prevent deleting the very last color
    return { 
      paletteColors: newColors,
      activeColor: state.activeColor === color ? newColors[0] : state.activeColor
    };
  }),
}));
