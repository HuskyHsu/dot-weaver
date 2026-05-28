import LZString from 'lz-string';

type BeadState = Record<string, string>;

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()+-={}[]<>/~";

export const encodeStateToUrl = (beads: BeadState): string => {
  try {
    const points = Object.keys(beads).map(coord => {
      const [x, y] = coord.split(',').map(Number);
      return { x, y, color: beads[coord] };
    });

    if (points.length === 0) return '';

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const width = maxX - minX + 1;

    const indexedPoints = points.map(p => ({
      idx: (p.y - minY) * width + (p.x - minX),
      color: p.color
    }));

    indexedPoints.sort((a, b) => a.idx - b.idx);

    const palette: string[] = [];
    const colorToChar: Record<string, string> = {};

    let rleString = '';
    let currentIdx = 0;
    
    let runChar = '';
    let runLength = 0;

    const appendRun = (char: string, length: number) => {
      if (length <= 0) return;
      if (char === runChar) {
        runLength += length;
      } else {
        if (runLength > 0) {
          rleString += (runLength > 1 ? runLength : '') + runChar;
        }
        runChar = char;
        runLength = length;
      }
    };

    for (const p of indexedPoints) {
      if (p.idx > currentIdx) {
        appendRun('_', p.idx - currentIdx); // '_' represents empty spaces
      }
      if (!(p.color in colorToChar)) {
        colorToChar[p.color] = palette.length < CHARS.length ? CHARS[palette.length] : '?';
        palette.push(p.color);
      }
      appendRun(colorToChar[p.color], 1);
      currentIdx = p.idx + 1;
    }
    if (runLength > 0) {
      rleString += (runLength > 1 ? runLength : '') + runChar;
    }

    const payload = `3:${minX}:${minY}:${width}:${palette.join('|')}:${rleString}`;
    return LZString.compressToEncodedURIComponent(payload);
  } catch (e) {
    console.error('Failed to encode state', e);
    return '';
  }
};

export const decodeStateFromUrl = (encoded: string): BeadState | null => {
  try {
    const payload = LZString.decompressFromEncodedURIComponent(encoded);
    if (!payload) return null;
    
    const beads: BeadState = {};
    
    if (payload.startsWith('3:')) {
      const parts = payload.split(':');
      const minX = parseInt(parts[1], 10);
      const minY = parseInt(parts[2], 10);
      const width = parseInt(parts[3], 10);
      const palette = parts[4] ? parts[4].split('|') : [];
      const rleString = parts.slice(5).join(':'); // In case RLE string contains ':'
      
      const runRegex = /(\d*)(.)/g;
      let currentIdx = 0;
      let match;
      
      while ((match = runRegex.exec(rleString)) !== null) {
        if (match[0] === '') break;
        
        const lengthStr = match[1];
        const char = match[2];
        const length = lengthStr === '' ? 1 : parseInt(lengthStr, 10);
        
        if (char !== '_') {
           const colorIdx = CHARS.indexOf(char);
           if (colorIdx !== -1 && colorIdx < palette.length) {
               const color = palette[colorIdx];
               for (let i = 0; i < length; i++) {
                 const idx = currentIdx + i;
                 const y = minY + Math.floor(idx / width);
                 const x = minX + (idx % width);
                 beads[`${x},${y}`] = color;
               }
           }
        }
        currentIdx += length;
      }
    }
    
    return beads;
  } catch (error) {
    console.error("Failed to parse URL state", error);
    return null;
  }
};
