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

  const zoomTo = (newScale: number, anchor?: { x: number; y: number }) => {
    if (!containerRef.current) return;
    const state = useCanvasStore.getState();
    const currentScale = state.scale;
    const currentX = state.x;
    const currentY = state.y;
    if (currentScale === 0) return;
    
    // Clamp
    newScale = Math.max(0.1, Math.min(newScale, 5));

    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const SX = anchor ? anchor.x : cx;
    const SY = anchor ? anchor.y : cy;

    const newX = currentX + (SX - cx - currentX) * (currentScale - newScale) / currentScale;
    const newY = currentY + (SY - cy - currentY) * (currentScale - newScale) / currentScale;

    setTransform({ scale: newScale, x: newX, y: newY });
  };

  useGesture(
    {
      onDrag: ({ delta: [dx, dy], pinching }) => {
        if (pinching) return;
        if (mode === 'edit' && document.activeElement?.tagName === 'INPUT') return;
        const state = useCanvasStore.getState();
        setTransform({ x: state.x + dx, y: state.y + dy });
      },
      onPinch: ({ offset: [newScale] }) => {
        // Mobile pinch zooms relative to the center of the screen
        zoomTo(newScale);
      },
      onWheel: ({ event, delta: [, dy] }) => {
        event.preventDefault();
        if (!containerRef.current) return;
        const state = useCanvasStore.getState();
        const rect = containerRef.current.getBoundingClientRect();
        const anchor = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        };
        zoomTo(state.scale - dy * 0.01, anchor);
      }
    },
    {
      target: containerRef,
      eventOptions: { passive: false },
      drag: {
         filterTaps: true,
         enabled: true,
      },
      pinch: {
         from: () => [useCanvasStore.getState().scale, useCanvasStore.getState().rotation],
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
          willChange: 'transform'
        }}
      >
        {/* We place center at 50% 50% of the screen initially */}
        <div className="absolute top-1/2 left-1/2 w-0 h-0">
           <Grid />
           <BeadsLayer />
        </div>
      </div>
      
      {/* View Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-50">
        <button 
          onClick={() => zoomTo(scale + 0.2)}
          className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 text-gray-700 flex items-center justify-center"
          title="Zoom In"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <button 
          onClick={() => zoomTo(scale - 0.2)}
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
