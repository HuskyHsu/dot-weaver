import React, { useRef } from 'react';
import { useGesture } from '@use-gesture/react';
import { useBeadsStore } from '../../store/useBeadsStore';
import { useAppStore } from '../../store/useAppStore';
import { floodFill } from '../../utils/floodFill';

const GRID_SIZE = 20;
const RADIUS = 200;

export const BeadsLayer: React.FC = React.memo(() => {
  const { beads, placeBead, removeBead, setBeads } = useBeadsStore();
  const { mode, activeTool, activeColor, highlightQuery, setHighlightQuery, clickHighlightMode } = useAppStore();
  const layerRef = useRef<HTMLDivElement>(null);

  const getCoord = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent | any) => {
    if (!layerRef.current) return null;
    const rect = layerRef.current.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.clientX !== undefined) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
       return null;
    }

    // Convert screen coordinates to local div coordinates, then to grid indices
    // This is a bit tricky with scale and rotation. Since we are inside the transformed div, 
    // we can use the native getBoundingClientRect mapping, but wait, pointer events on transformed elements 
    // provide clientX/Y. We can just use the inverse transform or let react's event handling do it?
    // Actually, native offsetX/offsetY on the event target gives local coords, but event target might be a bead.
    // Let's use bounding client rect to calculate.
    
    const x = (clientX - rect.left) / (rect.width / (RADIUS * 2 * GRID_SIZE));
    const y = (clientY - rect.top) / (rect.height / (RADIUS * 2 * GRID_SIZE));
    
    const gridX = Math.floor(x / GRID_SIZE) - RADIUS;
    const gridY = Math.floor(y / GRID_SIZE) - RADIUS;

    return { gridX, gridY };
  };

  const handleAction = (gridX: number, gridY: number) => {
    if (mode === 'edit') {
      if (activeTool === 'draw') {
        placeBead(gridX, gridY, activeColor);
      } else if (activeTool === 'erase') {
        removeBead(gridX, gridY);
      } else if (activeTool === 'fill') {
        const newBeads = floodFill(gridX, gridY, activeColor, beads);
        setBeads(newBeads);
      }
    }
  };

  useGesture({
    onPointerDown: ({ event }) => {
      // In view mode, allow panning (let event bubble to InfiniteCanvas)
      if (mode === 'view') return;
      
      // Allow pan tool to drag in edit mode
      if (activeTool === 'pan' && mode === 'edit') return;
      if (event.button !== 0 && event.type.includes('mouse')) return; 
      
      const coords = getCoord(event);
      if (coords) {
         event.stopPropagation();
         handleAction(coords.gridX, coords.gridY);
      }
    },
    // We can also implement drag to draw
    onDrag: ({ event, dragging, pinching }) => {
       if (pinching) return;
       if (mode === 'view') return; // no drag draw in view
       if (activeTool === 'fill' || activeTool === 'pan') return; // fill is click only, pan is handled by canvas

       const coords = getCoord(event);
       if (coords && dragging) {
           event.stopPropagation();
           handleAction(coords.gridX, coords.gridY);
       }
    }
  }, {
     target: layerRef,
     drag: { filterTaps: true, pointerEvents: true }
  });

  const beadElements = Object.entries(beads).map(([coord, color]) => {
    const [xStr, yStr] = coord.split(',');
    const x = parseInt(xStr, 10);
    const y = parseInt(yStr, 10);

    // Check highlight
    let isHighlighted = false;
    let isFaded = false;

    if (highlightQuery.type) {
       if (highlightQuery.type === 'row' && highlightQuery.value === yStr) isHighlighted = true;
       else if (highlightQuery.type === 'col' && highlightQuery.value === xStr) isHighlighted = true;
       else if (highlightQuery.type === 'color' && highlightQuery.value === color) isHighlighted = true;
       
       if (!isHighlighted) isFaded = true;
    }

    return (
      <div
        key={coord}
        className={`absolute rounded-full transition-all duration-200 flex items-center justify-center ${isFaded ? 'opacity-10' : ''}`}
        style={{
          width: GRID_SIZE,
          height: GRID_SIZE,
          left: (x + RADIUS) * GRID_SIZE,
          top: (y + RADIUS) * GRID_SIZE,
          backgroundColor: color,
          backdropFilter: color.includes('rgba') ? 'blur(2px)' : 'none',
          boxShadow: '1px 1px 2px rgba(0,0,0,0.25), inset -1px -2px 3px rgba(0,0,0,0.15), inset 1px 1px 2px rgba(255,255,255,0.4)',
          border: '0.5px solid rgba(0,0,0,0.1)'
        }}
      >
        {/* Hole in the middle */}
        <div 
          className="rounded-full" 
          style={{ 
            width: '35%', 
            height: '35%', 
            boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.3)',
            border: '0.5px solid rgba(0,0,0,0.1)'
          }} 
        />
      </div>
    );
  });

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== 'view') return;
    if (clickHighlightMode === 'none') return;
    
    const coords = getCoord(e);
    if (coords) {
       e.stopPropagation();
       if (clickHighlightMode === 'row') {
          setHighlightQuery({ type: 'row', value: String(coords.gridY) });
       } else if (clickHighlightMode === 'col') {
          setHighlightQuery({ type: 'col', value: String(coords.gridX) });
       } else if (clickHighlightMode === 'color') {
          const color = beads[`${coords.gridX},${coords.gridY}`];
          if (color) setHighlightQuery({ type: 'color', value: color });
       }
    }
  };

  return (
    <div 
      ref={layerRef}
      onClick={handleCanvasClick}
      className="absolute top-0 left-0 touch-none"
      style={{
        width: RADIUS * 2 * GRID_SIZE,
        height: RADIUS * 2 * GRID_SIZE,
        top: -RADIUS * GRID_SIZE,
        left: -RADIUS * GRID_SIZE,
      }}
    >
      {beadElements}
    </div>
  );
});
