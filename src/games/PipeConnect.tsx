import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, RotateCcw, Lightbulb, Volume2, VolumeX, 
  HelpCircle, Sparkles, CheckCircle2, ChevronRight, Zap, Trophy, Play 
} from 'lucide-react';
import { NeonButton } from '../components/NeonButton';
import { ResultsModal } from '../components/ResultsModal';
import { storage } from '../services/storageService';
import { sound } from '../services/soundService';
import { Difficulty, GameResult } from '../types';

export type PipeType = 'straight' | 'corner' | 't-junction' | 'cross' | 'block';

// Directions: 0 = Up, 1 = Right, 2 = Down, 3 = Left
export const BASE_CONNECTIONS: Record<PipeType, number[]> = {
  straight: [0, 2],       // Up & Down
  corner: [0, 1],         // Up & Right
  't-junction': [0, 1, 2], // Up, Right, Down
  cross: [0, 1, 2, 3],    // All 4
  block: [],              // No connections
};

export interface PipeTile {
  id: string;
  r: number;
  c: number;
  type: PipeType;
  solutionRotation: number; // 0, 1, 2, 3 (multiplied by 90 deg)
  currentRotation: number;  // 0, 1, 2, 3
  isSource?: boolean;
  isDestination?: boolean;
}

export interface PipeLevel {
  id: string;
  levelNumber: number;
  name: string;
  difficulty: Difficulty;
  rows: number;
  cols: number;
  minMoves: number;
  tiles: {
    r: number;
    c: number;
    type: PipeType;
    correctRot: number;
    initialRot: number;
    isSource?: boolean;
    isDestination?: boolean;
  }[];
}

// 9 Curated handcrafted levels across Easy (4x4), Normal (5x5), Hard (6x6)
export const CURATED_LEVELS: PipeLevel[] = [
  // LEVEL 1: Easy 4x4 S-Curve Conduit
  {
    id: 'lvl-1',
    levelNumber: 1,
    name: 'Spark Genesis',
    difficulty: 'easy',
    rows: 4,
    cols: 4,
    minMoves: 4,
    tiles: [
      { r: 0, c: 0, type: 'corner', correctRot: 1, initialRot: 0, isSource: true }, // [Right, Down]
      { r: 0, c: 1, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 0, c: 2, type: 'corner', correctRot: 2, initialRot: 1 }, // [Down, Left]
      { r: 0, c: 3, type: 'straight', correctRot: 0, initialRot: 0 },

      { r: 1, c: 0, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 1, c: 1, type: 'straight', correctRot: 0, initialRot: 0 },
      { r: 1, c: 2, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 1, c: 3, type: 'straight', correctRot: 0, initialRot: 0 },

      { r: 2, c: 0, type: 'straight', correctRot: 0, initialRot: 0 },
      { r: 2, c: 1, type: 'straight', correctRot: 0, initialRot: 0 },
      { r: 2, c: 2, type: 'corner', correctRot: 0, initialRot: 3 }, // [Up, Right]
      { r: 2, c: 3, type: 'corner', correctRot: 2, initialRot: 1 }, // [Down, Left]

      { r: 3, c: 0, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 3, c: 1, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 3, c: 2, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 3, c: 3, type: 'corner', correctRot: 0, initialRot: 2, isDestination: true },
    ],
  },

  // LEVEL 2: Easy 4x4 Zig-Zag
  {
    id: 'lvl-2',
    levelNumber: 2,
    name: 'Cyber Cascade',
    difficulty: 'easy',
    rows: 4,
    cols: 4,
    minMoves: 5,
    tiles: [
      { r: 0, c: 0, type: 'corner', correctRot: 1, initialRot: 3, isSource: true },
      { r: 0, c: 1, type: 'corner', correctRot: 2, initialRot: 0 },
      { r: 0, c: 2, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 0, c: 3, type: 'straight', correctRot: 0, initialRot: 1 },

      { r: 1, c: 0, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 1, c: 1, type: 'corner', correctRot: 0, initialRot: 2 },
      { r: 1, c: 2, type: 'corner', correctRot: 2, initialRot: 1 },
      { r: 1, c: 3, type: 'straight', correctRot: 0, initialRot: 0 },

      { r: 2, c: 0, type: 'straight', correctRot: 0, initialRot: 0 },
      { r: 2, c: 1, type: 'straight', correctRot: 1, initialRot: 1 },
      { r: 2, c: 2, type: 'corner', correctRot: 0, initialRot: 3 },
      { r: 2, c: 3, type: 'corner', correctRot: 2, initialRot: 0 },

      { r: 3, c: 0, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 3, c: 1, type: 'straight', correctRot: 1, initialRot: 1 },
      { r: 3, c: 2, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 3, c: 3, type: 'corner', correctRot: 0, initialRot: 1, isDestination: true },
    ],
  },

  // LEVEL 3: Easy 4x4 Loop Path
  {
    id: 'lvl-3',
    levelNumber: 3,
    name: 'Neon Bypass',
    difficulty: 'easy',
    rows: 4,
    cols: 4,
    minMoves: 6,
    tiles: [
      { r: 0, c: 0, type: 'straight', correctRot: 1, initialRot: 0, isSource: true },
      { r: 0, c: 1, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 0, c: 2, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 0, c: 3, type: 'corner', correctRot: 2, initialRot: 1 },

      { r: 1, c: 0, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 1, c: 1, type: 'corner', correctRot: 1, initialRot: 2 },
      { r: 1, c: 2, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 1, c: 3, type: 'straight', correctRot: 0, initialRot: 1 },

      { r: 2, c: 0, type: 'straight', correctRot: 0, initialRot: 0 },
      { r: 2, c: 1, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 2, c: 2, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 2, c: 3, type: 'straight', correctRot: 0, initialRot: 1 },

      { r: 3, c: 0, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 3, c: 1, type: 'corner', correctRot: 0, initialRot: 3 },
      { r: 3, c: 2, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 3, c: 3, type: 'corner', correctRot: 0, initialRot: 2, isDestination: true },
    ],
  },

  // LEVEL 4: Normal 5x5 Matrix Conduit
  {
    id: 'lvl-4',
    levelNumber: 4,
    name: 'Quantum Nexus',
    difficulty: 'normal',
    rows: 5,
    cols: 5,
    minMoves: 7,
    tiles: [
      { r: 0, c: 0, type: 'corner', correctRot: 1, initialRot: 0, isSource: true },
      { r: 0, c: 1, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 0, c: 2, type: 'corner', correctRot: 2, initialRot: 1 },
      { r: 0, c: 3, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 0, c: 4, type: 'corner', correctRot: 1, initialRot: 2 },

      { r: 1, c: 0, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 1, c: 1, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 1, c: 2, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 1, c: 3, type: 'corner', correctRot: 1, initialRot: 3 },
      { r: 1, c: 4, type: 'straight', correctRot: 0, initialRot: 1 },

      { r: 2, c: 0, type: 'straight', correctRot: 0, initialRot: 0 },
      { r: 2, c: 1, type: 'corner', correctRot: 1, initialRot: 2 },
      { r: 2, c: 2, type: 'corner', correctRot: 0, initialRot: 3 },
      { r: 2, c: 3, type: 'corner', correctRot: 2, initialRot: 1 },
      { r: 2, c: 4, type: 'straight', correctRot: 0, initialRot: 0 },

      { r: 3, c: 0, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 3, c: 1, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 3, c: 2, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 3, c: 3, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 3, c: 4, type: 'corner', correctRot: 2, initialRot: 0 },

      { r: 4, c: 0, type: 'corner', correctRot: 0, initialRot: 1 },
      { r: 4, c: 1, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 4, c: 2, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 4, c: 3, type: 'corner', correctRot: 0, initialRot: 2 },
      { r: 4, c: 4, type: 'corner', correctRot: 3, initialRot: 1, isDestination: true },
    ],
  },

  // LEVEL 5: Normal 5x5 T-Junction Diverter
  {
    id: 'lvl-5',
    levelNumber: 5,
    name: 'Flux Splitter',
    difficulty: 'normal',
    rows: 5,
    cols: 5,
    minMoves: 8,
    tiles: [
      { r: 0, c: 0, type: 'straight', correctRot: 1, initialRot: 0, isSource: true },
      { r: 0, c: 1, type: 't-junction', correctRot: 2, initialRot: 0 }, // Down, Left, Up
      { r: 0, c: 2, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 0, c: 3, type: 'corner', correctRot: 2, initialRot: 1 },
      { r: 0, c: 4, type: 'straight', correctRot: 0, initialRot: 1 },

      { r: 1, c: 0, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 1, c: 1, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 1, c: 2, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 1, c: 3, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 1, c: 4, type: 'corner', correctRot: 2, initialRot: 0 },

      { r: 2, c: 0, type: 'corner', correctRot: 1, initialRot: 2 },
      { r: 2, c: 1, type: 'cross', correctRot: 0, initialRot: 0 },
      { r: 2, c: 2, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 2, c: 3, type: 't-junction', correctRot: 3, initialRot: 1 },
      { r: 2, c: 4, type: 'straight', correctRot: 0, initialRot: 1 },

      { r: 3, c: 0, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 3, c: 1, type: 'straight', correctRot: 0, initialRot: 0 },
      { r: 3, c: 2, type: 'straight', correctRot: 1, initialRot: 1 },
      { r: 3, c: 3, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 3, c: 4, type: 'straight', correctRot: 0, initialRot: 0 },

      { r: 4, c: 0, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 4, c: 1, type: 'corner', correctRot: 0, initialRot: 3 },
      { r: 4, c: 2, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 4, c: 3, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 4, c: 4, type: 'corner', correctRot: 3, initialRot: 1, isDestination: true },
    ],
  },

  // LEVEL 6: Hard 6x6 Power Grid
  {
    id: 'lvl-6',
    levelNumber: 6,
    name: 'Superconductor Apex',
    difficulty: 'hard',
    rows: 6,
    cols: 6,
    minMoves: 10,
    tiles: [
      { r: 0, c: 0, type: 'corner', correctRot: 1, initialRot: 2, isSource: true },
      { r: 0, c: 1, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 0, c: 2, type: 't-junction', correctRot: 1, initialRot: 3 },
      { r: 0, c: 3, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 0, c: 4, type: 'corner', correctRot: 2, initialRot: 1 },
      { r: 0, c: 5, type: 'straight', correctRot: 0, initialRot: 1 },

      { r: 1, c: 0, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 1, c: 1, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 1, c: 2, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 1, c: 3, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 1, c: 4, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 1, c: 5, type: 'corner', correctRot: 2, initialRot: 3 },

      { r: 2, c: 0, type: 'corner', correctRot: 1, initialRot: 3 },
      { r: 2, c: 1, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 2, c: 2, type: 'cross', correctRot: 0, initialRot: 0 },
      { r: 2, c: 3, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 2, c: 4, type: 't-junction', correctRot: 0, initialRot: 2 },
      { r: 2, c: 5, type: 'straight', correctRot: 0, initialRot: 1 },

      { r: 3, c: 0, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 3, c: 1, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 3, c: 2, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 3, c: 3, type: 'corner', correctRot: 1, initialRot: 2 },
      { r: 3, c: 4, type: 'straight', correctRot: 0, initialRot: 0 },
      { r: 3, c: 5, type: 'straight', correctRot: 0, initialRot: 1 },

      { r: 4, c: 0, type: 'straight', correctRot: 0, initialRot: 0 },
      { r: 4, c: 1, type: 'corner', correctRot: 1, initialRot: 3 },
      { r: 4, c: 2, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 4, c: 3, type: 'corner', correctRot: 0, initialRot: 1 },
      { r: 4, c: 4, type: 'straight', correctRot: 0, initialRot: 1 },
      { r: 4, c: 5, type: 'straight', correctRot: 0, initialRot: 0 },

      { r: 5, c: 0, type: 'corner', correctRot: 0, initialRot: 2 },
      { r: 5, c: 1, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 5, c: 2, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 5, c: 3, type: 'straight', correctRot: 1, initialRot: 0 },
      { r: 5, c: 4, type: 'corner', correctRot: 0, initialRot: 3 },
      { r: 5, c: 5, type: 'straight', correctRot: 1, initialRot: 0, isDestination: true },
    ],
  },
];

// Calculate connected directions for tile at current rotation
export function getOpenDirections(tile: PipeTile): number[] {
  const base = BASE_CONNECTIONS[tile.type];
  return base.map((dir) => (dir + tile.currentRotation) % 4);
}

// Check if tile A at (rA, cA) and tile B at (rB, cB) are connected
export function areTilesConnected(tileA: PipeTile, tileB: PipeTile): boolean {
  const dirsA = getOpenDirections(tileA);
  const dirsB = getOpenDirections(tileB);

  // Is B directly Above A?
  if (tileB.r === tileA.r - 1 && tileB.c === tileA.c) {
    return dirsA.includes(0) && dirsB.includes(2);
  }
  // Is B directly to the Right of A?
  if (tileB.r === tileA.r && tileB.c === tileA.c + 1) {
    return dirsA.includes(1) && dirsB.includes(3);
  }
  // Is B directly Below A?
  if (tileB.r === tileA.r + 1 && tileB.c === tileA.c) {
    return dirsA.includes(2) && dirsB.includes(0);
  }
  // Is B directly to the Left of A?
  if (tileB.r === tileA.r && tileB.c === tileA.c - 1) {
    return dirsA.includes(3) && dirsB.includes(1);
  }

  return false;
}

// BFS Graph Traversal starting from Source to find all powered tiles
export function computePoweredTiles(tiles: PipeTile[], rows: number, cols: number): Set<string> {
  const source = tiles.find((t) => t.isSource);
  if (!source) return new Set();

  const powered = new Set<string>();
  const queue: PipeTile[] = [source];
  powered.add(source.id);

  // Fast coordinate lookup
  const tileMap = new Map<string, PipeTile>();
  tiles.forEach((t) => tileMap.set(`${t.r},${t.c}`, t));

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const openDirs = getOpenDirections(curr);

    // Neighbor offsets for dirs 0=Up, 1=Right, 2=Down, 3=Left
    const offsets = [
      { dr: -1, dc: 0, opp: 2 },
      { dr: 0, dc: 1, opp: 0 },
      { dr: 1, dc: 0, opp: 0 },
      { dr: 0, dc: -1, opp: 1 },
    ];

    openDirs.forEach((dir) => {
      const { dr, dc, opp } = offsets[dir];
      const nR = curr.r + dr;
      const nC = curr.c + dc;
      const neighbor = tileMap.get(`${nR},${nC}`);

      if (neighbor && !powered.has(neighbor.id)) {
        const neighborDirs = getOpenDirections(neighbor);
        // Opposing direction check
        const oppDir = (dir + 2) % 4;
        if (neighborDirs.includes(oppDir)) {
          powered.add(neighbor.id);
          queue.push(neighbor);
        }
      }
    });
  }

  return powered;
}

// Vector SVG Pipe renderer
const PipeSVG: React.FC<{ type: PipeType; isPowered: boolean; isSource?: boolean; isDestination?: boolean }> = ({
  type,
  isPowered,
  isSource,
  isDestination,
}) => {
  const pipeColor = isPowered ? '#56E6D0' : '#2b4b70';
  const glowShadow = isPowered ? 'drop-shadow(0 0 6px #56E6D0)' : 'none';

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full select-none"
      style={{ filter: glowShadow }}
    >
      {/* Background cell track */}
      <circle cx="50" cy="50" r="46" fill="transparent" />

      {type === 'straight' && (
        <g stroke={pipeColor} strokeWidth="18" strokeLinecap="round">
          <line x1="50" y1="0" x2="50" y2="100" />
          {isPowered && (
            <line x1="50" y1="0" x2="50" y2="100" stroke="#E6FFFA" strokeWidth="6" />
          )}
        </g>
      )}

      {type === 'corner' && (
        <g stroke={pipeColor} strokeWidth="18" strokeLinecap="round" fill="none">
          <path d="M 50,0 Q 50,50 100,50" />
          {isPowered && (
            <path d="M 50,0 Q 50,50 100,50" stroke="#E6FFFA" strokeWidth="6" />
          )}
        </g>
      )}

      {type === 't-junction' && (
        <g stroke={pipeColor} strokeWidth="18" strokeLinecap="round">
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="50" y1="50" x2="100" y2="50" />
          {isPowered && (
            <>
              <line x1="50" y1="0" x2="50" y2="100" stroke="#E6FFFA" strokeWidth="6" />
              <line x1="50" y1="50" x2="100" y2="50" stroke="#E6FFFA" strokeWidth="6" />
            </>
          )}
        </g>
      )}

      {type === 'cross' && (
        <g stroke={pipeColor} strokeWidth="18" strokeLinecap="round">
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="0" y1="50" x2="100" y2="50" />
          {isPowered && (
            <>
              <line x1="50" y1="0" x2="50" y2="100" stroke="#E6FFFA" strokeWidth="6" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#E6FFFA" strokeWidth="6" />
            </>
          )}
        </g>
      )}

      {/* Central power node */}
      <circle
        cx="50"
        cy="50"
        r="14"
        fill={isPowered ? '#56E6D0' : '#14273e'}
        stroke={pipeColor}
        strokeWidth="3"
      />

      {isSource && (
        <circle cx="50" cy="50" r="8" fill="#FFB454" className="animate-ping" />
      )}
      {isDestination && (
        <circle cx="50" cy="50" r="8" fill={isPowered ? '#67E8A5' : '#829bb5'} />
      )}
    </svg>
  );
};

interface PipeConnectProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const PipeConnect: React.FC<PipeConnectProps> = ({
  soundEnabled,
  onToggleSound,
}) => {
  const navigate = useNavigate();
  const [levelIndex, setLevelIndex] = useState<number>(0);
  const activeLevel = CURATED_LEVELS[levelIndex % CURATED_LEVELS.length];

  const [tiles, setTiles] = useState<PipeTile[]>([]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]); // tile ids rotated
  const [movesCount, setMovesCount] = useState<number>(0);
  const [hintTileId, setHintTileId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);

  // Initialize level
  const initLevel = useCallback((lvl: PipeLevel) => {
    const initialized: PipeTile[] = lvl.tiles.map((t, idx) => ({
      id: `pipe-${t.r}-${t.c}-${idx}`,
      r: t.r,
      c: t.c,
      type: t.type,
      solutionRotation: t.correctRot,
      currentRotation: t.initialRot,
      isSource: t.isSource,
      isDestination: t.isDestination,
    }));
    setTiles(initialized);
    setMoveHistory([]);
    setMovesCount(0);
    setHintTileId(null);
    setIsCompleted(false);
  }, []);

  useEffect(() => {
    initLevel(activeLevel);
  }, [activeLevel, initLevel]);

  // Powered tiles calculation via BFS
  const poweredTileIds = useMemo(() => {
    return computePoweredTiles(tiles, activeLevel.rows, activeLevel.cols);
  }, [tiles, activeLevel]);

  // Check destination reached
  useEffect(() => {
    const dest = tiles.find((t) => t.isDestination);
    if (dest && poweredTileIds.has(dest.id) && !isCompleted && tiles.length > 0) {
      setIsCompleted(true);
      sound.playWaterFlow();
      sound.playVictory();

      const efficiency = movesCount <= activeLevel.minMoves ? 3 : movesCount <= activeLevel.minMoves + 4 ? 2 : 1;
      const score = Math.max(100, 500 - (movesCount - activeLevel.minMoves) * 20);

      const recorded = storage.recordGameResult({
        gameId: 'pipe-connect',
        difficulty: activeLevel.difficulty,
        score,
        elapsedSeconds: 0,
        isCompleted: true,
        stats: {
          pipesConnected: tiles.length,
          moves: movesCount,
          rotations: movesCount,
        },
      });
      setLastResult(recorded.result);
    }
  }, [poweredTileIds, tiles, isCompleted, movesCount, activeLevel]);

  // Rotate tile 90 degrees
  const handleRotateTile = (tileId: string) => {
    if (isCompleted) return;

    sound.playPipeRotate();
    setTiles((prev) =>
      prev.map((t) =>
        t.id === tileId ? { ...t, currentRotation: (t.currentRotation + 1) % 4 } : t
      )
    );
    setMoveHistory((h) => [...h, tileId]);
    setMovesCount((m) => m + 1);
    setHintTileId(null);
  };

  // Undo
  const handleUndo = () => {
    if (moveHistory.length === 0 || isCompleted) return;
    const lastId = moveHistory[moveHistory.length - 1];

    setTiles((prev) =>
      prev.map((t) =>
        t.id === lastId ? { ...t, currentRotation: (t.currentRotation + 3) % 4 } : t
      )
    );
    setMoveHistory((h) => h.slice(0, -1));
    setMovesCount((m) => Math.max(0, m - 1));
    sound.playPipeRotate();
  };

  // Hint
  const handleHint = () => {
    const misplaced = tiles.find(
      (t) =>
        (t.type === 'straight' && t.currentRotation % 2 !== t.solutionRotation % 2) ||
        (t.type !== 'straight' && t.currentRotation !== t.solutionRotation)
    );
    if (misplaced) {
      setHintTileId(misplaced.id);
      sound.playClick();
    } else {
      sound.playMismatch();
    }
  };

  // Next level
  const handleNextLevel = () => {
    setLevelIndex((lvl) => (lvl + 1) % CURATED_LEVELS.length);
    sound.playClick();
  };

  const destinationReached = useMemo(() => {
    const dest = tiles.find((t) => t.isDestination);
    return dest ? poweredTileIds.has(dest.id) : false;
  }, [tiles, poweredTileIds]);

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-6 py-4 flex flex-col items-center">
      {/* Top Header & Navigation */}
      <div className="w-full flex items-center justify-between gap-3 mb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#91A7BF] hover:text-[#56E6D0] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Game Hub</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Level Switcher */}
          <div className="flex bg-[#102238] p-1 rounded-xl border border-[rgba(130,180,220,0.18)]">
            {CURATED_LEVELS.map((lvl, idx) => (
              <button
                key={lvl.id}
                onClick={() => setLevelIndex(idx)}
                className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all ${
                  levelIndex === idx
                    ? 'bg-[#56E6D0] text-[#07111F] shadow-[0_0_12px_rgba(86,230,208,0.4)]'
                    : 'text-[#91A7BF] hover:text-white'
                }`}
              >
                L{lvl.levelNumber}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowRules(true)}
            className="p-2 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.18)] text-[#91A7BF] hover:text-[#56E6D0]"
            title="Rules"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.18)] text-[#91A7BF] hover:text-[#56E6D0]"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>
        </div>
      </div>

      {/* Level Info Banner */}
      <div className="w-full bg-[#102238] border border-[rgba(130,180,220,0.16)] rounded-2xl p-4 mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-[#56E6D0]/20 text-[#56E6D0] font-bold">
              Level {activeLevel.levelNumber} • {activeLevel.difficulty}
            </span>
            <span className="text-sm font-bold text-[#F1F7FF]">{activeLevel.name}</span>
          </div>
          <p className="text-xs text-[#91A7BF]">
            Rotate conduits to channel power from the Source to Destination.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-[#0a1727] border border-[rgba(130,180,220,0.14)] text-center">
            <span className="text-[10px] text-[#91A7BF] block">Moves</span>
            <span className="text-sm font-bold font-mono text-[#56E6D0] tabular-nums">
              {movesCount}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#0a1727] border border-[rgba(130,180,220,0.14)] text-center">
            <span className="text-[10px] text-[#91A7BF] block">Target</span>
            <span className="text-sm font-bold font-mono text-[#FFB454] tabular-nums">
              ≤{activeLevel.minMoves}
            </span>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {destinationReached && (
        <div className="w-full mb-4 p-4 rounded-xl bg-[#56E6D0]/15 border border-[#56E6D0]/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[#56E6D0]">
            <Zap className="w-5 h-5 fill-current" />
            Conduit Fully Energized! Destination Reached.
          </div>
          <NeonButton
            variant="cyan"
            size="sm"
            onClick={handleNextLevel}
            icon={<ChevronRight className="w-4 h-4" />}
          >
            Next Level
          </NeonButton>
        </div>
      )}

      {/* Pipe Board Grid */}
      <div className="relative p-3 sm:p-6 rounded-2xl bg-[#081320] border border-[rgba(130,180,220,0.18)] shadow-[0_12px_40px_rgba(0,0,0,0.5)] mb-4 flex justify-center">
        <div
          className="grid gap-2 relative select-none"
          style={{
            gridTemplateRows: `repeat(${activeLevel.rows}, minmax(44px, 64px))`,
            gridTemplateColumns: `repeat(${activeLevel.cols}, minmax(44px, 64px))`,
          }}
        >
          {tiles.map((tile) => {
            const isPowered = poweredTileIds.has(tile.id);
            const isHint = hintTileId === tile.id;

            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => handleRotateTile(tile.id)}
                className={`w-11 h-11 sm:w-16 sm:h-16 rounded-xl border p-1 transition-all duration-200 cursor-pointer relative flex items-center justify-center
                  ${isPowered ? 'bg-[#0f283f] border-[#56E6D0]/50 shadow-[0_0_12px_rgba(86,230,208,0.3)]' : 'bg-[#0b1b2d] border-[#18324e] hover:border-[#56E6D0]/40'}
                  ${isHint ? 'ring-2 ring-[#FFB454] animate-pulse !border-[#FFB454]' : ''}
                `}
                style={{
                  transform: `rotate(${tile.currentRotation * 90}deg)`,
                }}
              >
                <PipeSVG
                  type={tile.type}
                  isPowered={isPowered}
                  isSource={tile.isSource}
                  isDestination={tile.isDestination}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="w-full flex items-center justify-between gap-2 max-w-md">
        <div className="flex gap-2">
          <NeonButton
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={moveHistory.length === 0 || isCompleted}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Undo
          </NeonButton>
          <NeonButton
            variant="amber"
            size="sm"
            onClick={handleHint}
            disabled={isCompleted}
            icon={<Lightbulb className="w-4 h-4" />}
          >
            Hint
          </NeonButton>
        </div>

        <NeonButton
          variant="cyan"
          size="sm"
          onClick={() => initLevel(activeLevel)}
          icon={<RotateCcw className="w-4 h-4" />}
        >
          Reset Level
        </NeonButton>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07111F]/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#102238] border border-[rgba(130,180,220,0.22)] rounded-2xl p-6 text-left space-y-4">
            <h3 className="text-lg font-bold text-[#56E6D0] flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Pipe Connect Rules
            </h3>
            <ul className="text-xs sm:text-sm text-[#91A7BF] space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#56E6D0] shrink-0 mt-0.5" />
                <span>
                  Tap any pipe segment to rotate it 90 degrees clockwise.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#56E6D0] shrink-0 mt-0.5" />
                <span>
                  Connect neighboring open ends to conduct glowing energy from the <strong>Source</strong> to the <strong>Destination</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#56E6D0] shrink-0 mt-0.5" />
                <span>
                  Solve within the target move limit for a maximum 3-star efficiency rating.
                </span>
              </li>
            </ul>
            <div className="pt-2 text-right">
              <NeonButton variant="cyan" size="sm" onClick={() => setShowRules(false)}>
                Got It
              </NeonButton>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      <ResultsModal
        isOpen={isCompleted}
        gameTitle="Pipe Connect"
        result={lastResult}
        onPlayAgain={() => initLevel(activeLevel)}
        onBackToHub={() => navigate('/')}
        onViewProgress={() => navigate('/progress')}
      />
    </div>
  );
};
