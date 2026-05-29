import { useGesture } from '@use-gesture/react';
import React, { useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useBeadsStore } from '../../store/useBeadsStore';
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

  useGesture(
    {
      onPointerDown: ({ event }) => {
        // In view mode, allow panning (let event bubble) unless highlight mode is active
        if (mode === 'view') {
          if (clickHighlightMode !== 'none') {
            const coords = getCoord(event);
            if (coords) {
              event.stopPropagation();
              if (clickHighlightMode === 'row') {
                const y = String(coords.gridY);
                const currentQuery = useAppStore.getState().highlightQuery;
                if (currentQuery.type === 'row' && currentQuery.value?.includes(y)) {
                  const newVal = currentQuery.value.filter((v) => v !== y);
                  setHighlightQuery(newVal.length > 0 ? { type: 'row', value: newVal } : { type: null, value: null });
                } else {
                  setHighlightQuery({ type: 'row', value: [y] });
                }
              } else if (clickHighlightMode === 'col') {
                const x = String(coords.gridX);
                const currentQuery = useAppStore.getState().highlightQuery;
                if (currentQuery.type === 'col' && currentQuery.value?.includes(x)) {
                  const newVal = currentQuery.value.filter((v) => v !== x);
                  setHighlightQuery(newVal.length > 0 ? { type: 'col', value: newVal } : { type: null, value: null });
                } else {
                  setHighlightQuery({ type: 'col', value: [x] });
                }
              } else if (clickHighlightMode === 'color') {
                const color = beads[`${coords.gridX},${coords.gridY}`];
                const currentQuery = useAppStore.getState().highlightQuery;
                if (color) {
                  if (currentQuery.type === 'color' && currentQuery.value?.includes(color)) {
                    const newVal = currentQuery.value.filter((v) => v !== color);
                    setHighlightQuery(newVal.length > 0 ? { type: 'color', value: newVal } : { type: null, value: null });
                  } else {
                    setHighlightQuery({ type: 'color', value: [color] });
                  }
                }
              }
            }
          }
          return;
        }

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
      onDrag: ({ event, dragging, pinching, cancel }) => {
        if (pinching) return;

        if (mode === 'view') {
          if (clickHighlightMode === 'row' || clickHighlightMode === 'col') {
            const coords = getCoord(event);
            if (coords && dragging) {
              event.stopPropagation();
              const newVal = clickHighlightMode === 'row' ? String(coords.gridY) : String(coords.gridX);
              const currentQuery = useAppStore.getState().highlightQuery;
              const currentArr = currentQuery.type === clickHighlightMode && currentQuery.value ? currentQuery.value : [];
              if (!currentArr.includes(newVal)) {
                useAppStore.getState().setHighlightQuery({ type: clickHighlightMode, value: [...currentArr, newVal] });
              }
            }
          }
          return;
        }

        if (activeTool === 'fill' || activeTool === 'pan') return; // fill is click only, pan is handled by canvas

        // Prevent stuck drag state if mouse button was released during an alert
        if ('buttons' in event && (event as any).buttons === 0) {
          cancel();
          return;
        }

        const coords = getCoord(event);
        if (coords && dragging) {
          event.stopPropagation();
          handleAction(coords.gridX, coords.gridY);
        }
      },
    },
    {
      target: layerRef,
      drag: { filterTaps: true, pointerEvents: true },
    },
  );

  const beadElements = Object.entries(beads).map(([coord, color]) => {
    const [xStr, yStr] = coord.split(',');
    const x = parseInt(xStr, 10);
    const y = parseInt(yStr, 10);

    // Check highlight
    let isHighlighted = false;
    let isFaded = false;

    if (highlightQuery.type) {
      if (highlightQuery.type === 'row' && highlightQuery.value?.includes(yStr)) isHighlighted = true;
      else if (highlightQuery.type === 'col' && highlightQuery.value?.includes(xStr)) isHighlighted = true;
      else if (highlightQuery.type === 'color' && highlightQuery.value?.includes(color)) isHighlighted = true;

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
          background: color.includes('rgba') 
            ? `linear-gradient(${color}, ${color}), repeating-conic-gradient(rgba(0,0,0,0.06) 0% 25%, transparent 0% 50%) 50% / 6px 6px`
            : color,
          boxShadow: '1.5px 2.5px 3px rgba(0,0,0,0.25), inset -1.5px -1.5px 3px rgba(0,0,0,0.25), inset 1.5px 1.5px 3px rgba(255,255,255,0.6)',
          border: '0.5px solid rgba(0,0,0,0.15)',
        }}
      >
        {/* Hole in the middle */}
        <div
          className='rounded-full'
          style={{
            width: '35%',
            height: '35%',
            boxShadow: 'inset 1.5px 1.5px 2px rgba(0,0,0,0.4), inset -1px -1px 1px rgba(255,255,255,0.5)',
            border: '0.5px solid rgba(0,0,0,0.2)',
          }}
        />
      </div>
    );
  });

  const handleCanvasClick = () => {
    // Canvas click handled primarily by onPointerDown for highlight logic
  };

  return (
    <div
      ref={layerRef}
      onClick={handleCanvasClick}
      className='absolute top-0 left-0 touch-none'
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
