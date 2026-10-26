import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, RotateCcw, Lightbulb, Volume2, VolumeX, Shuffle, 
  HelpCircle, Sparkles, Layers, CheckCircle2, Lock 
} from 'lucide-react';
import { NeonButton } from '../components/NeonButton';
import { ResultsModal } from '../components/ResultsModal';
import { storage } from '../services/storageService';
import { sound } from '../services/soundService';
import { Difficulty, GameResult } from '../types';
import { formatDuration } from '../utils/dates';

export interface TileDef {
  id: string;
  type: string;
  category: 'dots' | 'bamboo' | 'chars' | 'winds' | 'dragons' | 'seasons';
  label: string;
  subLabel?: string;
  symbolColor?: string;
}

export interface TilePos {
  id: string;
  type: string;
  category: 'dots' | 'bamboo' | 'chars' | 'winds' | 'dragons' | 'seasons';
  label: string;
  subLabel?: string;
  symbolColor?: string;
  layer: number; // 0 is base, 1 is elevated, 2 is top
  r: number;     // 0..12 row grid
  c: number;     // 0..14 col grid
  matched: boolean;
}

// Full Traditional Mahjong Solitaire Tile Definitions
const TILE_CATALOG: TileDef[] = [
  // Dots (Circles) 1 to 9
  { id: 'dot_1', type: 'dot_1', category: 'dots', label: '1', subLabel: 'Dot 1', symbolColor: '#00C896' },
  { id: 'dot_2', type: 'dot_2', category: 'dots', label: '2', subLabel: 'Dot 2', symbolColor: '#00D2FF' },
  { id: 'dot_3', type: 'dot_3', category: 'dots', label: '3', subLabel: 'Dot 3', symbolColor: '#00D2FF' },
  { id: 'dot_4', type: 'dot_4', category: 'dots', label: '4', subLabel: 'Dot 4', symbolColor: '#00C896' },
  { id: 'dot_5', type: 'dot_5', category: 'dots', label: '5', subLabel: 'Dot 5', symbolColor: '#FF6B8B' },
  { id: 'dot_6', type: 'dot_6', category: 'dots', label: '6', subLabel: 'Dot 6', symbolColor: '#00C896' },
  { id: 'dot_7', type: 'dot_7', category: 'dots', label: '7', subLabel: 'Dot 7', symbolColor: '#00D2FF' },
  { id: 'dot_8', type: 'dot_8', category: 'dots', label: '8', subLabel: 'Dot 8', symbolColor: '#00D2FF' },
  { id: 'dot_9', type: 'dot_9', category: 'dots', label: '9', subLabel: 'Dot 9', symbolColor: '#FF6B8B' },

  // Bamboo (Sticks) 1 to 9
  { id: 'bam_1', type: 'bam_1', category: 'bamboo', label: '𓅃', subLabel: 'Bird', symbolColor: '#10B981' },
  { id: 'bam_2', type: 'bam_2', category: 'bamboo', label: '2', subLabel: 'Bam 2', symbolColor: '#10B981' },
  { id: 'bam_3', type: 'bam_3', category: 'bamboo', label: '3', subLabel: 'Bam 3', symbolColor: '#00D2FF' },
  { id: 'bam_4', type: 'bam_4', category: 'bamboo', label: '4', subLabel: 'Bam 4', symbolColor: '#10B981' },
  { id: 'bam_5', type: 'bam_5', category: 'bamboo', label: '5', subLabel: 'Bam 5', symbolColor: '#FF6B8B' },
  { id: 'bam_6', type: 'bam_6', category: 'bamboo', label: '6', subLabel: 'Bam 6', symbolColor: '#10B981' },
  { id: 'bam_7', type: 'bam_7', category: 'bamboo', label: '7', subLabel: 'Bam 7', symbolColor: '#FF6B8B' },
  { id: 'bam_8', type: 'bam_8', category: 'bamboo', label: '8', subLabel: 'Bam 8', symbolColor: '#10B981' },
  { id: 'bam_9', type: 'bam_9', category: 'bamboo', label: '9', subLabel: 'Bam 9', symbolColor: '#00D2FF' },

  // Characters (Wan / 10,000) 1 to 9
  { id: 'chr_1', type: 'chr_1', category: 'chars', label: '一', subLabel: '1 萬', symbolColor: '#D97706' },
  { id: 'chr_2', type: 'chr_2', category: 'chars', label: '二', subLabel: '2 萬', symbolColor: '#D97706' },
  { id: 'chr_3', type: 'chr_3', category: 'chars', label: '三', subLabel: '3 萬', symbolColor: '#D97706' },
  { id: 'chr_4', type: 'chr_4', category: 'chars', label: '四', subLabel: '4 萬', symbolColor: '#D97706' },
  { id: 'chr_5', type: 'chr_5', category: 'chars', label: '五', subLabel: '5 萬', symbolColor: '#DC2626' },
  { id: 'chr_6', type: 'chr_6', category: 'chars', label: '六', subLabel: '6 萬', symbolColor: '#D97706' },
  { id: 'chr_7', type: 'chr_7', category: 'chars', label: '七', subLabel: '7 萬', symbolColor: '#D97706' },
  { id: 'chr_8', type: 'chr_8', category: 'chars', label: '八', subLabel: '8 萬', symbolColor: '#D97706' },
  { id: 'chr_9', type: 'chr_9', category: 'chars', label: '九', subLabel: '9 萬', symbolColor: '#DC2626' },

  // Winds: East, South, West, North
  { id: 'wnd_e', type: 'wnd_e', category: 'winds', label: '東', subLabel: 'East', symbolColor: '#0284C7' },
  { id: 'wnd_s', type: 'wnd_s', category: 'winds', label: '南', subLabel: 'South', symbolColor: '#0284C7' },
  { id: 'wnd_w', type: 'wnd_w', category: 'winds', label: '西', subLabel: 'West', symbolColor: '#0284C7' },
  { id: 'wnd_n', type: 'wnd_n', category: 'winds', label: '北', subLabel: 'North', symbolColor: '#0284C7' },

  // Dragons: Red Chun, Green Fa, White Bai
  { id: 'drg_r', type: 'drg_r', category: 'dragons', label: '中', subLabel: 'Red', symbolColor: '#E11D48' },
  { id: 'drg_g', type: 'drg_g', category: 'dragons', label: '發', subLabel: 'Green', symbolColor: '#059669' },
  { id: 'drg_w', type: 'drg_w', category: 'dragons', label: '白', subLabel: 'White', symbolColor: '#6366F1' },

  // Seasons / Flowers
  { id: 'sea_sp', type: 'sea_sp', category: 'seasons', label: '春', subLabel: 'Spring', symbolColor: '#EA580C' },
  { id: 'sea_su', type: 'sea_su', category: 'seasons', label: '夏', subLabel: 'Summer', symbolColor: '#E11D48' },
  { id: 'sea_au', type: 'sea_au', category: 'seasons', label: '秋', subLabel: 'Autumn', symbolColor: '#D97706' },
  { id: 'sea_wi', type: 'sea_wi', category: 'seasons', label: '冬', subLabel: 'Winter', symbolColor: '#0284C7' },
];

// Layout Slots Generator
export function generateLayoutSlots(diff: Difficulty): { r: number; c: number; layer: number }[] {
  const slots: { r: number; c: number; layer: number }[] = [];

  if (diff === 'easy') {
    // 36 tiles (18 pairs) - Compact 3-layer Pyramid
    // Layer 0: 6x4 = 24 tiles (cols 1..11, rows 1..7)
    for (let r = 1; r <= 7; r += 2) {
      for (let c = 1; c <= 11; c += 2) {
        slots.push({ r, c, layer: 0 });
      }
    }
    // Layer 1: 4x2 = 8 tiles (cols 3..9, rows 3..5)
    for (let r = 3; r <= 5; r += 2) {
      for (let c = 3; c <= 9; c += 2) {
        slots.push({ r, c, layer: 1 });
      }
    }
    // Layer 2: 4 tiles apex (cols 5..7, rows 3..5)
    slots.push({ r: 3, c: 5, layer: 2 });
    slots.push({ r: 3, c: 7, layer: 2 });
    slots.push({ r: 5, c: 5, layer: 2 });
    slots.push({ r: 5, c: 7, layer: 2 });
  } else if (diff === 'normal') {
    // 54 tiles (27 pairs) - Classic Turtle layout
    // Layer 0: Base turtle wings & body (38 tiles)
    slots.push({ r: 3, c: 0, layer: 0 });
    slots.push({ r: 5, c: 0, layer: 0 });
    slots.push({ r: 3, c: 12, layer: 0 });
    slots.push({ r: 5, c: 12, layer: 0 });

    for (let r = 1; r <= 7; r += 2) {
      for (let c = 2; c <= 10; c += 2) {
        if ((r === 1 || r === 7) && (c === 2 || c === 10)) continue;
        slots.push({ r, c, layer: 0 });
      }
    }
    slots.push({ r: 0, c: 6, layer: 0 });
    slots.push({ r: 8, c: 6, layer: 0 });

    // Layer 1: 12 tiles inner shell
    for (let r = 3; r <= 5; r += 2) {
      for (let c = 4; c <= 8; c += 2) {
        slots.push({ r, c, layer: 1 });
      }
    }
    slots.push({ r: 1, c: 6, layer: 1 });
    slots.push({ r: 7, c: 6, layer: 1 });
    slots.push({ r: 3, c: 2, layer: 1 });
    slots.push({ r: 5, c: 2, layer: 1 });
    slots.push({ r: 3, c: 10, layer: 1 });
    slots.push({ r: 5, c: 10, layer: 1 });

    // Layer 2: 4 tiles center peak
    slots.push({ r: 3, c: 5, layer: 2 });
    slots.push({ r: 3, c: 7, layer: 2 });
    slots.push({ r: 5, c: 5, layer: 2 });
    slots.push({ r: 5, c: 7, layer: 2 });
  } else {
    // 72 tiles (36 pairs) - Grand Fortress
    for (let r = 0; r <= 8; r += 2) {
      for (let c = 1; c <= 11; c += 2) {
        slots.push({ r, c, layer: 0 });
      }
    }
    for (let r = 2; r <= 6; r += 2) {
      for (let c = 3; c <= 9; c += 2) {
        slots.push({ r, c, layer: 1 });
      }
    }
    slots.push({ r: 4, c: 5, layer: 2 });
    slots.push({ r: 4, c: 7, layer: 2 });
    slots.push({ r: 2, c: 6, layer: 2 });
    slots.push({ r: 6, c: 6, layer: 2 });
  }

  if (slots.length % 2 !== 0) {
    slots.pop();
  }
  return slots;
}

// Rule check: is a tile free to pick?
// A tile is selectable when:
// 1. Not covered by any tile directly above it (layer > tile.layer with overlapping 2x2 bounding box)
// 2. Has at least one open lateral side (left or right on the same layer)
export function isTileSelectable(tile: TilePos, allTiles: TilePos[]): boolean {
  if (tile.matched) return false;

  const active = allTiles.filter((t) => !t.matched && t.id !== tile.id);

  // 1. Check covered from above
  const coveredAbove = active.some((other) => {
    if (other.layer <= tile.layer) return false;
    const rowOverlap = Math.abs(other.r - tile.r) < 2;
    const colOverlap = Math.abs(other.c - tile.c) < 2;
    return rowOverlap && colOverlap;
  });

  if (coveredAbove) return false;

  // 2. Check lateral sides on same layer
  const blockedLeft = active.some((other) => {
    if (other.layer !== tile.layer) return false;
    const rowOverlap = Math.abs(other.r - tile.r) < 2;
    return rowOverlap && other.c <= tile.c - 1 && other.c >= tile.c - 2;
  });

  const blockedRight = active.some((other) => {
    if (other.layer !== tile.layer) return false;
    const rowOverlap = Math.abs(other.r - tile.r) < 2;
    return rowOverlap && other.c >= tile.c + 1 && other.c <= tile.c + 2;
  });

  return !blockedLeft || !blockedRight;
}

// Generate guaranteed solvable board by reverse simulation
export function createSolvableBoard(diff: Difficulty): TilePos[] {
  const slots = generateLayoutSlots(diff);
  const totalSlots = slots.length;
  const numPairs = totalSlots / 2;

  // Shuffle and pick pair types from full catalog
  const shuffledCatalog = [...TILE_CATALOG].sort(() => Math.random() - 0.5);
  const pairPool: TileDef[] = [];
  for (let i = 0; i < numPairs; i++) {
    pairPool.push(shuffledCatalog[i % shuffledCatalog.length]);
  }

  // Reverse pairing solver: place pairs on slots that are simultaneously free
  const assigned = new Array<TilePos | null>(totalSlots).fill(null);
  const remaining = new Set<number>(slots.map((_, i) => i));

  const isSlotFreeInSet = (targetIdx: number, activeIndices: Set<number>) => {
    const target = slots[targetIdx];
    // Check covered from above
    for (const idx of activeIndices) {
      if (idx === targetIdx) continue;
      const other = slots[idx];
      if (other.layer > target.layer) {
        if (Math.abs(other.r - target.r) < 2 && Math.abs(other.c - target.c) < 2) {
          return false;
        }
      }
    }
    // Check lateral blocked
    let bLeft = false;
    let bRight = false;
    for (const idx of activeIndices) {
      if (idx === targetIdx) continue;
      const other = slots[idx];
      if (other.layer === target.layer && Math.abs(other.r - target.r) < 2) {
        if (other.c <= target.c - 1 && other.c >= target.c - 2) bLeft = true;
        if (other.c >= target.c + 1 && other.c <= target.c + 2) bRight = true;
      }
    }
    return !bLeft || !bRight;
  };

  for (let p = 0; p < numPairs; p++) {
    const freeCandidates: number[] = [];
    for (const idx of remaining) {
      if (isSlotFreeInSet(idx, remaining)) {
        freeCandidates.push(idx);
      }
    }

    if (freeCandidates.length >= 2) {
      // Pick 2 random free slots
      freeCandidates.sort(() => Math.random() - 0.5);
      const idxA = freeCandidates[0];
      const idxB = freeCandidates[1];
      const def = pairPool[p];

      assigned[idxA] = {
        id: `tile-${slots[idxA].layer}-${slots[idxA].r}-${slots[idxA].c}-${idxA}`,
        type: def.type,
        category: def.category,
        label: def.label,
        subLabel: def.subLabel,
        symbolColor: def.symbolColor,
        layer: slots[idxA].layer,
        r: slots[idxA].r,
        c: slots[idxA].c,
        matched: false,
      };
      assigned[idxB] = {
        id: `tile-${slots[idxB].layer}-${slots[idxB].r}-${slots[idxB].c}-${idxB}`,
        type: def.type,
        category: def.category,
        label: def.label,
        subLabel: def.subLabel,
        symbolColor: def.symbolColor,
        layer: slots[idxB].layer,
        r: slots[idxB].r,
        c: slots[idxB].c,
        matched: false,
      };

      remaining.delete(idxA);
      remaining.delete(idxB);
    } else {
      // Fallback
      const arr = Array.from(remaining);
      const idxA = arr[0];
      const idxB = arr[1] || arr[0];
      const def = pairPool[p];

      assigned[idxA] = {
        id: `tile-${slots[idxA].layer}-${slots[idxA].r}-${slots[idxA].c}-${idxA}`,
        type: def.type,
        category: def.category,
        label: def.label,
        subLabel: def.subLabel,
        symbolColor: def.symbolColor,
        layer: slots[idxA].layer,
        r: slots[idxA].r,
        c: slots[idxA].c,
        matched: false,
      };
      if (idxB !== idxA && assigned[idxB] === null) {
        assigned[idxB] = {
          id: `tile-${slots[idxB].layer}-${slots[idxB].r}-${slots[idxB].c}-${idxB}`,
          type: def.type,
          category: def.category,
          label: def.label,
          subLabel: def.subLabel,
          symbolColor: def.symbolColor,
          layer: slots[idxB].layer,
          r: slots[idxB].r,
          c: slots[idxB].c,
          matched: false,
        };
      }
      remaining.delete(idxA);
      remaining.delete(idxB);
    }
  }

  return assigned.filter((t): t is TilePos => t !== null);
}

// Visual Mahjong Tile Component
export const MahjongTileFace: React.FC<{
  tile: TilePos;
  isSelected: boolean;
  isHinted: boolean;
  isCandidate: boolean; // Same type as selected
  isBlocked: boolean;
  onClick: () => void;
}> = ({ tile, isSelected, isHinted, isCandidate, isBlocked, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={tile.matched}
      aria-label={`${tile.category} ${tile.label} ${isBlocked ? 'blocked' : 'available'}`}
      style={{
        gridRowStart: tile.r + 1,
        gridRowEnd: tile.r + 3,
        gridColumnStart: tile.c + 1,
        gridColumnEnd: tile.c + 3,
        zIndex: tile.layer * 10 + 2,
        transform: `translate(${tile.layer * -3}px, ${tile.layer * -4}px) ${
          isSelected ? 'translateY(-8px) scale(1.05)' : ''
        }`,
      }}
      className={`relative w-full h-full min-w-[44px] sm:min-w-[52px] min-h-[58px] sm:min-h-[70px] rounded-lg transition-all duration-200 select-none cursor-pointer flex flex-col items-center justify-between p-1 sm:p-1.5 font-sans
        ${tile.matched ? 'opacity-0 pointer-events-none' : ''}
        ${
          isBlocked
            ? 'opacity-65 brightness-75 bg-[#0b1624] border border-[#172e47] cursor-not-allowed shadow-none'
            : 'opacity-100 bg-gradient-to-b from-[#1b324e] to-[#12243a] border border-[#2b517d] hover:border-[#56E6D0] hover:-translate-y-1 shadow-[0_6px_14px_rgba(0,0,0,0.6)]'
        }
        ${
          isSelected
            ? '!bg-gradient-to-b !from-[#1d436c] !to-[#153456] !border-[#56E6D0] ring-2 ring-[#56E6D0] shadow-[0_0_20px_rgba(86,230,208,0.7)] !z-50'
            : ''
        }
        ${
          isCandidate && !isSelected && !isBlocked
            ? 'ring-2 ring-[#56E6D0]/60 border-[#56E6D0]/80 shadow-[0_0_12px_rgba(86,230,208,0.4)]'
            : ''
        }
        ${
          isHinted
            ? 'ring-2 ring-[#FFB454] !border-[#FFB454] animate-pulse shadow-[0_0_22px_rgba(255,180,84,0.8)] !z-40'
            : ''
        }
      `}
    >
      {/* 3D Physical Tile Edge / Bevel */}
      <div className="absolute inset-x-0 -bottom-1.5 h-2 bg-[#091524] rounded-b-lg border-x border-b border-[#14283f] pointer-events-none" />
      {/* 3D Left Bevel */}
      <div className="absolute -left-1 inset-y-0 w-1 bg-[#0d1d31] rounded-l-lg border-y border-l border-[#14283f] pointer-events-none" />

      {/* Top Header: Sub-label & Layer marker */}
      <div className="w-full flex justify-between items-center text-[9px] sm:text-[10px] text-[#86A0BD] px-0.5 leading-none pointer-events-none">
        <span className="font-mono font-semibold">{tile.subLabel || tile.label}</span>
        {isBlocked ? (
          <Lock className="w-2.5 h-2.5 text-[#5e7794]" />
        ) : (
          <span className="text-[8px] opacity-70 font-mono">L{tile.layer + 1}</span>
        )}
      </div>

      {/* Center Artwork Face */}
      <div className="flex-1 flex items-center justify-center pointer-events-none py-0.5">
        {tile.category === 'dots' && (
          <div className="relative flex items-center justify-center">
            <div
              className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center font-bold"
              style={{ borderColor: tile.symbolColor, color: tile.symbolColor }}
            >
              <div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
                style={{ backgroundColor: tile.symbolColor }}
              />
            </div>
            <span className="absolute text-[11px] sm:text-xs font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {tile.label}
            </span>
          </div>
        )}

        {tile.category === 'bamboo' && (
          <div className="flex flex-col items-center justify-center gap-0.5" style={{ color: tile.symbolColor }}>
            {tile.label === '𓅃' ? (
              <span className="text-xl sm:text-2xl drop-shadow">𓅃</span>
            ) : (
              <>
                <div className="w-1.5 h-4 sm:h-5 rounded-full bg-current shadow-sm" />
                <span className="text-[10px] sm:text-xs font-bold font-mono text-white">
                  {tile.label}
                </span>
              </>
            )}
          </div>
        )}

        {tile.category === 'chars' && (
          <div className="flex flex-col items-center justify-center leading-none" style={{ color: tile.symbolColor }}>
            <span className="text-sm sm:text-base font-extrabold font-serif drop-shadow">{tile.label}</span>
            <span className="text-[10px] sm:text-xs font-bold text-red-400 font-serif">萬</span>
          </div>
        )}

        {tile.category === 'winds' && (
          <div className="text-lg sm:text-2xl font-black font-serif drop-shadow" style={{ color: tile.symbolColor }}>
            {tile.label}
          </div>
        )}

        {tile.category === 'dragons' && (
          <div className="text-lg sm:text-2xl font-black font-serif drop-shadow" style={{ color: tile.symbolColor }}>
            {tile.label}
          </div>
        )}

        {tile.category === 'seasons' && (
          <div className="flex flex-col items-center justify-center leading-none" style={{ color: tile.symbolColor }}>
            <span className="text-sm sm:text-base font-extrabold font-serif drop-shadow">{tile.label}</span>
            <Sparkles className="w-2.5 h-2.5 text-amber-300 mt-0.5" />
          </div>
        )}
      </div>

      {/* Bottom Footer: Category initial */}
      <div className="w-full text-right text-[8px] sm:text-[9px] text-[#86A0BD] px-0.5 pointer-events-none uppercase font-mono font-semibold">
        {tile.category.slice(0, 3)}
      </div>
    </button>
  );
};

interface MahjongSolitaireProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const MahjongSolitaire: React.FC<MahjongSolitaireProps> = ({
  soundEnabled,
  onToggleSound,
}) => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [tiles, setTiles] = useState<TilePos[]>(() => createSolvableBoard('normal'));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hintIds, setHintIds] = useState<[string, string] | null>(null);
  const [moveHistory, setMoveHistory] = useState<{ id1: string; id2: string }[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsed, setElapsed] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [noMovesNotice, setNoMovesNotice] = useState<boolean>(false);

  // Timer
  useEffect(() => {
    if (isGameOver) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isGameOver]);

  // Restart
  const handleRestart = useCallback(
    (newDiff: Difficulty = difficulty) => {
      setTiles(createSolvableBoard(newDiff));
      setSelectedId(null);
      setHintIds(null);
      setMoveHistory([]);
      setStartTime(Date.now());
      setElapsed(0);
      setScore(0);
      setHintsUsed(0);
      setIsGameOver(false);
      setNoMovesNotice(false);
      sound.playClick();
    },
    [difficulty]
  );

  // Set of selectable tile IDs
  const freeTileIds = useMemo(() => {
    const freeSet = new Set<string>();
    tiles.forEach((t) => {
      if (isTileSelectable(t, tiles)) {
        freeSet.add(t.id);
      }
    });
    return freeSet;
  }, [tiles]);

  // Available matching pairs among selectable tiles
  const availablePairs = useMemo(() => {
    const freeTiles = tiles.filter((t) => freeTileIds.has(t.id));
    const pairs: [TilePos, TilePos][] = [];

    for (let i = 0; i < freeTiles.length; i++) {
      for (let j = i + 1; j < freeTiles.length; j++) {
        const a = freeTiles[i];
        const b = freeTiles[j];
        if (a.type === b.type) {
          pairs.push([a, b]);
        }
      }
    }
    return pairs;
  }, [tiles, freeTileIds]);

  // Check victory or deadlock
  useEffect(() => {
    const remainingCount = tiles.filter((t) => !t.matched).length;

    if (remainingCount === 0 && !isGameOver) {
      // Victory!
      setIsGameOver(true);
      sound.playVictory();
      const recorded = storage.recordGameResult({
        gameId: 'mahjong-solitaire',
        difficulty,
        score: score + 500,
        elapsedSeconds: elapsed,
        isCompleted: true,
        stats: {
          pairsMatched: tiles.length / 2,
          hintsUsed,
        },
      });
      setLastResult(recorded.result);
      return;
    }

    if (remainingCount > 0 && availablePairs.length === 0) {
      setNoMovesNotice(true);
    } else {
      setNoMovesNotice(false);
    }
  }, [tiles, availablePairs, isGameOver, difficulty, score, elapsed, hintsUsed]);

  // Tile click handler
  const handleTileClick = (tile: TilePos) => {
    if (tile.matched) return;

    if (!freeTileIds.has(tile.id)) {
      sound.playMismatch();
      return;
    }

    setHintIds(null);

    // If nothing selected yet, select this tile
    if (!selectedId) {
      setSelectedId(tile.id);
      sound.playTileSelect();
      return;
    }

    // Clicking same tile deselects it
    if (selectedId === tile.id) {
      setSelectedId(null);
      sound.playClick();
      return;
    }

    // Second tile selected - check match
    const firstTile = tiles.find((t) => t.id === selectedId);
    if (!firstTile) {
      setSelectedId(tile.id);
      return;
    }

    if (firstTile.type === tile.type) {
      // MATCH!
      sound.playTileMatch();
      setTiles((prev) =>
        prev.map((t) =>
          t.id === firstTile.id || t.id === tile.id ? { ...t, matched: true } : t
        )
      );
      setMoveHistory((prev) => [...prev, { id1: firstTile.id, id2: tile.id }]);
      setScore((s) => s + 100);
      setSelectedId(null);
    } else {
      // Mismatch: select the new tile instead
      sound.playMismatch();
      setSelectedId(tile.id);
    }
  };

  // Undo move
  const handleUndo = () => {
    if (moveHistory.length === 0) return;
    const lastMove = moveHistory[moveHistory.length - 1];
    setTiles((prev) =>
      prev.map((t) =>
        t.id === lastMove.id1 || t.id === lastMove.id2 ? { ...t, matched: false } : t
      )
    );
    setMoveHistory((prev) => prev.slice(0, -1));
    setSelectedId(null);
    setHintIds(null);
    sound.playCardFlip();
  };

  // Hint
  const handleHint = () => {
    if (availablePairs.length > 0) {
      const pair = availablePairs[0];
      setHintIds([pair[0].id, pair[1].id]);
      setHintsUsed((prev) => prev + 1);
      sound.playClick();
    } else {
      sound.playMismatch();
    }
  };

  // Shuffle remaining tiles
  const handleShuffle = () => {
    const remaining = tiles.filter((t) => !t.matched);
    if (remaining.length < 2) return;

    const types = remaining.map((t) => ({
      type: t.type,
      category: t.category,
      label: t.label,
      subLabel: t.subLabel,
      symbolColor: t.symbolColor,
    }));
    types.sort(() => Math.random() - 0.5);

    setTiles((prev) => {
      let rIdx = 0;
      return prev.map((t) => {
        if (t.matched) return t;
        const newType = types[rIdx++];
        return {
          ...t,
          type: newType.type,
          category: newType.category,
          label: newType.label,
          subLabel: newType.subLabel,
          symbolColor: newType.symbolColor,
        };
      });
    });

    setSelectedId(null);
    setHintIds(null);
    sound.playCardFlip();
  };

  const remainingTilesCount = tiles.filter((t) => !t.matched).length;
  const matchedPairsCount = (tiles.length - remainingTilesCount) / 2;
  const selectedTileObj = tiles.find((t) => t.id === selectedId);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 flex flex-col items-center">
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
          {/* Difficulty Selector */}
          <div className="flex bg-[#102238] p-1 rounded-xl border border-[rgba(130,180,220,0.18)]">
            {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDifficulty(d);
                  handleRestart(d);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  difficulty === d
                    ? 'bg-[#56E6D0] text-[#07111F] shadow-[0_0_12px_rgba(86,230,208,0.4)]'
                    : 'text-[#91A7BF] hover:text-white'
                }`}
              >
                {d}
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

      {/* Dashboard Stats */}
      <div className="w-full grid grid-cols-4 gap-2 sm:gap-3 mb-4">
        <div className="p-2 sm:p-3 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.14)] text-center">
          <span className="text-[10px] sm:text-xs text-[#91A7BF] block">Remaining</span>
          <span className="text-base sm:text-lg font-bold font-mono text-[#56E6D0] tabular-nums">
            {remainingTilesCount}
          </span>
        </div>
        <div className="p-2 sm:p-3 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.14)] text-center">
          <span className="text-[10px] sm:text-xs text-[#91A7BF] block">Matched</span>
          <span className="text-base sm:text-lg font-bold font-mono text-[#67E8A5] tabular-nums">
            {matchedPairsCount}
          </span>
        </div>
        <div className="p-2 sm:p-3 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.14)] text-center">
          <span className="text-[10px] sm:text-xs text-[#91A7BF] block">Open Pairs</span>
          <span className="text-base sm:text-lg font-bold font-mono text-[#FFB454] tabular-nums">
            {availablePairs.length}
          </span>
        </div>
        <div className="p-2 sm:p-3 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.14)] text-center">
          <span className="text-[10px] sm:text-xs text-[#91A7BF] block">Time</span>
          <span className="text-base sm:text-lg font-bold font-mono text-white tabular-nums">
            {formatDuration(elapsed)}
          </span>
        </div>
      </div>

      {/* Deadlock Notice */}
      {noMovesNotice && (
        <div className="w-full mb-3 p-3 rounded-xl bg-[#FF6B8B]/15 border border-[#FF6B8B]/40 flex items-center justify-between text-xs sm:text-sm text-[#FF6B8B]">
          <span>No free matching pairs remain on the board.</span>
          <button
            onClick={handleShuffle}
            className="px-3 py-1 bg-[#FF6B8B] text-[#07111F] rounded-lg font-bold flex items-center gap-1.5 hover:bg-[#ff85a1]"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Shuffle Tiles
          </button>
        </div>
      )}

      {/* Game Board Container */}
      <div className="relative w-full overflow-x-auto overflow-y-hidden py-6 px-2 flex justify-center items-center bg-[#071322]/80 rounded-2xl border border-[rgba(130,180,220,0.16)] min-h-[460px] sm:min-h-[520px]">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e3b5e_1px,transparent_1px)] [background-size:20px_20px] opacity-25 pointer-events-none" />

        {/* Board grid: 10 rows x 14 cols */}
        <div
          className="grid gap-1 relative"
          style={{
            gridTemplateRows: 'repeat(10, minmax(28px, 42px))',
            gridTemplateColumns: 'repeat(14, minmax(26px, 42px))',
            width: 'fit-content',
          }}
        >
          {tiles.map((tile) => (
            <MahjongTileFace
              key={tile.id}
              tile={tile}
              isSelected={selectedId === tile.id}
              isHinted={hintIds ? hintIds[0] === tile.id || hintIds[1] === tile.id : false}
              isCandidate={Boolean(selectedTileObj && selectedTileObj.type === tile.type)}
              isBlocked={!freeTileIds.has(tile.id)}
              onClick={() => handleTileClick(tile)}
            />
          ))}
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="w-full flex items-center justify-between gap-2 mt-4">
        <div className="flex gap-2">
          <NeonButton
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={moveHistory.length === 0}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Undo
          </NeonButton>
          <NeonButton
            variant="amber"
            size="sm"
            onClick={handleHint}
            disabled={availablePairs.length === 0}
            icon={<Lightbulb className="w-4 h-4" />}
          >
            Hint
          </NeonButton>
          <NeonButton
            variant="ghost"
            size="sm"
            onClick={handleShuffle}
            icon={<Shuffle className="w-4 h-4" />}
          >
            Shuffle
          </NeonButton>
        </div>

        <NeonButton
          variant="cyan"
          size="sm"
          onClick={() => handleRestart()}
          icon={<RotateCcw className="w-4 h-4" />}
        >
          Restart
        </NeonButton>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07111F]/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#102238] border border-[rgba(130,180,220,0.22)] rounded-2xl p-6 text-left space-y-4">
            <h3 className="text-lg font-bold text-[#56E6D0] flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Mahjong Solitaire Rules
            </h3>
            <ul className="text-xs sm:text-sm text-[#91A7BF] space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#56E6D0] shrink-0 mt-0.5" />
                <span>
                  Match identical free tiles to clear them from the board.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#56E6D0] shrink-0 mt-0.5" />
                <span>
                  A tile is <strong>free</strong> if no tile covers it from above, and it has at least one open lateral side (left or right).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#56E6D0] shrink-0 mt-0.5" />
                <span>
                  Blocked tiles are locked and dimmed. Selecting a free tile highlights candidate matches.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#56E6D0] shrink-0 mt-0.5" />
                <span>
                  If you run out of moves, use <strong>Shuffle</strong> to mix remaining tiles.
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
        isOpen={isGameOver}
        gameTitle="Mahjong Solitaire"
        result={lastResult}
        onPlayAgain={() => handleRestart()}
        onBackToHub={() => navigate('/')}
        onViewProgress={() => navigate('/progress')}
      />
    </div>
  );
};
