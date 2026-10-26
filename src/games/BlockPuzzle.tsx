import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, RotateCcw, Volume2, VolumeX, 
  HelpCircle, Grid3X3, CheckCircle2, Flame, Sparkles, Trophy 
} from 'lucide-react';
import { NeonButton } from '../components/NeonButton';
import { ResultsModal } from '../components/ResultsModal';
import { storage } from '../services/storageService';
import { sound } from '../services/soundService';
import { GameResult } from '../types';

export interface BlockShape {
  id: string;
  name: string;
  matrix: number[][]; // 2D array of 0s and 1s
  color: string;
}

const SHAPE_TEMPLATES: { name: string; matrix: number[][]; color: string }[] = [
  // 1x1
  { name: 'dot', matrix: [[1]], color: '#56E6D0' },
  // 2x2
  { name: 'square-2', matrix: [[1, 1], [1, 1]], color: '#62B7FF' },
  // 3x3
  { name: 'square-3', matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: '#A78BFA' },
  // Horizontal bars
  { name: 'bar-h2', matrix: [[1, 1]], color: '#67E8A5' },
  { name: 'bar-h3', matrix: [[1, 1, 1]], color: '#56E6D0' },
  { name: 'bar-h4', matrix: [[1, 1, 1, 1]], color: '#FFB454' },
  { name: 'bar-h5', matrix: [[1, 1, 1, 1, 1]], color: '#FF6B8B' },
  // Vertical bars
  { name: 'bar-v2', matrix: [[1], [1]], color: '#67E8A5' },
  { name: 'bar-v3', matrix: [[1], [1], [1]], color: '#56E6D0' },
  { name: 'bar-v4', matrix: [[1], [1], [1], [1]], color: '#FFB454' },
  { name: 'bar-v5', matrix: [[1], [1], [1], [1], [1]], color: '#FF6B8B' },
  // Corner 2x2
  { name: 'corner-1', matrix: [[1, 1], [1, 0]], color: '#FFB454' },
  { name: 'corner-2', matrix: [[1, 1], [0, 1]], color: '#FFB454' },
  { name: 'corner-3', matrix: [[1, 0], [1, 1]], color: '#FFB454' },
  { name: 'corner-4', matrix: [[0, 1], [1, 1]], color: '#FFB454' },
  // L-shape 3x3
  { name: 'l-shape', matrix: [[1, 0], [1, 0], [1, 1]], color: '#A78BFA' },
  { name: 'j-shape', matrix: [[0, 1], [0, 1], [1, 1]], color: '#A78BFA' },
  // T-shape
  { name: 't-shape', matrix: [[1, 1, 1], [0, 1, 0]], color: '#62B7FF' },
  // Plus
  { name: 'plus', matrix: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], color: '#56E6D0' },
];

function getRandomShapes(): BlockShape[] {
  const selected: BlockShape[] = [];
  for (let i = 0; i < 3; i++) {
    const template = SHAPE_TEMPLATES[Math.floor(Math.random() * SHAPE_TEMPLATES.length)];
    selected.push({
      id: `${template.name}-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
      name: template.name,
      matrix: template.matrix,
      color: template.color,
    });
  }
  return selected;
}

// Can a shape legally fit at board (startR, startC)?
export function canPlaceShape(
  grid: (string | null)[][],
  shape: BlockShape,
  startR: number,
  startC: number
): boolean {
  const rows = shape.matrix.length;
  const cols = shape.matrix[0].length;

  if (startR + rows > 10 || startC + cols > 10 || startR < 0 || startC < 0) {
    return false;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (shape.matrix[r][c] === 1) {
        if (grid[startR + r][startC + c] !== null) {
          return false;
        }
      }
    }
  }

  return true;
}

// Check if shape can fit ANYWHERE on 10x10 board
export function canFitAnywhere(grid: (string | null)[][], shape: BlockShape): boolean {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (canPlaceShape(grid, shape, r, c)) {
        return true;
      }
    }
  }
  return false;
}

interface BlockPuzzleProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const BlockPuzzle: React.FC<BlockPuzzleProps> = ({
  soundEnabled,
  onToggleSound,
}) => {
  const navigate = useNavigate();
  const boardRef = useRef<HTMLDivElement | null>(null);

  // 10x10 board
  const [grid, setGrid] = useState<(string | null)[][]>(() =>
    Array(10).fill(null).map(() => Array(10).fill(null))
  );
  const [tray, setTray] = useState<BlockShape[]>(() => getRandomShapes());
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ r: number; c: number } | null>(null);

  // Dragging state (mouse & touch)
  const [dragState, setDragState] = useState<{
    shape: BlockShape;
    x: number;
    y: number;
  } | null>(null);

  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [totalLinesCleared, setTotalLinesCleared] = useState<number>(0);
  const [blocksPlaced, setBlocksPlaced] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [clearingLines, setClearingLines] = useState<{ rows: number[]; cols: number[] }>({
    rows: [],
    cols: [],
  });

  const activeShape = useMemo(() => {
    if (dragState) return dragState.shape;
    return tray.find((s) => s.id === selectedShapeId) || null;
  }, [dragState, tray, selectedShapeId]);

  // Restart
  const handleRestart = useCallback(() => {
    setGrid(Array(10).fill(null).map(() => Array(10).fill(null)));
    setTray(getRandomShapes());
    setSelectedShapeId(null);
    setHoverPos(null);
    setDragState(null);
    setScore(0);
    setCombo(0);
    setTotalLinesCleared(0);
    setBlocksPlaced(0);
    setIsGameOver(false);
    setClearingLines({ rows: [], cols: [] });
    sound.playClick();
  }, []);

  // Check Game Over when tray updates
  useEffect(() => {
    if (tray.length === 0) {
      setTray(getRandomShapes());
      return;
    }

    const canMove = tray.some((shape) => canFitAnywhere(grid, shape));
    if (!canMove && !isGameOver) {
      setIsGameOver(true);
      const recorded = storage.recordGameResult({
        gameId: 'block-puzzle',
        difficulty: 'normal',
        score,
        elapsedSeconds: 0,
        isCompleted: true,
        stats: {
          linesCleared: totalLinesCleared,
          blocksPlaced,
        },
      });
      setLastResult(recorded.result);
      sound.playMismatch();
    }
  }, [tray, grid, isGameOver, score, totalLinesCleared, blocksPlaced]);

  // Place Shape at grid (r, c)
  const placeShapeAt = (shape: BlockShape, r: number, c: number) => {
    if (!canPlaceShape(grid, shape, r, c)) {
      sound.playMismatch();
      return false;
    }

    sound.playBlockPlace();
    const newGrid = grid.map((row) => [...row]);
    let cellsPlaced = 0;

    for (let sR = 0; sR < shape.matrix.length; sR++) {
      for (let sC = 0; sC < shape.matrix[0].length; sC++) {
        if (shape.matrix[sR][sC] === 1) {
          newGrid[r + sR][c + sC] = shape.color;
          cellsPlaced++;
        }
      }
    }

    // Remove from tray
    const remainingTray = tray.filter((s) => s.id !== shape.id);
    setSelectedShapeId(null);
    setHoverPos(null);
    setDragState(null);
    setBlocksPlaced((b) => b + 1);

    // Detect filled rows and cols
    const filledRows: number[] = [];
    const filledCols: number[] = [];

    for (let rowIdx = 0; rowIdx < 10; rowIdx++) {
      if (newGrid[rowIdx].every((cell) => cell !== null)) {
        filledRows.push(rowIdx);
      }
    }

    for (let colIdx = 0; colIdx < 10; colIdx++) {
      let full = true;
      for (let rowIdx = 0; rowIdx < 10; rowIdx++) {
        if (newGrid[rowIdx][colIdx] === null) {
          full = false;
          break;
        }
      }
      if (full) {
        filledCols.push(colIdx);
      }
    }

    const linesCount = filledRows.length + filledCols.length;

    if (linesCount > 0) {
      setClearingLines({ rows: filledRows, cols: filledCols });
      sound.playLineClear(linesCount);

      const lineScore = [0, 100, 300, 600, 1000, 1500][Math.min(linesCount, 5)];
      const comboMultiplier = combo + 1;
      const earned = cellsPlaced * 10 + lineScore * comboMultiplier;

      setScore((s) => s + earned);
      setCombo((cmb) => cmb + 1);
      setTotalLinesCleared((lines) => lines + linesCount);

      setTimeout(() => {
        const clearedGrid = newGrid.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            if (filledRows.includes(rowIdx) || filledCols.includes(colIdx)) {
              return null;
            }
            return cell;
          })
        );
        setGrid(clearedGrid);
        setClearingLines({ rows: [], cols: [] });
        setTray(remainingTray.length === 0 ? getRandomShapes() : remainingTray);
      }, 250);
    } else {
      setScore((s) => s + cellsPlaced * 10);
      setCombo(0);
      setGrid(newGrid);
      setTray(remainingTray.length === 0 ? getRandomShapes() : remainingTray);
    }

    return true;
  };

  // Tap-to-Place cell click
  const handleCellClick = (r: number, c: number) => {
    if (!selectedShapeId) return;
    const shape = tray.find((s) => s.id === selectedShapeId);
    if (!shape) return;
    placeShapeAt(shape, r, c);
  };

  // Convert screen coordinates (clientX, clientY) to grid (r, c)
  const getGridCoordsFromPoint = useCallback(
    (clientX: number, clientY: number, shape: BlockShape) => {
      if (!boardRef.current) return null;
      const rect = boardRef.current.getBoundingClientRect();
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return null;
      }

      const cellW = rect.width / 10;
      const cellH = rect.height / 10;

      // Align piece so top-left corner is near finger or centered
      const c = Math.floor((clientX - rect.left) / cellW);
      const r = Math.floor((clientY - rect.top) / cellH);

      if (r >= 0 && r < 10 && c >= 0 && c < 10) {
        return { r, c };
      }
      return null;
    },
    []
  );

  // Pointer Drag Handlers
  const handlePointerDownShape = (e: React.PointerEvent, shape: BlockShape) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // Apply -60px vertical offset for touch so finger doesn't obscure piece
    const isTouch = e.pointerType === 'touch';
    const offsetY = isTouch ? -60 : 0;

    setDragState({
      shape,
      x: e.clientX,
      y: e.clientY + offsetY,
    });
    setSelectedShapeId(shape.id);
    sound.playTileSelect();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    const isTouch = e.pointerType === 'touch';
    const offsetY = isTouch ? -60 : 0;
    const curX = e.clientX;
    const curY = e.clientY + offsetY;

    setDragState((prev) => (prev ? { ...prev, x: curX, y: curY } : null));

    const coords = getGridCoordsFromPoint(curX, curY, dragState.shape);
    setHoverPos(coords);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState) return;

    if (hoverPos) {
      placeShapeAt(dragState.shape, hoverPos.r, hoverPos.c);
    }

    setDragState(null);
    setHoverPos(null);
  };

  // Preview cell state
  const isCellPreviewing = (r: number, c: number): { active: boolean; valid: boolean; color?: string } => {
    if (!activeShape || !hoverPos) return { active: false, valid: true };

    const offsetR = r - hoverPos.r;
    const offsetC = c - hoverPos.c;

    if (
      offsetR >= 0 &&
      offsetR < activeShape.matrix.length &&
      offsetC >= 0 &&
      offsetC < activeShape.matrix[0].length &&
      activeShape.matrix[offsetR][offsetC] === 1
    ) {
      const valid = canPlaceShape(grid, activeShape, hoverPos.r, hoverPos.c);
      return { active: true, valid, color: activeShape.color };
    }

    return { active: false, valid: true };
  };

  return (
    <div
      className="max-w-4xl mx-auto px-2 sm:px-6 py-4 flex flex-col items-center select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        setDragState(null);
        setHoverPos(null);
      }}
    >
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
          <span className="text-[10px] sm:text-xs text-[#91A7BF] block">Score</span>
          <span className="text-base sm:text-lg font-bold font-mono text-[#56E6D0] tabular-nums">
            {score}
          </span>
        </div>
        <div className="p-2 sm:p-3 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.14)] text-center">
          <span className="text-[10px] sm:text-xs text-[#91A7BF] block">Lines Cleared</span>
          <span className="text-base sm:text-lg font-bold font-mono text-[#67E8A5] tabular-nums">
            {totalLinesCleared}
          </span>
        </div>
        <div className="p-2 sm:p-3 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.14)] text-center">
          <span className="text-[10px] sm:text-xs text-[#91A7BF] block flex items-center justify-center gap-1">
            <Flame className="w-3 h-3 text-[#FFB454]" /> Combo
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-[#FFB454] tabular-nums">
            {combo > 0 ? `${combo}x` : '-'}
          </span>
        </div>
        <div className="p-2 sm:p-3 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.14)] text-center">
          <span className="text-[10px] sm:text-xs text-[#91A7BF] block">Blocks</span>
          <span className="text-base sm:text-lg font-bold font-mono text-white tabular-nums">
            {blocksPlaced}
          </span>
        </div>
      </div>

      {/* Guidance prompt */}
      <div className="w-full text-center text-xs font-mono mb-2 h-5 flex items-center justify-center">
        {dragState ? (
          <span className="text-[#56E6D0] font-semibold flex items-center gap-1.5 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-[#56E6D0]" />
            Dragging block: drop onto grid cells
          </span>
        ) : selectedShapeId ? (
          <span className="text-[#56E6D0] font-semibold flex items-center gap-1.5 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-[#56E6D0]" />
            Block selected: tap any grid cell or drag it directly
          </span>
        ) : (
          <span className="text-[#91A7BF]">
            Drag a shape to the grid, or tap to place
          </span>
        )}
      </div>

      {/* 10x10 Grid Board */}
      <div 
        ref={boardRef}
        className="relative p-3 sm:p-5 rounded-2xl bg-[#091524] border border-[rgba(130,180,220,0.18)] shadow-[0_12px_40px_rgba(0,0,0,0.5)] mb-5 touch-none"
      >
        <div
          className="grid grid-cols-10 grid-rows-10 gap-1 sm:gap-1.5"
          onMouseLeave={() => {
            if (!dragState) setHoverPos(null);
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const preview = isCellPreviewing(r, c);
              const isClearing =
                clearingLines.rows.includes(r) || clearingLines.cols.includes(c);

              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onMouseEnter={() => {
                    if (!dragState && selectedShapeId) {
                      setHoverPos({ r, c });
                    }
                  }}
                  onClick={() => handleCellClick(r, c)}
                  className={`w-7 h-7 sm:w-10 sm:h-10 rounded-md sm:rounded-lg transition-all duration-100 relative
                    ${cell ? 'shadow-[0_0_8px_rgba(0,0,0,0.4)]' : 'bg-[#0d1e34] border border-[#162d49] hover:border-[#56E6D0]/50'}
                    ${isClearing ? 'animate-pulse !bg-white !shadow-[0_0_20px_#fff]' : ''}
                  `}
                  style={{
                    backgroundColor: cell ? cell : undefined,
                  }}
                >
                  {/* Placement preview overlay */}
                  {preview.active && (
                    <div
                      className={`absolute inset-0 rounded-md sm:rounded-lg ${
                        preview.valid
                          ? 'border-2 border-[#56E6D0] bg-[#56E6D0]/50 shadow-[0_0_12px_rgba(86,230,208,0.7)]'
                          : 'border-2 border-red-500 bg-red-500/30'
                      }`}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Tray: 3 shapes */}
      <div className="w-full max-w-md bg-[#102238] border border-[rgba(130,180,220,0.18)] rounded-2xl p-4 flex items-center justify-around gap-2 mb-4">
        {tray.map((shape) => {
          const isSelected = selectedShapeId === shape.id;
          const isBeingDragged = dragState?.shape.id === shape.id;
          const fitsSomewhere = canFitAnywhere(grid, shape);

          return (
            <div
              key={shape.id}
              onPointerDown={(e) => handlePointerDownShape(e, shape)}
              onClick={() => {
                setSelectedShapeId(isSelected ? null : shape.id);
                sound.playTileSelect();
              }}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 min-w-[80px] sm:min-w-[100px] min-h-[80px] sm:min-h-[90px] cursor-grab active:cursor-grabbing touch-none
                ${isSelected ? 'bg-[#1c385c] border-[#56E6D0] ring-2 ring-[#56E6D0] shadow-[0_0_15px_rgba(86,230,208,0.4)] scale-105' : 'bg-[#0b1728] border-[#1f3a5b] hover:border-[#56E6D0]/60'}
                ${isBeingDragged ? 'opacity-30' : ''}
                ${!fitsSomewhere ? 'opacity-40 grayscale cursor-not-allowed' : ''}
              `}
            >
              <div
                className="grid gap-1 pointer-events-none"
                style={{
                  gridTemplateRows: `repeat(${shape.matrix.length}, 14px)`,
                  gridTemplateColumns: `repeat(${shape.matrix[0].length}, 14px)`,
                }}
              >
                {shape.matrix.map((row, r) =>
                  row.map((val, c) => (
                    <div
                      key={`${r}-${c}`}
                      className={`w-3.5 h-3.5 rounded-sm ${val === 1 ? 'shadow-sm' : 'opacity-0'}`}
                      style={{ backgroundColor: val === 1 ? shape.color : 'transparent' }}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Dragged Shape Following Pointer */}
      {dragState && (
        <div
          className="fixed pointer-events-none z-50 transition-transform duration-75"
          style={{
            left: dragState.x,
            top: dragState.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="grid gap-1 p-2 rounded-xl bg-[#091524]/80 backdrop-blur-md border border-[#56E6D0]/60 shadow-[0_0_25px_rgba(86,230,208,0.5)]"
            style={{
              gridTemplateRows: `repeat(${dragState.shape.matrix.length}, 22px)`,
              gridTemplateColumns: `repeat(${dragState.shape.matrix[0].length}, 22px)`,
            }}
          >
            {dragState.shape.matrix.map((row, r) =>
              row.map((val, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`w-5 h-5 rounded-md ${val === 1 ? 'shadow-sm' : 'opacity-0'}`}
                  style={{ backgroundColor: val === 1 ? dragState.shape.color : 'transparent' }}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Action Controls */}
      <div className="w-full flex items-center justify-between gap-2 max-w-md">
        <NeonButton
          variant="ghost"
          size="sm"
          onClick={() => setSelectedShapeId(null)}
          disabled={!selectedShapeId}
        >
          Deselect
        </NeonButton>

        <NeonButton
          variant="cyan"
          size="sm"
          onClick={handleRestart}
          icon={<RotateCcw className="w-4 h-4" />}
        >
          New Game
        </NeonButton>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07111F]/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#102238] border border-[rgba(130,180,220,0.22)] rounded-2xl p-6 text-left space-y-4">
            <h3 className="text-lg font-bold text-[#56E6D0] flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Block Puzzle Rules
            </h3>
            <ul className="text-xs sm:text-sm text-[#91A7BF] space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#56E6D0] shrink-0 mt-0.5" />
                <span>
                  <strong>Placement:</strong> Drag blocks from the tray onto the 10×10 grid, or tap a piece and tap the board.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#56E6D0] shrink-0 mt-0.5" />
                <span>
                  <strong>Clearing Lines:</strong> Fill complete rows or columns to clear them and score points.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#56E6D0] shrink-0 mt-0.5" />
                <span>
                  <strong>Combos:</strong> Clear lines with consecutive placements to build score multiplier streaks.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#56E6D0] shrink-0 mt-0.5" />
                <span>
                  <strong>Game Over:</strong> The game concludes when none of the 3 available shapes in the tray can fit anywhere.
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
        gameTitle="Block Puzzle"
        result={lastResult}
        onPlayAgain={handleRestart}
        onBackToHub={() => navigate('/')}
        onViewProgress={() => navigate('/progress')}
      />
    </div>
  );
};
