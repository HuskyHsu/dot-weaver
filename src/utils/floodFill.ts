import { BeadState } from '../store/useBeadsStore';

export const floodFill = (
  startX: number,
  startY: number,
  targetColor: string, // color to fill with
  beads: BeadState
): BeadState => {
  const startKey = `${startX},${startY}`;
  const startColor = beads[startKey] || null;

  if (startColor === targetColor) return beads;

  const newBeads = { ...beads };
  const queue: [number, number][] = [[startX, startY]];
  const visited = new Set<string>();
  let head = 0;
  let filledCount = 0;
  const MAX_FILL = 5000; // Limit fill size to prevent infinite loop on open background

  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    const key = `${cx},${cy}`;

    if (visited.has(key)) continue;
    visited.add(key);

    const currentColor = newBeads[key] || null;

    if (currentColor === startColor) {
      filledCount++;
      if (filledCount > MAX_FILL) {
        alert('填滿範圍過大或區域未完全封閉，為避免程式卡死，已自動取消！');
        return beads; // abort and return original state
      }

      if (targetColor === 'erase') {
         delete newBeads[key];
      } else {
         newBeads[key] = targetColor;
      }

      queue.push([cx + 1, cy]);
      queue.push([cx - 1, cy]);
      queue.push([cx, cy + 1]);
      queue.push([cx, cy - 1]);
    }
  }

  return newBeads;
};
