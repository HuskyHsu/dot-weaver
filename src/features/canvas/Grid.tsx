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
            linear-gradient(to right, var(--grid-line-thick) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-line-thick) 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE * 5}px ${GRID_SIZE * 5}px`
        }}
      />

      {/* Pegboard Boundary if selected */}
      {pegboardSize > 0 && (
        <div 
          className="absolute shadow-[0_8px_32px_rgba(0,0,0,0.15)] pointer-events-none backdrop-blur-[3px] bg-black/5 border border-white/40 rounded-[8px]"
          style={{
            top: startY * GRID_SIZE,
            left: startX * GRID_SIZE,
            width: pegboardSize * GRID_SIZE,
            height: pegboardSize * GRID_SIZE,
            // Draw peg holes (subtle indented dots)
            backgroundImage: `radial-gradient(circle at 10px 10px, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.08) 1.5px, transparent 2px),
                              radial-gradient(circle at 10px 10px, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) 2px, transparent 2.5px)`,
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
            backgroundPosition: '0 0, 0 1px' // Offset the white highlight slightly down for 3D indent effect
          }}
        />
      )}
    </div>
  );
});
