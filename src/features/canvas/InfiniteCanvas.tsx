import React, { useRef, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useAppStore } from '../../store/useAppStore';
import { useBeadsStore } from '../../store/useBeadsStore';
import { Grid } from './Grid';
import { BeadsLayer } from './BeadsLayer';

export const InfiniteCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { x, y, scale, rotation, setTransform, resetView } = useCanvasStore();
  const { mode } = useAppStore();

  const handleRecenter = () => {
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
      resetView(centerX * 20, centerY * 20); // 20 is GRID_SIZE
    } else {
      resetView(0, 0);
    }
  };

  useGesture(
    {
      onDrag: ({ offset: [dx, dy], memo, pinching }) => {
        if (pinching) return memo;
        if (mode === 'edit' && document.activeElement?.tagName === 'INPUT') return memo; // simple check
        setTransform({ x: dx, y: dy });
        return memo;
      },
      onPinch: ({ offset: [d], memo }) => {
        setTransform({ scale: d });
        return memo;
      },
      onWheel: ({ event, delta: [, dy] }) => {
        event.preventDefault();
        // Always zoom on wheel (no ctrlKey required) since panning is handled by drag
        const newScale = Math.max(0.1, Math.min(scale - dy * 0.01, 5));
        setTransform({ scale: newScale });
      }
    },
    {
      target: containerRef,
      eventOptions: { passive: false },
      drag: {
         from: () => [x, y],
         filterTaps: true,
         enabled: true, // we might want to disable drag in edit mode if drawing, but we can separate drawing to tap/drag on BeadsLayer
      },
      pinch: {
         from: () => [scale, rotation],
         scaleBounds: { min: 0.1, max: 5 },
      }
    }
  );

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', preventDefault);
    document.addEventListener('gesturechange', preventDefault);
    return () => {
      document.removeEventListener('gesturestart', preventDefault);
      document.removeEventListener('gesturechange', preventDefault);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-[var(--bg-color)] touch-none cursor-grab active:cursor-grabbing"
    >
      <div 
        className="origin-center w-full h-full"
        style={{
          transform: `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotation}deg)`,
        }}
      >
        {/* We place center at 50% 50% of the screen initially */}
        <div className="absolute top-1/2 left-1/2 w-0 h-0">
           <Grid />
           <BeadsLayer />
        </div>
      </div>
      
      {/* View Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-50">
        <button 
          onClick={() => setTransform({ scale: Math.min(scale + 0.2, 5) })}
          className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 text-gray-700 flex items-center justify-center"
          title="Zoom In"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <button 
          onClick={() => setTransform({ scale: Math.max(scale - 0.2, 0.1) })}
          className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 text-gray-700 flex items-center justify-center"
          title="Zoom Out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <button 
          onClick={handleRecenter}
          className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 text-gray-700 flex items-center justify-center"
          title="Recenter"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        </button>
      </div>
    </div>
  );
};
