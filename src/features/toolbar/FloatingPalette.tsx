import React, { useState } from 'react';
import { useAppStore, PRESET_COLORS } from '../../store/useAppStore';
import { useBeadsStore } from '../../store/useBeadsStore';
import { Plus, X } from 'lucide-react';

const getContrastColor = (color: string) => {
  if (color.startsWith('rgb')) {
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      const r = parseInt(match[0], 10);
      const g = parseInt(match[1], 10);
      const b = parseInt(match[2], 10);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 140 ? '#1f2937' : '#ffffff'; // gray-800 or white
    }
  }
  const hex = color.replace('#', '');
  if (hex.length === 6 || hex.length === 3) {
    const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 140 ? '#1f2937' : '#ffffff';
  }
  return '#1f2937';
};

export const FloatingPalette: React.FC = () => {
  const { mode, activeColor, setActiveColor, activeTool, setActiveTool, paletteColors, addPaletteColor, removePaletteColor, highlightQuery, setHighlightQuery } = useAppStore();
  const { beads } = useBeadsStore();
  const [showPresets, setShowPresets] = useState(false);
  const customColorRef = React.useRef<HTMLInputElement>(null);

  // Auto-sync used colors to palette
  const colorCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(beads).forEach(color => {
      counts[color] = (counts[color] || 0) + 1;
      if (!paletteColors.includes(color)) {
         // Optionally, auto-add missing colors, but state updates in useMemo is bad practice.
         // Let's just do it in a useEffect or ensure placeBead adds to palette.
      }
    });
    return counts;
  }, [beads, paletteColors]);

  React.useEffect(() => {
     Object.keys(colorCounts).forEach(color => addPaletteColor(color));
  }, [colorCounts, addPaletteColor]);

  // Handle native change event for custom color picker to only add on confirm
  React.useEffect(() => {
    const el = customColorRef.current;
    if (!el) return;

    const handleChange = (e: Event) => {
      const color = (e.target as HTMLInputElement).value;
      const state = useAppStore.getState();
      state.addPaletteColor(color);
      state.setActiveColor(color);
      if (state.activeTool === 'erase' || state.activeTool === 'pan') {
         state.setActiveTool('draw');
      }
    };

    el.addEventListener('change', handleChange);
    return () => el.removeEventListener('change', handleChange);
  }, []);

  const handleColorSelect = (color: string) => {
    setActiveColor(color);
    if (activeTool === 'erase' || activeTool === 'pan') setActiveTool('draw');
  };

  const handleAddColor = (color: string) => {
    addPaletteColor(color);
    handleColorSelect(color);
    setShowPresets(false);
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-3">
      
      {/* Popover for Presets */}
      <div 
        className={`bg-white/95 backdrop-blur-sm p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 transition-all duration-300 origin-bottom ${showPresets ? 'pointer-events-auto scale-100 opacity-100 translate-y-0' : 'pointer-events-none scale-95 opacity-0 translate-y-4'}`}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-gray-700">Add New Color</h3>
          <button onClick={() => setShowPresets(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-6 gap-2">
           {PRESET_COLORS.map(color => (
             <button
                key={color}
                onClick={() => handleAddColor(color)}
                className="w-8 h-8 rounded-full border border-gray-200 hover:scale-110 transition-transform shadow-sm"
                style={{ backgroundColor: color }}
             />
           ))}
           {/* Custom Color Picker */}
           <div 
             className="relative w-8 h-8 rounded-full border border-gray-200 overflow-hidden shadow-sm hover:scale-110 transition-transform cursor-pointer"
             title="Custom Color"
           >
              <input 
                ref={customColorRef}
                type="color" 
                className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-full overflow-hidden">
                 <div className="w-full h-full" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} />
                 <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <Plus size={16} className="text-white drop-shadow-md" />
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Main Palette Bar */}
      <div className="pointer-events-auto bg-white/90 backdrop-blur-xl px-4 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-200 flex items-center space-x-3">
        {paletteColors.map(color => {
          const count = colorCounts[color] || 0;
          const isHighlighted = mode === 'view' && highlightQuery.type === 'color' && highlightQuery.value === color;
          
          return (
          <div key={color} className="relative flex justify-center group">
            <button
              onClick={() => {
                 if (mode === 'view') {
                    setHighlightQuery(isHighlighted ? { type: null, value: null } : { type: 'color', value: color });
                 } else {
                    handleColorSelect(color);
                 }
              }}
              className={`relative flex items-center justify-center w-10 h-10 rounded-full border-[3px] transition-transform shrink-0 ${
                (activeColor === color && activeTool !== 'erase' && activeTool !== 'pan' && mode === 'edit') || isHighlighted
                ? 'border-blue-500 scale-110 shadow-md z-10' 
                : 'border-transparent hover:scale-105'
              }`}
              style={{ 
                background: color.includes('rgba') 
                  ? `linear-gradient(${color}, ${color}), repeating-conic-gradient(#cbd5e1 0% 25%, #f1f5f9 0% 50%) 50% / 8px 8px`
                  : color,
                boxShadow: (activeColor !== color && !isHighlighted) ? 'inset 0 2px 4px rgba(0,0,0,0.2)' : 'none' 
              }}
              title={color}
            >
              {count > 0 && (
                <span 
                  className="text-[11px] font-bold z-20 pointer-events-none tracking-tight" 
                  style={{ 
                     color: getContrastColor(color),
                     textShadow: getContrastColor(color) === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.8)' : '0 1px 2px rgba(255,255,255,0.8)'
                  }}
                >
                  {count > 999 ? '999+' : count}
                </span>
              )}
            </button>
            
            {/* Delete unused color button */}
            {count === 0 && mode === 'edit' && paletteColors.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removePaletteColor(color);
                }}
                className="absolute -top-1 -left-1 w-[18px] h-[18px] bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 rounded-full flex items-center justify-center transition-colors shadow-sm z-30 md:opacity-0 md:group-hover:opacity-100"
                title="Remove unused color"
              >
                <X size={12} strokeWidth={3} />
              </button>
            )}
          </div>
        )})}
        
        {mode === 'edit' && (
          <>
            <div className="w-px h-8 bg-gray-200 mx-1" />
            <button
              onClick={() => setShowPresets(!showPresets)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${showPresets ? 'bg-blue-100 border-blue-200 text-blue-600 rotate-45' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-700'}`}
              title="Add Color"
            >
              <Plus size={24} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
