import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  RotateCcw,
  Undo2,
  Lightbulb,
  Volume2,
  VolumeX,
  ArrowLeft,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Difficulty, GameResult } from '../types';
import { NeonButton } from '../components/NeonButton';
import { ResultsModal } from '../components/ResultsModal';
import { formatDuration } from '../utils/dates';
import { sound } from '../services/soundService';
import { storage } from '../services/storageService';

interface OneLineLevel {
  id: number;
  name: string;
  difficulty: Difficulty;
  dim: { rows: number; cols: number };
  start: number;
  requiredNodes: number[];
  blockedNodes: number[];
  solution: number[];
}

const ONE_LINE_LEVELS: OneLineLevel[] = [
  // EASY TIER (Levels 1-5)
  {
    id: 1,
    name: 'Straight Circuit',
    difficulty: 'easy',
    dim: { rows: 3, cols: 3 },
    start: 0,
    requiredNodes: [0, 1, 2, 5, 8],
    blockedNodes: [3, 4, 6, 7],
    solution: [0, 1, 2, 5, 8],
  },
  {
    id: 2,
    name: 'The Horseshoe',
    difficulty: 'easy',
    dim: { rows: 3, cols: 3 },
    start: 0,
    requiredNodes: [0, 3, 6, 7, 8, 5, 2],
    blockedNodes: [1, 4],
    solution: [0, 3, 6, 7, 8, 5, 2],
  },
  {
    id: 3,
    name: 'Grid S-Curve',
    difficulty: 'easy',
    dim: { rows: 3, cols: 3 },
    start: 0,
    requiredNodes: [0, 1, 2, 5, 4, 3, 6, 7, 8],
    blockedNodes: [],
    solution: [0, 1, 2, 5, 4, 3, 6, 7, 8],
  },
  {
    id: 4,
    name: 'Perimeter Loop',
    difficulty: 'easy',
    dim: { rows: 3, cols: 4 },
    start: 0,
    requiredNodes: [0, 1, 2, 3, 7, 11, 10, 9, 8, 4],
    blockedNodes: [5, 6],
    solution: [0, 1, 2, 3, 7, 11, 10, 9, 8, 4],
  },
  {
    id: 5,
    name: 'Ribbon Path',
    difficulty: 'easy',
    dim: { rows: 3, cols: 4 },
    start: 0,
    requiredNodes: [0, 4, 8, 9, 5, 1, 2, 6, 10, 11, 7, 3],
    blockedNodes: [],
    solution: [0, 4, 8, 9, 5, 1, 2, 6, 10, 11, 7, 3],
  },

  // MEDIUM TIER (Levels 6-10)
  {
    id: 6,
    name: 'Corner Anchor',
    difficulty: 'normal',
    dim: { rows: 4, cols: 4 },
    start: 0,
    requiredNodes: [0, 1, 5, 4, 8, 12, 13, 9, 10, 14, 15, 11, 7, 6, 2, 3],
    blockedNodes: [],
    solution: [0, 1, 5, 4, 8, 12, 13, 9, 10, 14, 15, 11, 7, 6, 2, 3],
  },
  {
    id: 7,
    name: 'Stepped Pylon',
    difficulty: 'normal',
    dim: { rows: 4, cols: 4 },
    start: 12,
    requiredNodes: [12, 8, 4, 0, 1, 2, 6, 5, 9, 13, 14, 10, 11, 15],
    blockedNodes: [3, 7],
    solution: [12, 8, 4, 0, 1, 2, 6, 5, 9, 13, 14, 10, 11, 15],
  },
  {
    id: 8,
    name: 'Spiral Inward',
    difficulty: 'normal',
    dim: { rows: 4, cols: 4 },
    start: 0,
    requiredNodes: [0, 1, 2, 3, 7, 11, 15, 14, 13, 12, 8, 4, 5, 6, 10, 9],
    blockedNodes: [],
    solution: [0, 1, 2, 3, 7, 11, 15, 14, 13, 12, 8, 4, 5, 6, 10, 9],
  },
  {
    id: 9,
    name: 'Synaptic Wave',
    difficulty: 'normal',
    dim: { rows: 4, cols: 5 },
    start: 0,
    requiredNodes: [0, 1, 2, 3, 4, 9, 8, 7, 6, 5, 10, 11, 12, 13, 14, 19, 18, 17, 16, 15],
    blockedNodes: [],
    solution: [0, 1, 2, 3, 4, 9, 8, 7, 6, 5, 10, 11, 12, 13, 14, 19, 18, 17, 16, 15],
  },
  {
    id: 10,
    name: 'Core Bypass',
    difficulty: 'normal',
    dim: { rows: 4, cols: 5 },
    start: 0,
    requiredNodes: [0, 5, 10, 15, 16, 17, 12, 7, 8, 13, 18, 19, 14, 9, 4, 3, 2, 1],
    blockedNodes: [6, 11],
    solution: [0, 5, 10, 15, 16, 17, 12, 7, 8, 13, 18, 19, 14, 9, 4, 3, 2, 1],
  },

  // HARD TIER (Levels 11-15)
  {
    id: 11,
    name: 'Keyhole Route',
    difficulty: 'hard',
    dim: { rows: 5, cols: 5 },
    start: 2,
    requiredNodes: [
      2, 1, 0, 5, 10, 15, 20, 21, 22, 17, 16, 11, 6, 7, 8, 13, 18, 23, 24, 19, 14, 9, 4, 3,
    ],
    blockedNodes: [12],
    solution: [
      2, 1, 0, 5, 10, 15, 20, 21, 22, 17, 16, 11, 6, 7, 8, 13, 18, 23, 24, 19, 14, 9, 4, 3,
    ],
  },
  {
    id: 12,
    name: 'Double Bypass',
    difficulty: 'hard',
    dim: { rows: 5, cols: 5 },
    start: 0,
    requiredNodes: [
      0, 1, 2, 3, 4, 9, 14, 19, 24, 23, 22, 21, 20, 15, 16, 17, 18, 13, 8, 7, 6, 11,
    ],
    blockedNodes: [5, 10, 12],
    solution: [
      0, 1, 2, 3, 4, 9, 14, 19, 24, 23, 22, 21, 20, 15, 16, 17, 18, 13, 8, 7, 6, 11,
    ],
  },
  {
    id: 13,
    name: 'Fortress Walk',
    difficulty: 'hard',
    dim: { rows: 5, cols: 5 },
    start: 0,
    requiredNodes: [
      0, 5, 10, 15, 20, 21, 22, 23, 24, 19, 14, 9, 4, 3, 2, 1, 6, 11, 16, 17, 18, 13, 8, 7, 12,
    ],
    blockedNodes: [],
    solution: [
      0, 5, 10, 15, 20, 21, 22, 23, 24, 19, 14, 9, 4, 3, 2, 1, 6, 11, 16, 17, 18, 13, 8, 7, 12,
    ],
  },
  {
    id: 14,
    name: 'Quantum Trench',
    difficulty: 'hard',
    dim: { rows: 5, cols: 5 },
    start: 0,
    requiredNodes: [
      0, 1, 6, 11, 10, 15, 16, 21, 20, 22, 17, 12, 7, 2, 3, 8, 13, 18, 23, 24, 19, 14, 9, 4,
    ],
    blockedNodes: [5],
    solution: [
      0, 1, 6, 11, 10, 15, 16, 21, 20, 22, 17, 12, 7, 2, 3, 8, 13, 18, 23, 24, 19, 14, 9, 4,
    ],
  },
  {
    id: 15,
    name: 'Singularity Circuit',
    difficulty: 'hard',
    dim: { rows: 5, cols: 5 },
    start: 12,
    requiredNodes: [
      12, 11, 10, 5, 0, 1, 2, 3, 4, 9, 14, 19, 24, 23, 22, 21, 20, 15, 16, 17, 18, 13, 8, 7, 6,
    ],
    blockedNodes: [],
    solution: [
      12, 11, 10, 5, 0, 1, 2, 3, 4, 9, 14, 19, 24, 23, 22, 21, 20, 15, 16, 17, 18, 13, 8, 7, 6,
    ],
  },
];

interface OneLineProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const OneLine: React.FC<OneLineProps> = ({ soundEnabled, onToggleSound }) => {
  const navigate = useNavigate();
  const [levelIndex, setLevelIndex] = useState<number>(0);
  const currentLevel = ONE_LINE_LEVELS[levelIndex];
  const activeDifficulty = currentLevel.difficulty;

  const [path, setPath] = useState<number[]>([currentLevel.start]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [gameState, setGameState] = useState<'PLAYING' | 'PAUSED' | 'WON'>('PLAYING');
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const [latestResult, setLatestResult] = useState<GameResult | null>(null);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetLevel = useCallback((lvl: OneLineLevel) => {
    setPath([lvl.start]);
    setIsDrawing(false);
    setHintsUsed(0);
    setGameState('PLAYING');
    setShowResultsModal(false);
  }, []);

  useEffect(() => {
    resetLevel(currentLevel);
  }, [levelIndex, currentLevel, resetLevel]);

  // Timer
  useEffect(() => {
    if (gameState === 'PLAYING') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const isAdjacent = (nodeA: number, nodeB: number, cols: number): boolean => {
    const rA = Math.floor(nodeA / cols);
    const cA = nodeA % cols;
    const rB = Math.floor(nodeB / cols);
    const cB = nodeB % cols;

    return Math.abs(rA - rB) + Math.abs(cA - cB) === 1;
  };

  const handleNodeClickOrHover = (nodeIndex: number) => {
    if (gameState !== 'PLAYING') return;
    if (currentLevel.blockedNodes.includes(nodeIndex)) return;

    const currentHead = path[path.length - 1];

    const existingIndex = path.indexOf(nodeIndex);
    if (existingIndex !== -1) {
      if (existingIndex === path.length - 2) {
        sound.playClick();
        setPath((p) => p.slice(0, -1));
      }
      return;
    }

    if (isAdjacent(currentHead, nodeIndex, currentLevel.dim.cols)) {
      sound.playLineConnect();
      const updated = [...path, nodeIndex];
      setPath(updated);

      const allRequiredVisited = currentLevel.requiredNodes.every((n) => updated.includes(n));
      if (allRequiredVisited) {
        sound.playSuccess();
        setGameState('WON');

        const baseScore = currentLevel.id * 140 + 300 - hintsUsed * 25;
        const finalScore = Math.max(50, baseScore);

        const { result } = storage.recordGameResult({
          gameId: 'one-line',
          difficulty: currentLevel.difficulty,
          score: finalScore,
          elapsedSeconds,
          isCompleted: true,
          stats: {
            level: currentLevel.id,
            moves: updated.length,
            hintsUsed,
          },
        });

        setLatestResult(result);
        setShowResultsModal(true);
      }
    } else {
      sound.playMismatch();
    }
  };

  const handleUndo = () => {
    if (path.length <= 1) return;
    sound.playClick();
    setPath((p) => p.slice(0, -1));
  };

  const handleHint = () => {
    if (path.length >= currentLevel.solution.length) return;
    sound.playClick();
    setHintsUsed((h) => h + 1);

    const nextNode = currentLevel.solution[path.length];
    if (nextNode !== undefined) {
      handleNodeClickOrHover(nextNode);
    }
  };

  const handleSelectDifficulty = (diff: Difficulty) => {
    sound.playClick();
    let startIdx = 0;
    if (diff === 'normal') startIdx = 5;
    if (diff === 'hard') startIdx = 10;
    setLevelIndex(startIdx);
  };

  const totalRequired = currentLevel.requiredNodes.length;
  const visitedCount = currentLevel.requiredNodes.filter((n) => path.includes(n)).length;
  const currentBest =
    storage.loadProgress().gameStats['one-line']?.bestScorePerDifficulty[activeDifficulty] || 0;

  // Node position helper for connecting SVG line
  const getNodeCoordinates = (index: number) => {
    const row = Math.floor(index / currentLevel.dim.cols);
    const col = index % currentLevel.dim.cols;
    const stepX = 100 / currentLevel.dim.cols;
    const stepY = 100 / currentLevel.dim.rows;
    return {
      x: col * stepX + stepX / 2,
      y: row * stepY + stepY / 2,
    };
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[#102238]/90 border border-[rgba(130,180,220,0.16)] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              navigate('/');
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-[#91A7BF] hover:text-[#67E8A5] transition-colors p-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Hub</span>
          </button>

          <div className="h-4 w-px bg-[rgba(130,180,220,0.2)]" />

          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#F1F7FF] flex items-center gap-2">
              <span>One Line</span>
              <span className="text-[11px] font-mono text-[#67E8A5] bg-[#67E8A5]/10 px-2 py-0.5 rounded-md border border-[#67E8A5]/30">
                Level {currentLevel.id} / 15
              </span>
            </h1>
          </div>
        </div>

        {/* Tier Selector */}
        <div className="flex items-center gap-1 bg-[#07111F] p-1 rounded-xl border border-[rgba(130,180,220,0.12)]">
          {[
            { id: 'easy', label: 'Easy (L1-5)' },
            { id: 'normal', label: 'Medium (L6-10)' },
            { id: 'hard', label: 'Hard (L11-15)' },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => handleSelectDifficulty(d.id as Difficulty)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                activeDifficulty === d.id
                  ? 'bg-[#142B43] text-[#67E8A5] border border-[#67E8A5]/40 shadow-[0_0_10px_rgba(103,232,165,0.2)]'
                  : 'text-[#91A7BF] hover:text-[#F1F7FF]'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Level Switcher */}
          <div className="flex items-center gap-1 bg-[#07111F] p-1 rounded-xl border border-[rgba(130,180,220,0.12)]">
            <button
              disabled={levelIndex === 0}
              onClick={() => {
                sound.playClick();
                setLevelIndex((l) => Math.max(0, l - 1));
              }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#91A7BF] hover:text-[#F1F7FF] disabled:opacity-20 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-[#F1F7FF] px-2 truncate max-w-[90px]">
              L{currentLevel.id}
            </span>
            <button
              disabled={levelIndex === ONE_LINE_LEVELS.length - 1}
              onClick={() => {
                sound.playClick();
                setLevelIndex((l) => Math.min(ONE_LINE_LEVELS.length - 1, l + 1));
              }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#91A7BF] hover:text-[#F1F7FF] disabled:opacity-20 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleHint}
            title="Hint"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#142B43] border border-[rgba(130,180,220,0.15)] text-[#FFB454] hover:border-[#FFB454]/40 transition-colors cursor-pointer"
          >
            <Lightbulb className="w-4 h-4" />
          </button>

          <button
            onClick={handleUndo}
            disabled={path.length <= 1}
            title="Undo step"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#142B43] border border-[rgba(130,180,220,0.15)] text-[#91A7BF] hover:text-[#F1F7FF] disabled:opacity-30 transition-colors cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              sound.playClick();
              resetLevel(currentLevel);
            }}
            title="Reset path"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#142B43] border border-[rgba(130,180,220,0.15)] text-[#91A7BF] hover:text-[#67E8A5] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute' : 'Unmute'}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#142B43] border border-[rgba(130,180,220,0.15)] text-[#91A7BF] hover:text-[#F1F7FF] transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#67E8A5]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setShowGuide((v) => !v);
            }}
            title="How to play"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#142B43] border border-[rgba(130,180,220,0.15)] text-[#91A7BF] hover:text-[#F1F7FF] transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guide Callout */}
      {showGuide && (
        <div className="mb-6 p-4 rounded-xl bg-[#0B192B] border border-[#67E8A5]/30 text-xs text-[#91A7BF] flex items-start gap-3 animate-in fade-in">
          <Sparkles className="w-5 h-5 text-[#67E8A5] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-[#F1F7FF] block">How to Play One Line:</span>
            <p>1. Drag your finger or mouse continuously through adjacent nodes.</p>
            <p>2. Connect all required nodes without lifting or crossing past nodes.</p>
            <p>3. Use Undo or Hint if you get trapped.</p>
          </div>
        </div>
      )}

      {/* HUD Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#102238] border border-[rgba(130,180,220,0.15)] rounded-xl p-3.5">
          <span className="text-xs text-[#91A7BF] block mb-1">Nodes Visited</span>
          <span className="text-2xl font-bold font-mono text-[#67E8A5] tabular-nums">
            {visitedCount} / {totalRequired}
          </span>
        </div>
        <div className="bg-[#102238] border border-[rgba(130,180,220,0.15)] rounded-xl p-3.5">
          <span className="text-xs text-[#91A7BF] block mb-1">Elapsed Time</span>
          <span className="text-2xl font-bold font-mono text-[#56E6D0] tabular-nums">
            {formatDuration(elapsedSeconds)}
          </span>
        </div>
        <div className="bg-[#102238] border border-[rgba(130,180,220,0.15)] rounded-xl p-3.5">
          <span className="text-xs text-[#91A7BF] block mb-1">Hints Used</span>
          <span className="text-2xl font-bold font-mono text-[#FFB454] tabular-nums">
            {hintsUsed}
          </span>
        </div>
        <div className="bg-[#102238] border border-[rgba(130,180,220,0.15)] rounded-xl p-3.5">
          <span className="text-xs text-[#91A7BF] block mb-1">Personal Best ({activeDifficulty === 'normal' ? 'Medium' : activeDifficulty})</span>
          <span className="text-2xl font-bold font-mono text-[#62B7FF] tabular-nums">
            {currentBest > 0 ? currentBest.toLocaleString() : '—'}
          </span>
        </div>
      </div>

      {/* Grid Canvas Surface with Continuous Laser Wire SVG */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-[#0B192B] border border-[rgba(130,180,220,0.18)] shadow-[0_12px_40px_rgba(0,0,0,0.5)] max-w-md mx-auto mb-6">
        {/* Continuous Line SVG path */}
        <svg className="absolute inset-6 sm:inset-8 w-[calc(100%-3rem)] sm:w-[calc(100%-4rem)] h-[calc(100%-3rem)] sm:h-[calc(100%-4rem)] pointer-events-none z-10">
          {path.length > 1 && (
            <path
              d={path
                .map((idx, i) => {
                  const { x, y } = getNodeCoordinates(idx);
                  return `${i === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                })
                .join(' ')}
              fill="none"
              stroke="#67E8A5"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_10px_rgba(103,232,165,0.8)]"
            />
          )}
        </svg>

        <div
          className="grid gap-3 sm:gap-4 select-none touch-none aspect-square relative z-20"
          style={{
            gridTemplateColumns: `repeat(${currentLevel.dim.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${currentLevel.dim.rows}, minmax(0, 1fr))`,
          }}
          onPointerDown={() => setIsDrawing(true)}
          onPointerUp={() => setIsDrawing(false)}
        >
          {Array.from({ length: currentLevel.dim.rows * currentLevel.dim.cols }, (_, idx) => {
            const isBlocked = currentLevel.blockedNodes.includes(idx);
            const isRequired = currentLevel.requiredNodes.includes(idx);
            const isHead = path[path.length - 1] === idx;
            const pathIndex = path.indexOf(idx);
            const isVisited = pathIndex !== -1;

            return (
              <div
                key={idx}
                onPointerEnter={() => {
                  if (isDrawing) handleNodeClickOrHover(idx);
                }}
                onClick={() => handleNodeClickOrHover(idx)}
                className={`relative rounded-xl flex items-center justify-center transition-all ${
                  isBlocked
                    ? 'opacity-20 cursor-not-allowed bg-transparent'
                    : isHead
                    ? 'bg-[#67E8A5] border-2 border-[#67E8A5] shadow-[0_0_20px_rgba(103,232,165,0.8)] scale-110 z-20 cursor-pointer'
                    : isVisited
                    ? 'bg-[#142B43] border border-[#67E8A5]/60 text-[#67E8A5] z-10 cursor-pointer'
                    : isRequired
                    ? 'bg-[#102238] border border-[rgba(130,180,220,0.25)] hover:border-[#67E8A5]/50 hover:bg-[#142B43] cursor-pointer'
                    : 'bg-[#07111F] opacity-40'
                }`}
              >
                {isVisited ? (
                  <span
                    className={`text-xs font-mono font-bold ${
                      isHead ? 'text-[#07111F]' : 'text-[#67E8A5]'
                    }`}
                  >
                    {pathIndex + 1}
                  </span>
                ) : isRequired ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-[rgba(130,180,220,0.4)]" />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Completion Progress Bar */}
        <div className="mt-6 pt-4 border-t border-[rgba(130,180,220,0.12)]">
          <div className="flex items-center justify-between text-xs text-[#91A7BF] mb-2">
            <span>Circuit Continuity</span>
            <span className="font-mono text-[#67E8A5]">
              {Math.round((visitedCount / totalRequired) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#07111F] overflow-hidden border border-[rgba(130,180,220,0.1)]">
            <motion.div
              className="h-full bg-gradient-to-r from-[#56E6D0] to-[#67E8A5]"
              initial={{ width: 0 }}
              animate={{ width: `${(visitedCount / totalRequired) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Results modal */}
      <ResultsModal
        isOpen={showResultsModal}
        gameTitle="One Line"
        result={latestResult}
        onPlayAgain={() => {
          if (levelIndex < ONE_LINE_LEVELS.length - 1) {
            setLevelIndex((l) => l + 1);
          } else {
            resetLevel(currentLevel);
          }
        }}
        onBackToHub={() => navigate('/')}
        onViewProgress={() => navigate('/progress')}
      />
    </div>
  );
};
