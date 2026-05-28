import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useBeadsStore } from '../../store/useBeadsStore';

const GRID_SIZE = 20;
const RADIUS = 200; // Total 400x400 grid

export const Grid: React.FC = React.memo(() => {
  const { pegboardSize } = useAppStore();
  const { beads } = useBeadsStore();

  // Calculate pattern center
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  Object.keys(beads).forEach(coord => {
    const [xStr, yStr] = coord.split(',');
    const x = parseInt(xStr, 10);
    const y = parseInt(yStr, 10);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });

  let startX = -pegboardSize / 2;
  let startY = -pegboardSize / 2;

  if (minX !== Infinity) {
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    startX = Math.floor(centerX - pegboardSize / 2 + 0.5); // snap to grid
    startY = Math.floor(centerY - pegboardSize / 2 + 0.5);
  }

  return (
    <div className="absolute top-0 left-0 pointer-events-none" style={{ width: 0, height: 0 }}>
      {/* Infinite Grid Background */}
      <div 
        className="absolute"
        style={{
          top: -RADIUS * GRID_SIZE,
          left: -RADIUS * GRID_SIZE,
          width: RADIUS * 2 * GRID_SIZE,
          height: RADIUS * 2 * GRID_SIZE,
          backgroundImage: `
            linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
        }}
      />
      {/* Thick Lines for 5x5 */}
      <div 
        className="absolute"
        style={{
          top: -RADIUS * GRID_SIZE,
          left: -RADIUS * GRID_SIZE,
          width: RADIUS * 2 * GRID_SIZE,
          height: RADIUS * 2 * GRID_SIZE,
          backgroundImage: `
            linear-gradient(to right, var(--grid-line-thick) 2px, transparent 2px),
            linear-gradient(to bottom, var(--grid-line-thick) 2px, transparent 2px)
          `,
          backgroundSize: `${GRID_SIZE * 5}px ${GRID_SIZE * 5}px`
        }}
      />

      {/* Pegboard Boundary if selected */}
      {pegboardSize > 0 && (
        <div 
          className="absolute border-4 border-blue-500 shadow-lg pointer-events-none bg-blue-500/5"
          style={{
            top: startY * GRID_SIZE,
            left: startX * GRID_SIZE,
            width: pegboardSize * GRID_SIZE,
            height: pegboardSize * GRID_SIZE,
          }}
        />
      )}
      {/* Tool Cursor Feedback */}
    </div>
  );
});
