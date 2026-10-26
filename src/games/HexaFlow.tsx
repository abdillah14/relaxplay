import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  Undo2,
  Lightbulb,
  Zap,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Trophy,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Difficulty, GameResult } from '../types';
import { ResultsModal } from '../components/ResultsModal';
import { NeonButton } from '../components/NeonButton';
import { sound } from '../services/soundService';
import { storage } from '../services/storageService';
import {
  HexTile,
  HexLevel,
  HEXA_LEVELS,
  getActiveConduits,
  rotateTileClockwise,
  rotateTileCounterClockwise,
  computeEnergyFlow,
  scrambleLevel,
  calculateHexaScore,
  DIRECTION_ANGLES,
} from './hexaFlowLogic';

interface HexaFlowProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const HexaFlow: React.FC<HexaFlowProps> = ({
  soundEnabled,
  onToggleSound,
}) => {
  const navigate = useNavigate();

  // Current Level & Difficulty
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const currentLevelDef = HEXA_LEVELS[currentLevelIndex] || HEXA_LEVELS[0];

  // Board state
  const [tiles, setTiles] = useState<HexTile[]>([]);
  const [isLevelSolved, setIsLevelSolved] = useState<boolean>(false);
  const [poweredSinkCount, setPoweredSinkCount] = useState<number>(0);
  const [totalSinkCount, setTotalSinkCount] = useState<number>(1);

  // Telemetry
  const [moves, setMoves] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);

  // Undo history stack
  const [history, setHistory] = useState<HexTile[][]>([]);

  // UI Modals
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [latestResult, setLatestResult] = useState<GameResult | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load and initialize level
  const initLevel = useCallback((levelIdx: number) => {
    const levelDef = HEXA_LEVELS[levelIdx];
    if (!levelDef) return;

    const scrambled = scrambleLevel(levelDef, Date.now() % 100000);
    setTiles(scrambled.tiles);
    setIsLevelSolved(false);
    setMoves(0);
    setElapsedSeconds(0);
    setHintsUsed(0);
    setHistory([]);
    setShowResultsModal(false);

    const { poweredTiles, isSolved, poweredSinkCount: pCount, totalSinkCount: tCount } =
      computeEnergyFlow(scrambled.tiles);
    setTiles(poweredTiles);
    setIsLevelSolved(isSolved);
    setPoweredSinkCount(pCount);
    setTotalSinkCount(tCount);
  }, []);

  useEffect(() => {
    initLevel(currentLevelIndex);
  }, [currentLevelIndex, initLevel]);

  // Level timer
  useEffect(() => {
    if (isLevelSolved || showResultsModal) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLevelSolved, showResultsModal]);

  // Handle Tile Rotation
  const handleTileClick = (tileId: string) => {
    if (isLevelSolved) return;

    const targetTile = tiles.find((t) => t.id === tileId);
    if (!targetTile || targetTile.isFixed) return;

    sound.playHexRotate();

    // Push previous state to undo history
    setHistory((prev) => [...prev.slice(-10), tiles.map((t) => ({ ...t }))]);

    const updated = tiles.map((t) =>
      t.id === tileId ? rotateTileClockwise(t) : t
    );

    const { poweredTiles, isSolved, poweredSinkCount: newPoweredSinks, totalSinkCount: totalSinks } =
      computeEnergyFlow(updated);

    if (newPoweredSinks > poweredSinkCount && !isSolved) {
      sound.playHexConnect();
    }

    setTiles(poweredTiles);
    setMoves((prev) => prev + 1);
    setPoweredSinkCount(newPoweredSinks);
    setTotalSinkCount(totalSinks);

    // Win condition check
    if (isSolved && !isLevelSolved) {
      setIsLevelSolved(true);
      sound.playSuccess();

      const levelScore = calculateHexaScore(
        currentLevelDef.parMoves,
        moves + 1,
        elapsedSeconds,
        currentLevelDef.difficulty
      );
      setScore(levelScore);

      // Record result to storage
      const recorded = storage.recordGameResult({
        gameId: 'hexa-flow',
        difficulty: currentLevelDef.difficulty,
        score: levelScore,
        elapsedSeconds,
        isCompleted: true,
        stats: {
          level: currentLevelDef.id,
          moves: moves + 1,
          rotations: moves + 1,
          hintsUsed,
        },
      });

      setLatestResult(recorded.result);
      setTimeout(() => {
        setShowResultsModal(true);
      }, 900);
    }
  };

  // Undo last rotation
  const handleUndo = () => {
    if (history.length === 0 || isLevelSolved) return;
    sound.playClick();
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    const { poweredTiles, isSolved, poweredSinkCount: pCount, totalSinkCount: tCount } =
      computeEnergyFlow(previous);

    setTiles(poweredTiles);
    setIsLevelSolved(isSolved);
    setPoweredSinkCount(pCount);
    setTotalSinkCount(tCount);
  };

  // Strategic Hint: Rotate one misplaced tile closer to its solved orientation
  const handleHint = () => {
    if (isLevelSolved) return;
    sound.playClick();

    const misplaced = tiles.find(
      (t) => !t.isFixed && (t.currentRotation % 6) !== (t.solvedRotation % 6)
    );

    if (!misplaced) return;

    setHintsUsed((prev) => prev + 1);
    setHistory((prev) => [...prev.slice(-10), tiles.map((t) => ({ ...t }))]);

    const updated = tiles.map((t) =>
      t.id === misplaced.id ? rotateTileClockwise(t) : t
    );

    const { poweredTiles, isSolved, poweredSinkCount: pCount, totalSinkCount: tCount } =
      computeEnergyFlow(updated);

    setTiles(poweredTiles);
    setMoves((prev) => prev + 1);
    setPoweredSinkCount(pCount);
    setTotalSinkCount(tCount);

    if (isSolved) {
      setIsLevelSolved(true);
      sound.playSuccess();
      const levelScore = calculateHexaScore(
        currentLevelDef.parMoves,
        moves + 1,
        elapsedSeconds,
        currentLevelDef.difficulty
      );
      setScore(levelScore);

      const recorded = storage.recordGameResult({
        gameId: 'hexa-flow',
        difficulty: currentLevelDef.difficulty,
        score: levelScore,
        elapsedSeconds,
        isCompleted: true,
        stats: {
          level: currentLevelDef.id,
          moves: moves + 1,
          rotations: moves + 1,
          hintsUsed: hintsUsed + 1,
        },
      });

      setLatestResult(recorded.result);
      setTimeout(() => {
        setShowResultsModal(true);
      }, 800);
    }
  };

  // Grid SVG Dimensions calculation
  const hexRadius = 40;
  const innerEdgeDist = (hexRadius * Math.sqrt(3)) / 2; // ~34.64px

  const { viewBox, tileCenters } = useMemo(() => {
    if (tiles.length === 0) {
      return { viewBox: '-100 -100 200 200', tileCenters: new Map() };
    }

    const centers = new Map<string, { x: number; y: number }>();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    tiles.forEach((t) => {
      // Axial to Cartesian 2D coords
      const x = 1.5 * hexRadius * t.q;
      const y = Math.sqrt(3) * hexRadius * (t.r + t.q / 2);
      centers.set(t.id, { x, y });

      minX = Math.min(minX, x - hexRadius);
      maxX = Math.max(maxX, x + hexRadius);
      minY = Math.min(minY, y - hexRadius);
      maxY = Math.max(maxY, y + hexRadius);
    });

    const padding = 36;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const vb = `${minX - padding} ${minY - padding} ${width} ${height}`;

    return { viewBox: vb, tileCenters: centers };
  }, [tiles]);

  // Generate hexagon points string
  const getHexPolygonPoints = (cx: number, cy: number, r: number) => {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angleDeg = 60 * i;
      const rad = (angleDeg * Math.PI) / 180;
      const px = cx + r * Math.cos(rad);
      const py = cy + r * Math.sin(rad);
      points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
    }
    return points.join(' ');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 md:py-6 space-y-6">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            sound.playClick();
            navigate('/');
          }}
          className="flex items-center gap-1.5 text-xs font-medium text-[#91A7BF] hover:text-[#56E6D0] transition-colors p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Hub</span>
        </button>

        {/* Level Navigation Picker */}
        <div className="flex items-center gap-1.5 bg-[#102238] rounded-xl p-1 border border-[rgba(130,180,220,0.16)]">
          <button
            onClick={() => {
              if (currentLevelIndex > 0) {
                sound.playClick();
                setCurrentLevelIndex((prev) => prev - 1);
              }
            }}
            disabled={currentLevelIndex === 0}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#91A7BF] hover:text-[#56E6D0] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-semibold px-2 text-[#F1F7FF] tabular-nums">
            Level {currentLevelDef.id} / {HEXA_LEVELS.length}
          </span>

          <button
            onClick={() => {
              if (currentLevelIndex < HEXA_LEVELS.length - 1) {
                sound.playClick();
                setCurrentLevelIndex((prev) => prev + 1);
              }
            }}
            disabled={currentLevelIndex === HEXA_LEVELS.length - 1}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#91A7BF] hover:text-[#56E6D0] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSound}
            aria-label="Toggle sound"
            className="w-8 h-8 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.16)] flex items-center justify-center text-[#91A7BF] hover:text-[#56E6D0] transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowGuide(true)}
            aria-label="How to play"
            className="w-8 h-8 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.16)] flex items-center justify-center text-[#91A7BF] hover:text-[#56E6D0] transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Level Header Status Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#102238] border border-[rgba(130,180,220,0.18)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#56E6D0] shadow-[0_0_8px_#56E6D0]" />
            <h1 className="text-xl font-extrabold tracking-tight text-[#F1F7FF] flex items-center gap-2">
              <span>Hexa Flow</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-[#56E6D0]/20 text-[#56E6D0] border border-[#56E6D0]/40 font-mono">
                {currentLevelDef.tierLabel}
              </span>
            </h1>
          </div>
          <p className="text-xs text-[#91A7BF]">
            {currentLevelDef.description}
          </p>
        </div>

        {/* HUD Metrics */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-[#0B192B] border border-[rgba(130,180,220,0.12)]">
            <span className="text-[#91A7BF] block text-[10px]">ROTATIONS</span>
            <span className="text-sm font-bold text-[#FFB454] tabular-nums">
              {moves}{' '}
              <span className="text-[#91A7BF] text-[10px] font-normal">
                (Par: {currentLevelDef.parMoves})
              </span>
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-[#0B192B] border border-[rgba(130,180,220,0.12)]">
            <span className="text-[#91A7BF] block text-[10px]">POWER TERMINALS</span>
            <span
              className={`text-sm font-bold tabular-nums ${
                poweredSinkCount === totalSinkCount ? 'text-[#67E8A5]' : 'text-[#56E6D0]'
              }`}
            >
              {poweredSinkCount} / {totalSinkCount}
            </span>
          </div>
        </div>
      </div>

      {/* Hex Circuit Stage */}
      <div className="relative w-full rounded-3xl bg-[#0B192B] border border-[rgba(130,180,220,0.18)] p-4 sm:p-8 flex items-center justify-center min-h-[380px] sm:min-h-[460px] shadow-[inset_0_0_40px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* Subtle grid background glow */}
        <div className="absolute inset-0 bg-radial from-[#56E6D0]/5 via-transparent to-transparent pointer-events-none" />

        <svg
          viewBox={viewBox}
          className="w-full max-w-2xl max-h-[420px] select-none"
        >
          <defs>
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur1" />
              <feMerge>
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Render Hex Tiles */}
          {tiles.map((tile) => {
            const center = tileCenters.get(tile.id);
            if (!center) return null;
            const { x: cx, y: cy } = center;
            const activeConduits = getActiveConduits(tile);

            return (
              <g
                key={tile.id}
                onClick={() => handleTileClick(tile.id)}
                className={tile.isFixed ? 'cursor-default' : 'cursor-pointer group'}
              >
                {/* Hexagon Body */}
                <polygon
                  points={getHexPolygonPoints(cx, cy, hexRadius - 2)}
                  fill="#102238"
                  stroke={
                    tile.isPowered
                      ? '#56E6D0'
                      : 'rgba(130, 180, 220, 0.22)'
                  }
                  strokeWidth={tile.isPowered ? '2.5' : '1.5'}
                  className="transition-colors duration-200 group-hover:fill-[#142B43]"
                  style={{
                    filter: tile.isPowered ? 'drop-shadow(0 0 8px rgba(86, 230, 208, 0.3))' : undefined,
                  }}
                />

                {/* Conduits radiating from center to edge midpoints */}
                {activeConduits.map((dir, i) => {
                  const angleDeg = DIRECTION_ANGLES[dir];
                  const rad = (angleDeg * Math.PI) / 180;
                  const ex = cx + innerEdgeDist * Math.cos(rad);
                  const ey = cy + innerEdgeDist * Math.sin(rad);

                  return (
                    <g key={i}>
                      {/* Conduit Line Background */}
                      <line
                        x1={cx}
                        y1={cy}
                        x2={ex}
                        y2={ey}
                        stroke={tile.isPowered ? '#56E6D0' : 'rgba(130, 180, 220, 0.25)'}
                        strokeWidth={tile.isPowered ? '5' : '3.5'}
                        strokeLinecap="round"
                        filter={tile.isPowered ? 'url(#neonGlow)' : undefined}
                      />
                      {/* Active Energy Core line */}
                      {tile.isPowered && (
                        <line
                          x1={cx}
                          y1={cy}
                          x2={ex}
                          y2={ey}
                          stroke="#FFFFFF"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Central Node Visuals */}
                {tile.type === 'source' && (
                  <g>
                    <circle
                      cx={cx}
                      cy={cy}
                      r="14"
                      fill="#FFB454"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      filter="url(#neonGlow)"
                    />
                    <circle cx={cx} cy={cy} r="6" fill="#07111F" />
                    <text
                      x={cx}
                      y={cy + 3}
                      textAnchor="middle"
                      fill="#FFB454"
                      fontSize="8"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      PWR
                    </text>
                  </g>
                )}

                {tile.type === 'sink' && (
                  <g>
                    <polygon
                      points={`${cx},${cy - 12} ${cx + 12},${cy} ${cx},${cy + 12} ${cx - 12},${cy}`}
                      fill={tile.isPowered ? '#67E8A5' : '#142B43'}
                      stroke={tile.isPowered ? '#FFFFFF' : '#FFB454'}
                      strokeWidth="2"
                      filter={tile.isPowered ? 'url(#neonGlow)' : undefined}
                    />
                    <text
                      x={cx}
                      y={cy + 3}
                      textAnchor="middle"
                      fill={tile.isPowered ? '#07111F' : '#FFB454'}
                      fontSize="8"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {tile.label || 'SNK'}
                    </text>
                  </g>
                )}

                {tile.type === 'conduit' && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="4"
                    fill={tile.isPowered ? '#56E6D0' : '#102238'}
                    stroke={tile.isPowered ? '#FFFFFF' : 'rgba(130, 180, 220, 0.4)'}
                    strokeWidth="1.5"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Win Overlay Notification */}
        <AnimatePresence>
          {isLevelSolved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 bg-[#07111F]/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#56E6D0]/20 border border-[#56E6D0] flex items-center justify-center text-[#56E6D0] shadow-[0_0_30px_rgba(86,230,208,0.4)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-[#F1F7FF]">Circuit Synchronized!</h3>
                <p className="text-xs text-[#91A7BF] mt-1">
                  Completed in {moves} rotations · Score: {score.toLocaleString()} pts
                </p>
              </div>

              <div className="flex gap-3">
                <NeonButton
                  variant="cyan"
                  size="md"
                  onClick={() => {
                    if (currentLevelIndex < HEXA_LEVELS.length - 1) {
                      setCurrentLevelIndex((prev) => prev + 1);
                    } else {
                      setShowResultsModal(true);
                    }
                  }}
                  icon={<ChevronRight className="w-4 h-4" />}
                >
                  {currentLevelIndex < HEXA_LEVELS.length - 1 ? 'Next Level' : 'View Results'}
                </NeonButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <NeonButton
            variant="ghost"
            size="sm"
            icon={<Undo2 className="w-3.5 h-3.5" />}
            onClick={handleUndo}
            disabled={history.length === 0 || isLevelSolved}
          >
            Undo
          </NeonButton>

          <NeonButton
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={() => {
              sound.playClick();
              initLevel(currentLevelIndex);
            }}
          >
            Reset
          </NeonButton>

          <NeonButton
            variant="ghost"
            size="sm"
            icon={<Lightbulb className="w-3.5 h-3.5 text-[#FFB454]" />}
            onClick={handleHint}
            disabled={isLevelSolved}
          >
            Hint
          </NeonButton>
        </div>

        <span className="text-xs font-mono text-[#91A7BF]">
          TAP TILE TO ROTATE 60° CLOCKWISE
        </span>
      </div>

      {/* Help / Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07111F]/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#102238] border border-[rgba(130,180,220,0.22)] rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-[#F1F7FF] flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#56E6D0]" />
              <span>How to Play Hexa Flow</span>
            </h3>

            <div className="text-xs text-[#91A7BF] space-y-2.5 leading-relaxed">
              <p>
                Hexa Flow is an energy circuit routing puzzle based on axial hexagonal geometry.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-[#91A7BF]">
                <li><strong className="text-[#FFB454]">Source Node (PWR):</strong> Generates radiant continuous electric current.</li>
                <li><strong className="text-[#56E6D0]">Conduits:</strong> Internal paths routing through hexagonal edges. Tap any tile to rotate it 60° clockwise.</li>
                <li><strong className="text-[#67E8A5]">Terminal Sinks:</strong> Power capacitors that turn radiant green when properly energized.</li>
              </ul>
              <p className="text-[#F1F7FF] font-medium">
                Goal: Align all conduits so energy flows uninterrupted from the Source into all Target Sinks with minimal rotations!
              </p>
            </div>

            <NeonButton
              variant="cyan"
              size="md"
              className="w-full"
              onClick={() => setShowGuide(false)}
            >
              Start Connecting
            </NeonButton>
          </div>
        </div>
      )}

      {/* Completion Results Modal */}
      <ResultsModal
        isOpen={showResultsModal}
        gameTitle="Hexa Flow"
        result={latestResult}
        onPlayAgain={() => initLevel(currentLevelIndex)}
        onBackToHub={() => navigate('/')}
        onViewProgress={() => navigate('/progress')}
      />
    </div>
  );
};
