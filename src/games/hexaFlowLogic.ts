import { Difficulty } from '../types';

export const HEX_DIRECTIONS: [number, number][] = [
  [1, -1], // 0: NE (upper-right)  -30 deg
  [1, 0],  // 1: SE (lower-right)  +30 deg
  [0, 1],  // 2: S  (straight down)+90 deg
  [-1, 1], // 3: SW (lower-left)   +150 deg
  [-1, 0], // 4: NW (upper-left)   +210 deg
  [0, -1], // 5: N  (straight up)  -90 deg
];

export const DIRECTION_ANGLES: number[] = [-30, 30, 90, 150, 210, 270];

export interface HexTile {
  id: string;
  q: number;
  r: number;
  type: 'source' | 'sink' | 'conduit';
  baseConduits: number[];  // 0..5
  currentRotation: number; // 0..5 (clockwise turns)
  solvedRotation: number;  // 0..5
  isPowered: boolean;
  isFixed?: boolean;
  label?: string;
}

export interface HexLevel {
  id: number;
  name: string;
  difficulty: Difficulty;
  tierLabel: string;
  description: string;
  tiles: HexTile[];
  parMoves: number;
}

// Get active conduits for a tile after rotation
export function getActiveConduits(tile: HexTile): number[] {
  return tile.baseConduits.map((d) => (d + tile.currentRotation) % 6);
}

// Rotate a tile clockwise by 1 step (60 degrees)
export function rotateTileClockwise(tile: HexTile): HexTile {
  if (tile.isFixed) return tile;
  return {
    ...tile,
    currentRotation: (tile.currentRotation + 1) % 6,
  };
}

// Rotate a tile counter-clockwise by 1 step
export function rotateTileCounterClockwise(tile: HexTile): HexTile {
  if (tile.isFixed) return tile;
  return {
    ...tile,
    currentRotation: (tile.currentRotation + 5) % 6,
  };
}

// Calculate BFS energy propagation across the hex grid
export function computeEnergyFlow(tiles: HexTile[]): {
  poweredTiles: HexTile[];
  isSolved: boolean;
  poweredSinkCount: number;
  totalSinkCount: number;
} {
  const tileMap = new Map<string, HexTile>();
  tiles.forEach((t) => {
    tileMap.set(`${t.q},${t.r}`, { ...t, isPowered: false });
  });

  const queue: string[] = [];

  // Sources are inherently powered
  tileMap.forEach((tile, key) => {
    if (tile.type === 'source') {
      tile.isPowered = true;
      queue.push(key);
    }
  });

  // BFS
  while (queue.length > 0) {
    const currentKey = queue.shift()!;
    const currentTile = tileMap.get(currentKey);
    if (!currentTile) continue;

    const currentConduits = getActiveConduits(currentTile);

    currentConduits.forEach((dir) => {
      const [dq, dr] = HEX_DIRECTIONS[dir];
      const neighborKey = `${currentTile.q + dq},${currentTile.r + dr}`;
      const neighbor = tileMap.get(neighborKey);

      if (neighbor && !neighbor.isPowered) {
        const opposingDir = (dir + 3) % 6;
        const neighborConduits = getActiveConduits(neighbor);

        if (neighborConduits.includes(opposingDir)) {
          neighbor.isPowered = true;
          queue.push(neighborKey);
        }
      }
    });
  }

  const updatedTiles = tiles.map((t) => tileMap.get(`${t.q},${t.r}`) || t);

  const sinks = updatedTiles.filter((t) => t.type === 'sink');
  const poweredSinks = sinks.filter((t) => t.isPowered);

  const isSolved = sinks.length > 0 && poweredSinks.length === sinks.length;

  return {
    poweredTiles: updatedTiles,
    isSolved,
    poweredSinkCount: poweredSinks.length,
    totalSinkCount: sinks.length,
  };
}

// Check if all tiles are at their exact solved orientation
export function isLevelFlawless(tiles: HexTile[]): boolean {
  return tiles.every(
    (t) => t.isFixed || (t.currentRotation % 6) === (t.solvedRotation % 6)
  );
}

// Helper to scramble a level's initial state
export function scrambleLevel(level: HexLevel, seed: number = 42): HexLevel {
  const scrambledTiles = level.tiles.map((tile, i) => {
    if (tile.isFixed) return { ...tile, currentRotation: 0 };
    // Scramble non-fixed tiles with deterministic random offset between 1 and 5
    const pseudoRandom = ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280;
    const offset = 1 + Math.floor(pseudoRandom * 5);
    return {
      ...tile,
      currentRotation: (tile.solvedRotation + offset) % 6,
    };
  });

  const { poweredTiles } = computeEnergyFlow(scrambledTiles);

  return {
    ...level,
    tiles: poweredTiles,
  };
}

// 15 Solvable Handcrafted Hexa Flow Levels
export const HEXA_LEVELS: HexLevel[] = [
  // EASY TIER (Levels 1 to 5)
  {
    id: 1,
    name: 'Ignition Node',
    difficulty: 'easy',
    tierLabel: 'Easy 1/5',
    description: 'Rotate the adjacent conduit to transmit pure energy from the Source to the Terminal Sink.',
    parMoves: 3,
    tiles: [
      { id: 't1', q: 0, r: 0, type: 'source', baseConduits: [1], currentRotation: 0, solvedRotation: 0, isPowered: true, isFixed: true, label: 'PWR' },
      { id: 't2', q: 1, r: 0, type: 'conduit', baseConduits: [1, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't3', q: 2, r: 0, type: 'sink', baseConduits: [4], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'SNK' },
    ],
  },
  {
    id: 2,
    name: 'Prism Corner',
    difficulty: 'easy',
    tierLabel: 'Easy 2/5',
    description: 'Bend the stream around the sector boundary to reach the lower sink.',
    parMoves: 4,
    tiles: [
      { id: 't1', q: 0, r: 0, type: 'source', baseConduits: [1], currentRotation: 0, solvedRotation: 0, isPowered: true, isFixed: true, label: 'PWR' },
      { id: 't2', q: 1, r: 0, type: 'conduit', baseConduits: [2, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't3', q: 1, r: 1, type: 'conduit', baseConduits: [1, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't4', q: 2, r: 1, type: 'sink', baseConduits: [4], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'SNK' },
    ],
  },
  {
    id: 3,
    name: 'Rosette Triad',
    difficulty: 'easy',
    tierLabel: 'Easy 3/5',
    description: 'Align the orbital conduit ring to route energy down the spiral path.',
    parMoves: 6,
    tiles: [
      { id: 't1', q: 0, r: 0, type: 'source', baseConduits: [1], currentRotation: 0, solvedRotation: 0, isPowered: true, isFixed: true, label: 'PWR' },
      { id: 't2', q: 1, r: 0, type: 'conduit', baseConduits: [0, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't3', q: 2, r: -1, type: 'conduit', baseConduits: [2, 3], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't4', q: 2, r: 0, type: 'conduit', baseConduits: [1, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't5', q: 3, r: 0, type: 'sink', baseConduits: [4], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'SNK' },
    ],
  },
  {
    id: 4,
    name: 'Bifurcation',
    difficulty: 'easy',
    tierLabel: 'Easy 4/5',
    description: 'Harness a three-way splitter to power two independent sinks simultaneously.',
    parMoves: 5,
    tiles: [
      { id: 't1', q: 0, r: 0, type: 'source', baseConduits: [1], currentRotation: 0, solvedRotation: 0, isPowered: true, isFixed: true, label: 'PWR' },
      { id: 't2', q: 1, r: 0, type: 'conduit', baseConduits: [0, 2, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't3', q: 2, r: -1, type: 'sink', baseConduits: [3], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'A' },
      { id: 't4', q: 1, r: 1, type: 'sink', baseConduits: [5], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'B' },
    ],
  },
  {
    id: 5,
    name: 'Hexagonal Arc',
    difficulty: 'easy',
    tierLabel: 'Easy 5/5',
    description: 'Complete the semi-circular conduit perimeter to bypass the dead center.',
    parMoves: 7,
    tiles: [
      { id: 't1', q: 0, r: 0, type: 'source', baseConduits: [0], currentRotation: 0, solvedRotation: 0, isPowered: true, isFixed: true, label: 'PWR' },
      { id: 't2', q: 1, r: -1, type: 'conduit', baseConduits: [1, 3], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't3', q: 2, r: -1, type: 'conduit', baseConduits: [2, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't4', q: 2, r: 0, type: 'conduit', baseConduits: [2, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't5', q: 2, r: 1, type: 'conduit', baseConduits: [3, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't6', q: 1, r: 2, type: 'sink', baseConduits: [0], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'SNK' },
    ],
  },

  // MEDIUM / NORMAL TIER (Levels 6 to 10)
  {
    id: 6,
    name: 'Vector Cross',
    difficulty: 'normal',
    tierLabel: 'Normal 1/5',
    description: 'Navigate intersecting conduit lines and prevent energy backflow.',
    parMoves: 8,
    tiles: [
      { id: 't1', q: 0, r: 0, type: 'source', baseConduits: [1], currentRotation: 0, solvedRotation: 0, isPowered: true, isFixed: true, label: 'PWR' },
      { id: 't2', q: 1, r: 0, type: 'conduit', baseConduits: [0, 1, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't3', q: 2, r: -1, type: 'conduit', baseConduits: [1, 3], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't4', q: 3, r: -1, type: 'sink', baseConduits: [4], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'A' },
      { id: 't5', q: 2, r: 0, type: 'conduit', baseConduits: [2, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't6', q: 2, r: 1, type: 'conduit', baseConduits: [1, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't7', q: 3, r: 1, type: 'sink', baseConduits: [4], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'B' },
    ],
  },
  {
    id: 7,
    name: 'Nexus Core',
    difficulty: 'normal',
    tierLabel: 'Normal 2/5',
    description: 'The central hub distributes current into an outer equilateral triangle of capacitors.',
    parMoves: 10,
    tiles: [
      { id: 't1', q: 0, r: 0, type: 'source', baseConduits: [1], currentRotation: 0, solvedRotation: 0, isPowered: true, isFixed: true, label: 'PWR' },
      { id: 't2', q: 1, r: 0, type: 'conduit', baseConduits: [0, 1, 2, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't3', q: 2, r: -1, type: 'conduit', baseConduits: [1, 3], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't4', q: 3, r: -1, type: 'sink', baseConduits: [4], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'TOP' },
      { id: 't5', q: 2, r: 0, type: 'conduit', baseConduits: [1, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't6', q: 3, r: 0, type: 'sink', baseConduits: [4], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'MID' },
      { id: 't7', q: 1, r: 1, type: 'conduit', baseConduits: [1, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't8', q: 2, r: 1, type: 'sink', baseConduits: [4], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'BOT' },
    ],
  },
  {
    id: 8,
    name: 'Quantum Cascade',
    difficulty: 'normal',
    tierLabel: 'Normal 3/5',
    description: 'Weave through a staggered dual-channel lattice to restore full circuit tension.',
    parMoves: 11,
    tiles: [
      { id: 't1', q: 0, r: 0, type: 'source', baseConduits: [0, 2], currentRotation: 0, solvedRotation: 0, isPowered: true, isFixed: true, label: 'PWR' },
      { id: 't2', q: 1, r: -1, type: 'conduit', baseConduits: [1, 3], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't3', q: 2, r: -1, type: 'conduit', baseConduits: [2, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't4', q: 2, r: 0, type: 'conduit', baseConduits: [1, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't5', q: 0, r: 1, type: 'conduit', baseConduits: [1, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't6', q: 1, r: 1, type: 'conduit', baseConduits: [0, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't7', q: 3, r: 0, type: 'sink', baseConduits: [4], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'SNK' },
    ],
  },
  {
    id: 9,
    name: 'Dual Orbit',
    difficulty: 'normal',
    tierLabel: 'Normal 4/5',
    description: 'Form a dual-ring resonance chamber to power both peripheral terminals.',
    parMoves: 12,
    tiles: [
      { id: 't1', q: 0, r: 0, type: 'source', baseConduits: [0, 1], currentRotation: 0, solvedRotation: 0, isPowered: true, isFixed: true, label: 'PWR' },
      { id: 't2', q: 1, r: -1, type: 'conduit', baseConduits: [1, 3], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't3', q: 2, r: -1, type: 'sink', baseConduits: [4], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'X' },
      { id: 't4', q: 1, r: 0, type: 'conduit', baseConduits: [2, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't5', q: 1, r: 1, type: 'conduit', baseConduits: [1, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't6', q: 2, r: 1, type: 'conduit', baseConduits: [0, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't7', q: 3, r: 0, type: 'sink', baseConduits: [3], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'Y' },
    ],
  },
  {
    id: 10,
    name: 'Pulsar Matrix',
    difficulty: 'normal',
    tierLabel: 'Normal 5/5',
    description: 'A 9-tile symmetric diamond requiring precise multi-way coordination.',
    parMoves: 14,
    tiles: [
      { id: 't1', q: 0, r: 0, type: 'source', baseConduits: [1], currentRotation: 0, solvedRotation: 0, isPowered: true, isFixed: true, label: 'PWR' },
      { id: 't2', q: 1, r: 0, type: 'conduit', baseConduits: [0, 2, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't3', q: 2, r: -1, type: 'conduit', baseConduits: [1, 3], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't4', q: 1, r: 1, type: 'conduit', baseConduits: [1, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't5', q: 3, r: -1, type: 'conduit', baseConduits: [2, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't6', q: 2, r: 1, type: 'conduit', baseConduits: [0, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't7', q: 3, r: 0, type: 'conduit', baseConduits: [1, 3, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't8', q: 4, r: 0, type: 'sink', baseConduits: [4], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'SNK' },
    ],
  },

  // HARD TIER (Levels 11 to 15)
  {
    id: 11,
    name: 'Labyrinthine Stream',
    difficulty: 'hard',
    tierLabel: 'Hard 1/5',
    description: 'Avoid dead-end loops and route through tight hex crevices to charge three isolated capacitors.',
    parMoves: 16,
    tiles: [
      { id: 't1', q: 0, r: 0, type: 'source', baseConduits: [0, 1], currentRotation: 0, solvedRotation: 0, isPowered: true, isFixed: true, label: 'PWR' },
      { id: 't2', q: 1, r: -1, type: 'conduit', baseConduits: [1, 3], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't3', q: 2, r: -1, type: 'conduit', baseConduits: [0, 2, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't4', q: 3, r: -2, type: 'sink', baseConduits: [3], currentRotation: 0, solvedRotation: 0, isPowered: false, label: '1' },
      { id: 't5', q: 2, r: 0, type: 'conduit', baseConduits: [1, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't6', q: 1, r: 0, type: 'conduit', baseConduits: [2, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't7', q: 1, r: 1, type: 'conduit', baseConduits: [1, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't8', q: 2, r: 1, type: 'conduit', baseConduits: [0, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't9', q: 3, r: 0, type: 'conduit', baseConduits: [1, 2, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't10', q: 4, r: 0, type: 'sink', baseConduits: [4], currentRotation: 0, solvedRotation: 0, isPowered: false, label: '2' },
      { id: 't11', q: 3, r: 1, type: 'sink', baseConduits: [5], currentRotation: 0, solvedRotation: 0, isPowered: false, label: '3' },
    ],
  },
  {
    id: 12,
    name: 'Hex Core Spiral',
    difficulty: 'hard',
    tierLabel: 'Hard 2/5',
    description: 'An interwoven double-spiral requiring full 360-degree circuit continuity.',
    parMoves: 18,
    tiles: [
      { id: 't1', q: 0, r: 0, type: 'source', baseConduits: [0], currentRotation: 0, solvedRotation: 0, isPowered: true, isFixed: true, label: 'PWR' },
      { id: 't2', q: 1, r: -1, type: 'conduit', baseConduits: [1, 3], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't3', q: 2, r: -1, type: 'conduit', baseConduits: [2, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't4', q: 2, r: 0, type: 'conduit', baseConduits: [3, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't5', q: 1, r: 1, type: 'conduit', baseConduits: [2, 0], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't6', q: 1, r: 2, type: 'conduit', baseConduits: [1, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't7', q: 2, r: 2, type: 'conduit', baseConduits: [0, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't8', q: 3, r: 1, type: 'conduit', baseConduits: [5, 3], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't9', q: 3, r: 0, type: 'sink', baseConduits: [2], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'SNK' },
    ],
  },
  {
    id: 13,
    name: 'Synchronous Twin',
    difficulty: 'hard',
    tierLabel: 'Hard 3/5',
    description: 'Two separate generator sources must merge and converge into a unified terminus.',
    parMoves: 18,
    tiles: [
      { id: 't1', q: 0, r: -1, type: 'source', baseConduits: [1], currentRotation: 0, solvedRotation: 0, isPowered: true, isFixed: true, label: 'S1' },
      { id: 't2', q: 0, r: 1, type: 'source', baseConduits: [1], currentRotation: 0, solvedRotation: 0, isPowered: true, isFixed: true, label: 'S2' },
      { id: 't3', q: 1, r: -1, type: 'conduit', baseConduits: [2, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't4', q: 1, r: 1, type: 'conduit', baseConduits: [4, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't5', q: 1, r: 0, type: 'conduit', baseConduits: [1, 2, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't6', q: 2, r: 0, type: 'conduit', baseConduits: [1, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't7', q: 3, r: 0, type: 'conduit', baseConduits: [0, 2, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't8', q: 4, r: -1, type: 'sink', baseConduits: [3], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'A' },
      { id: 't9', q: 3, r: 1, type: 'sink', baseConduits: [5], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'B' },
    ],
  },
  {
    id: 14,
    name: 'Lattice Array',
    difficulty: 'hard',
    tierLabel: 'Hard 4/5',
    description: 'A dense hexagonal mesh requiring high spatial foresight and minimal redundant turns.',
    parMoves: 22,
    tiles: [
      { id: 't1', q: 0, r: 0, type: 'source', baseConduits: [0, 1], currentRotation: 0, solvedRotation: 0, isPowered: true, isFixed: true, label: 'PWR' },
      { id: 't2', q: 1, r: -1, type: 'conduit', baseConduits: [1, 3], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't3', q: 2, r: -1, type: 'conduit', baseConduits: [1, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't4', q: 3, r: -1, type: 'conduit', baseConduits: [1, 2, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't5', q: 1, r: 0, type: 'conduit', baseConduits: [0, 2, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't6', q: 2, r: 0, type: 'conduit', baseConduits: [1, 3, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't7', q: 3, r: 0, type: 'conduit', baseConduits: [1, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't8', q: 1, r: 1, type: 'conduit', baseConduits: [1, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't9', q: 2, r: 1, type: 'conduit', baseConduits: [0, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't10', q: 4, r: -1, type: 'sink', baseConduits: [4], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'ALPHA' },
      { id: 't11', q: 4, r: 0, type: 'sink', baseConduits: [4], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'BETA' },
    ],
  },
  {
    id: 15,
    name: 'Zenith Singularity',
    difficulty: 'hard',
    tierLabel: 'Hard 5/5',
    description: 'The master challenge. Power three orbital perimeter nodes simultaneously through intricate branch conduits.',
    parMoves: 26,
    tiles: [
      { id: 't1', q: 1, r: 0, type: 'source', baseConduits: [0, 2, 4], currentRotation: 0, solvedRotation: 0, isPowered: true, isFixed: true, label: 'CORE' },
      { id: 't2', q: 2, r: -1, type: 'conduit', baseConduits: [1, 3], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't3', q: 3, r: -1, type: 'sink', baseConduits: [4], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'NE' },
      { id: 't4', q: 1, r: 1, type: 'conduit', baseConduits: [1, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't5', q: 2, r: 1, type: 'sink', baseConduits: [4], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'SE' },
      { id: 't6', q: 0, r: 0, type: 'conduit', baseConduits: [1, 3, 5], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't7', q: -1, r: 1, type: 'conduit', baseConduits: [0, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't8', q: 0, r: -1, type: 'conduit', baseConduits: [2, 4], currentRotation: 0, solvedRotation: 0, isPowered: false },
      { id: 't9', q: -2, r: 1, type: 'sink', baseConduits: [1], currentRotation: 0, solvedRotation: 0, isPowered: false, label: 'WEST' },
    ],
  },
];

// Calculate score for Hexa Flow level completion
export function calculateHexaScore(
  parMoves: number,
  actualMoves: number,
  elapsedSeconds: number,
  difficulty: Difficulty
): number {
  const baseByDiff = {
    easy: 150,
    normal: 250,
    hard: 400,
  };

  const base = baseByDiff[difficulty];
  const efficiencyBonus = Math.max(0, (parMoves * 2 - actualMoves) * 15);
  const timeBonus = Math.max(0, Math.round(150 - elapsedSeconds * 1.5));

  return base + efficiencyBonus + timeBonus;
}
