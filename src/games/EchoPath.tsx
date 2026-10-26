import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Play,
  RotateCcw,
  Pause,
  Volume2,
  VolumeX,
  ArrowLeft,
  HelpCircle,
  Repeat,
  Sparkles,
  Heart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Difficulty, GameResult } from '../types';
import { NeonButton } from '../components/NeonButton';
import { ResultsModal } from '../components/ResultsModal';
import { formatDuration } from '../utils/dates';
import { sound } from '../services/soundService';
import { storage } from '../services/storageService';

interface EchoPathProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const EchoPath: React.FC<EchoPathProps> = ({ soundEnabled, onToggleSound }) => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [relaxedMode, setRelaxedMode] = useState<boolean>(false);
  const [level, setLevel] = useState<number>(1);
  const [gridDim, setGridDim] = useState<number>(4); // 3x3 (Easy), 4x4 (Medium), 5x5 (Hard)
  const [path, setPath] = useState<number[]>([]);
  const [activeSignalNode, setActiveSignalNode] = useState<number | null>(null);
  const [playerInputPath, setPlayerInputPath] = useState<number[]>([]);
  const [replaysLeft, setReplaysLeft] = useState<number>(2);

  // States: 'IDLE' | 'WATCHING' | 'INPUT' | 'PAUSED' | 'SUCCESS_STEP' | 'GAME_OVER'
  const [gameState, setGameState] = useState<
    'IDLE' | 'WATCHING' | 'INPUT' | 'PAUSED' | 'SUCCESS_STEP' | 'GAME_OVER'
  >('IDLE');
  const [statusMessage, setStatusMessage] = useState<string>('Prepare to observe the synaptic signal');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [longestSequence, setLongestSequence] = useState<number>(0);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [latestResult, setLatestResult] = useState<GameResult | null>(null);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getDimension = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 3; // 3x3
      case 'hard': return 5; // 5x5
      case 'normal':
      default: return 4; // 4x4 (Medium)
    }
  };

  const getNeighbors = (node: number, dim: number): number[] => {
    const row = Math.floor(node / dim);
    const col = node % dim;
    const neighbors: number[] = [];

    // Orthogonal and diagonal connectivity
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < dim && nc >= 0 && nc < dim) {
          neighbors.push(nr * dim + nc);
        }
      }
    }
    return neighbors;
  };

  const generateValidPath = useCallback((dim: number, length: number): number[] => {
    const totalNodes = dim * dim;
    let attempts = 0;
    while (attempts < 50) {
      attempts++;
      const startNode = Math.floor(Math.random() * totalNodes);
      const generated: number[] = [startNode];
      const visited = new Set<number>([startNode]);

      let curr = startNode;
      for (let i = 1; i < length; i++) {
        const candidates = getNeighbors(curr, dim).filter((n) => !visited.has(n));
        if (candidates.length === 0) break;
        const next = candidates[Math.floor(Math.random() * candidates.length)];
        generated.push(next);
        visited.add(next);
        curr = next;
      }

      if (generated.length === length) {
        return generated;
      }
    }

    // Fallback safe serpentine
    return Array.from({ length }, (_, i) => i);
  }, []);

  const clearAllTimers = () => {
    if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current);
  };

  const playSignalSequence = useCallback(
    (signalPath: number[]) => {
      clearAllTimers();
      setGameState('WATCHING');
      setStatusMessage('Observe the synaptic signal...');
      setActiveSignalNode(null);
      setPlayerInputPath([]);

      let step = 0;
      // Pro speed scaling: Easy (comfortable), Medium (crisp), Hard (fast & intense)
      const speed = difficulty === 'easy' ? 560 : difficulty === 'hard' ? 320 : 420;

      const tick = () => {
        if (step < signalPath.length) {
          const node = signalPath[step];
          setActiveSignalNode(node);
          sound.playNodePulse(step);

          playbackTimeoutRef.current = setTimeout(() => {
            setActiveSignalNode(null);
            step++;
            playbackTimeoutRef.current = setTimeout(tick, speed * 0.35);
          }, speed * 0.65);
        } else {
          playbackTimeoutRef.current = setTimeout(() => {
            setGameState('INPUT');
            setStatusMessage('Your turn: Recreate the neural sequence');
          }, 350);
        }
      };

      playbackTimeoutRef.current = setTimeout(tick, 500);
    },
    [difficulty]
  );

  const startLevel = useCallback(
    (lvl: number, diff: Difficulty = difficulty) => {
      const dim = getDimension(diff);
      setGridDim(dim);
      // Easy: starts at 3 up to 5; Medium: starts at 4 up to 7; Hard: starts at 5 up to 9
      const baseLength = diff === 'easy' ? 3 : diff === 'hard' ? 5 : 4;
      const maxLength = diff === 'easy' ? 5 : diff === 'hard' ? 9 : 7;
      const pathLength = Math.min(maxLength, baseLength + Math.floor((lvl - 1) * 0.6));

      const newPath = generateValidPath(dim, pathLength);
      setPath(newPath);
      setLongestSequence((prev) => Math.max(prev, newPath.length));
      playSignalSequence(newPath);
    },
    [difficulty, generateValidPath, playSignalSequence]
  );

  const startNewGame = useCallback(
    (diff: Difficulty = difficulty) => {
      clearAllTimers();
      setLevel(1);
      setScore(0);
      setElapsedSeconds(0);
      setLongestSequence(0);
      setReplaysLeft(diff === 'easy' ? 3 : diff === 'hard' ? 1 : 2);
      setShowResultsModal(false);
      startLevel(1, diff);
    },
    [difficulty, startLevel]
  );

  useEffect(() => {
    startNewGame(difficulty);
    return () => {
      clearAllTimers();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficulty]);

  useEffect(() => {
    if (gameState === 'WATCHING' || gameState === 'INPUT') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const handleNodeClick = (nodeIndex: number) => {
    if (gameState !== 'INPUT') return;

    const expectedIndex = playerInputPath.length;
    const expectedNode = path[expectedIndex];

    if (nodeIndex === expectedNode) {
      sound.playNodePulse(expectedIndex);
      const updatedInput = [...playerInputPath, nodeIndex];
      setPlayerInputPath(updatedInput);

      if (updatedInput.length === path.length) {
        sound.playSuccess();
        setGameState('SUCCESS_STEP');
        setStatusMessage('Synapse locked! Preparing next tier...');

        const diffMultiplier = difficulty === 'easy' ? 1 : difficulty === 'hard' ? 2 : 1.5;
        const levelPoints = Math.round((level * 120 + path.length * 30) * diffMultiplier);
        setScore((s) => s + levelPoints);

        const nextLevel = level + 1;
        setLevel(nextLevel);

        playbackTimeoutRef.current = setTimeout(() => {
          startLevel(nextLevel, difficulty);
        }, 1100);
      }
    } else {
      sound.playMismatch();

      if (relaxedMode) {
        setStatusMessage('Sequence interrupted. Tap from node 1 again.');
        setPlayerInputPath([]);
      } else {
        setGameState('GAME_OVER');
        setStatusMessage('Neural path broken. Session complete.');

        const diffBonus = difficulty === 'easy' ? 50 : difficulty === 'hard' ? 200 : 100;
        const finalScore = Math.max(50, score + (level - 1) * 80 + diffBonus);

        const { result } = storage.recordGameResult({
          gameId: 'echo-path',
          difficulty,
          score: finalScore,
          elapsedSeconds,
          isCompleted: level >= 2,
          stats: {
            level,
            maxSequence: longestSequence,
            accuracy: Math.round(((level - 1) / Math.max(1, level)) * 100),
          },
        });

        setLatestResult(result);
        setShowResultsModal(true);
      }
    }
  };

  const handleReplay = () => {
    if (gameState !== 'INPUT' || replaysLeft <= 0) return;
    sound.playClick();
    setReplaysLeft((r) => r - 1);
    playSignalSequence(path);
  };

  const togglePause = () => {
    if (gameState === 'WATCHING' || gameState === 'INPUT') {
      sound.playClick();
      clearAllTimers();
      setGameState('PAUSED');
      setStatusMessage('Session Paused');
    } else if (gameState === 'PAUSED') {
      sound.playClick();
      playSignalSequence(path);
    }
  };

  const currentBest =
    storage.loadProgress().gameStats['echo-path']?.bestScorePerDifficulty[difficulty] || 0;

  // Node position helper for connecting lines in SVG
  const getNodeCoordinates = (index: number) => {
    const row = Math.floor(index / gridDim);
    const col = index % gridDim;
    // Map to percentage 0-100%
    const step = 100 / gridDim;
    const x = col * step + step / 2;
    const y = row * step + step / 2;
    return { x, y };
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[#102238]/90 border border-[rgba(130,180,220,0.16)] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              navigate('/');
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-[#91A7BF] hover:text-[#56E6D0] transition-colors p-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Hub</span>
          </button>

          <div className="h-4 w-px bg-[rgba(130,180,220,0.2)]" />

          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#F1F7FF] flex items-center gap-2">
              <span>Echo Path</span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#56E6D0] bg-[#56E6D0]/10 px-2 py-0.5 rounded-md border border-[#56E6D0]/30">
                {difficulty === 'normal' ? 'Medium' : difficulty}
              </span>
            </h1>
          </div>
        </div>

        {/* Difficulty Selector: Easy / Medium / Hard */}
        <div className="flex items-center gap-1 bg-[#07111F] p-1 rounded-xl border border-[rgba(130,180,220,0.12)]">
          {[
            { id: 'easy', label: 'Easy (3×3)' },
            { id: 'normal', label: 'Medium (4×4)' },
            { id: 'hard', label: 'Hard (5×5)' },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => {
                sound.playClick();
                setDifficulty(d.id as Difficulty);
                startNewGame(d.id as Difficulty);
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                difficulty === d.id
                  ? 'bg-[#142B43] text-[#56E6D0] border border-[#56E6D0]/40 shadow-[0_0_10px_rgba(86,230,208,0.2)]'
                  : 'text-[#91A7BF] hover:text-[#F1F7FF]'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setRelaxedMode((r) => !r);
            }}
            title={relaxedMode ? 'Relaxed Mode Active (No Game Over)' : 'Enable Relaxed Mode'}
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-medium border transition-colors cursor-pointer ${
              relaxedMode
                ? 'bg-[#67E8A5]/15 border-[#67E8A5]/40 text-[#67E8A5]'
                : 'bg-[#142B43] border-[rgba(130,180,220,0.15)] text-[#91A7BF] hover:text-[#F1F7FF]'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Relaxed</span>
          </button>

          <button
            onClick={togglePause}
            disabled={gameState === 'GAME_OVER'}
            title={gameState === 'PAUSED' ? 'Resume' : 'Pause'}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#142B43] border border-[rgba(130,180,220,0.15)] text-[#91A7BF] hover:text-[#F1F7FF] transition-colors disabled:opacity-30 cursor-pointer"
          >
            {gameState === 'PAUSED' ? <Play className="w-4 h-4 text-[#67E8A5]" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              startNewGame();
            }}
            title="Restart round"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#142B43] border border-[rgba(130,180,220,0.15)] text-[#91A7BF] hover:text-[#F1F7FF] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute' : 'Unmute'}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#142B43] border border-[rgba(130,180,220,0.15)] text-[#91A7BF] hover:text-[#F1F7FF] transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#56E6D0]" /> : <VolumeX className="w-4 h-4" />}
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
        <div className="mb-6 p-4 rounded-xl bg-[#0B192B] border border-[#56E6D0]/30 text-xs text-[#91A7BF] flex items-start gap-3 animate-in fade-in">
          <Sparkles className="w-5 h-5 text-[#56E6D0] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-[#F1F7FF] block">How to Play Echo Path:</span>
            <p>1. Observe the cyan synaptic signal as it links connected nodes in sequence.</p>
            <p>2. Tap the identical nodes in order once input unlocks.</p>
            <p>3. Use Replay if you need another glimpse of the neural sequence.</p>
          </div>
        </div>
      )}

      {/* HUD Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#102238] border border-[rgba(130,180,220,0.15)] rounded-xl p-3.5">
          <span className="text-xs text-[#91A7BF] block mb-1">Tier / Level</span>
          <span className="text-2xl font-bold font-mono text-[#56E6D0] tabular-nums">
            Level {level}
          </span>
        </div>
        <div className="bg-[#102238] border border-[rgba(130,180,220,0.15)] rounded-xl p-3.5">
          <span className="text-xs text-[#91A7BF] block mb-1">Path Target</span>
          <span className="text-2xl font-bold font-mono text-[#62B7FF] tabular-nums">
            {path.length} Nodes
          </span>
        </div>
        <div className="bg-[#102238] border border-[rgba(130,180,220,0.15)] rounded-xl p-3.5">
          <span className="text-xs text-[#91A7BF] block mb-1">Elapsed Time</span>
          <span className="text-2xl font-bold font-mono text-[#F1F7FF] tabular-nums">
            {formatDuration(elapsedSeconds)}
          </span>
        </div>
        <div className="bg-[#102238] border border-[rgba(130,180,220,0.15)] rounded-xl p-3.5">
          <span className="text-xs text-[#91A7BF] block mb-1">Personal Best ({difficulty === 'normal' ? 'Medium' : difficulty})</span>
          <span className="text-2xl font-bold font-mono text-[#FFB454] tabular-nums">
            {currentBest > 0 ? currentBest.toLocaleString() : '—'}
          </span>
        </div>
      </div>

      {/* State / Turn Announcer */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0B192B] border border-[rgba(130,180,220,0.14)]">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full ${
              gameState === 'INPUT'
                ? 'bg-[#67E8A5] shadow-[0_0_8px_rgba(103,232,165,0.6)]'
                : gameState === 'WATCHING'
                ? 'bg-[#56E6D0] shadow-[0_0_8px_rgba(86,230,208,0.6)] animate-pulse'
                : 'bg-[#91A7BF]'
            }`}
          />
          <span className="text-sm font-medium text-[#F1F7FF]">{statusMessage}</span>
        </div>

        {/* Replay Preview Button */}
        <button
          onClick={handleReplay}
          disabled={gameState !== 'INPUT' || replaysLeft <= 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#142B43] border border-[rgba(130,180,220,0.15)] text-[#F1F7FF] hover:border-[#56E6D0]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <Repeat className="w-3.5 h-3.5 text-[#56E6D0]" />
          <span>Replay Signal ({replaysLeft})</span>
        </button>
      </div>

      {/* Interactive Node Matrix Surface with Laser Path Connection */}
      <div
        ref={containerRef}
        className="relative p-6 sm:p-8 rounded-2xl bg-[#0B192B] border border-[rgba(130,180,220,0.18)] shadow-[0_12px_40px_rgba(0,0,0,0.5)] max-w-lg mx-auto"
      >
        {/* Paused Overlay */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 z-30 bg-[#07111F]/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <Pause className="w-12 h-12 text-[#56E6D0] mb-3" />
            <h3 className="text-xl font-bold text-[#F1F7FF] mb-2">Signal Paused</h3>
            <p className="text-sm text-[#91A7BF] mb-5">Nodes are shielded. Resume when ready to continue.</p>
            <NeonButton variant="cyan" size="lg" icon={<Play className="w-4 h-4" />} onClick={togglePause}>
              Resume Session
            </NeonButton>
          </div>
        )}

        {/* Connected laser path SVG overlay */}
        <svg className="absolute inset-6 sm:inset-8 w-[calc(100%-3rem)] sm:w-[calc(100%-4rem)] h-[calc(100%-3rem)] sm:h-[calc(100%-4rem)] pointer-events-none z-10">
          {/* Signal path line during playback */}
          {gameState === 'WATCHING' && activeSignalNode !== null && (
            <path
              d={path
                .slice(0, path.indexOf(activeSignalNode) + 1)
                .map((idx, i) => {
                  const { x, y } = getNodeCoordinates(idx);
                  return `${i === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                })
                .join(' ')}
              fill="none"
              stroke="#56E6D0"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_8px_rgba(86,230,208,0.8)]"
            />
          )}

          {/* Player connected line during input */}
          {playerInputPath.length > 1 && (
            <path
              d={playerInputPath
                .map((idx, i) => {
                  const { x, y } = getNodeCoordinates(idx);
                  return `${i === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                })
                .join(' ')}
              fill="none"
              stroke="#67E8A5"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_8px_rgba(103,232,165,0.7)]"
            />
          )}
        </svg>

        <div
          className="grid gap-3 sm:gap-4 select-none relative z-20"
          style={{ gridTemplateColumns: `repeat(${gridDim}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: gridDim * gridDim }, (_, idx) => {
            const isSignalActive = activeSignalNode === idx;
            const inputOrder = playerInputPath.indexOf(idx);
            const isPlayerClicked = inputOrder !== -1;
            const isClickable = gameState === 'INPUT';

            return (
              <motion.button
                key={idx}
                whileTap={isClickable ? { scale: 0.92 } : undefined}
                onClick={() => handleNodeClick(idx)}
                disabled={!isClickable}
                aria-label={`Node ${idx + 1}`}
                className={`relative aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center border transition-all duration-200 ${
                  isSignalActive
                    ? 'bg-[#56E6D0] border-[#56E6D0] text-[#07111F] shadow-[0_0_24px_rgba(86,230,208,0.9)] scale-105 z-20'
                    : isPlayerClicked
                    ? 'bg-[#142B43] border-2 border-[#67E8A5] text-[#67E8A5] shadow-[0_0_14px_rgba(103,232,165,0.5)] z-20'
                    : 'bg-[#102238] border-[rgba(130,180,220,0.18)] hover:bg-[#142B43] hover:border-[#56E6D0]/40 text-[#91A7BF]'
                } ${isClickable ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
              >
                {/* Node order badge if clicked */}
                {isPlayerClicked && (
                  <span className="text-xs sm:text-sm font-mono font-bold">
                    {inputOrder + 1}
                  </span>
                )}

                {/* Subtle center dot if untouched */}
                {!isPlayerClicked && !isSignalActive && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[rgba(130,180,220,0.3)] transition-transform group-hover:scale-125" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Input Progress Dots */}
        <div className="mt-6 flex items-center justify-center gap-1.5 relative z-20">
          {path.map((_, idx) => (
            <div
              key={idx}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                idx < playerInputPath.length
                  ? 'bg-[#67E8A5] scale-110 shadow-[0_0_6px_rgba(103,232,165,0.6)]'
                  : idx === playerInputPath.length && gameState === 'INPUT'
                  ? 'bg-[#56E6D0] scale-125 animate-pulse'
                  : 'bg-[#142B43] border border-[rgba(130,180,220,0.2)]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Results celebration modal */}
      <ResultsModal
        isOpen={showResultsModal}
        gameTitle="Echo Path"
        result={latestResult}
        onPlayAgain={() => startNewGame()}
        onBackToHub={() => navigate('/')}
        onViewProgress={() => navigate('/progress')}
      />
    </div>
  );
};
