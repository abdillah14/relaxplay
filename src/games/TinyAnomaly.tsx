import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  Eye,
  Flame,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Scan,
  ShieldAlert,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Difficulty, GameResult } from '../types';
import { ResultsModal } from '../components/ResultsModal';
import { NeonButton } from '../components/NeonButton';
import { sound } from '../services/soundService';
import { storage } from '../services/storageService';
import {
  generateRound,
  calculateRoundScore,
  RoundConfig,
  AnomalyItemConfig,
} from './tinyAnomalyLogic';

interface TinyAnomalyProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TinyAnomaly: React.FC<TinyAnomalyProps> = ({
  soundEnabled,
  onToggleSound,
}) => {
  const navigate = useNavigate();

  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [relaxedMode, setRelaxedMode] = useState<boolean>(false);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const totalRounds = 5;

  const [roundConfig, setRoundConfig] = useState<RoundConfig>(() =>
    generateRound(1, 'normal')
  );
  const [timeRemaining, setTimeRemaining] = useState<number>(roundConfig.timeLimitSeconds);
  const [isRoundActive, setIsRoundActive] = useState<boolean>(true);

  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [anomaliesFound, setAnomaliesFound] = useState<number>(0);
  const [totalGuesses, setTotalGuesses] = useState<number>(0);
  const [elapsedTotalSeconds, setElapsedTotalSeconds] = useState<number>(0);

  // Round Feedback State
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [roundOutcome, setRoundOutcome] = useState<'CORRECT' | 'WRONG' | 'TIMEOUT' | null>(null);
  const [outcomeDescription, setOutcomeDescription] = useState<string>('');

  // Hints
  const [hintsAvailable, setHintsAvailable] = useState<number>(2);
  const [activeHintDimmedIds, setActiveHintDimmedIds] = useState<number[]>([]);
  const [hintsUsedCount, setHintsUsedCount] = useState<number>(0);

  // Guide modal
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Results
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [latestResult, setLatestResult] = useState<GameResult | null>(null);

  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Start round
  const startNewRound = useCallback(
    (rnd: number, diff: Difficulty) => {
      const config = generateRound(rnd, diff);
      setRoundConfig(config);
      setTimeRemaining(config.timeLimitSeconds);
      setSelectedItemId(null);
      setRoundOutcome(null);
      setOutcomeDescription('');
      setActiveHintDimmedIds([]);
      setIsRoundActive(true);
    },
    []
  );

  // Reset entire game session
  const resetGame = useCallback(
    (newDiff?: Difficulty) => {
      const activeDiff = newDiff || difficulty;
      setDifficulty(activeDiff);
      setRoundNumber(1);
      setScore(0);
      setStreak(0);
      setBestStreak(0);
      setAnomaliesFound(0);
      setTotalGuesses(0);
      setElapsedTotalSeconds(0);
      setHintsAvailable(activeDiff === 'easy' ? 3 : 2);
      setHintsUsedCount(0);
      setShowResultsModal(false);
      setLatestResult(null);
      startNewRound(1, activeDiff);
    },
    [difficulty, startNewRound]
  );

  // Overall session timer
  useEffect(() => {
    if (showResultsModal) return;
    totalTimerRef.current = setInterval(() => {
      setElapsedTotalSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    };
  }, [showResultsModal]);

  // Round countdown timer
  useEffect(() => {
    if (relaxedMode || !isRoundActive || showResultsModal) {
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
      return;
    }

    roundTimerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (roundTimerRef.current) clearInterval(roundTimerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    };
  }, [relaxedMode, isRoundActive, showResultsModal]);

  // Handle timeout
  const handleTimeout = () => {
    setIsRoundActive(false);
    setRoundOutcome('TIMEOUT');
    setOutcomeDescription(`Time expired! The anomaly was item #${roundConfig.anomalyIndex + 1}: ${roundConfig.anomalyDescription}.`);
    sound.playMismatch();
    setStreak(0);

    setTimeout(() => {
      advanceOrFinish(roundNumber, false);
    }, 2400);
  };

  // Handle guess on an item
  const handleItemClick = (item: AnomalyItemConfig) => {
    if (!isRoundActive) return;

    setSelectedItemId(item.id);
    setTotalGuesses((prev) => prev + 1);

    if (item.isAnomaly) {
      // Correct!
      setIsRoundActive(false);
      sound.playAnomalyDetect();
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((prev) => Math.max(prev, newStreak));
      setAnomaliesFound((prev) => prev + 1);

      const roundScore = calculateRoundScore(
        timeRemaining,
        roundConfig.timeLimitSeconds,
        newStreak,
        difficulty
      );
      setScore((prev) => prev + roundScore);

      setRoundOutcome('CORRECT');
      setOutcomeDescription(`Anomaly Detected! +${roundScore} pts (${roundConfig.anomalyDescription})`);

      setTimeout(() => {
        advanceOrFinish(roundNumber, true);
      }, 1600);
    } else {
      // Wrong guess
      sound.playMismatch();
      setStreak(0);
      setScore((prev) => Math.max(0, prev - 30));
      setRoundOutcome('WRONG');
      setOutcomeDescription('Normal unit identified. Look for subtle variations!');

      // Allow another try on same round if time permits
      setTimeout(() => {
        setSelectedItemId(null);
        setRoundOutcome(null);
        setOutcomeDescription('');
      }, 800);
    }
  };

  // Move to next round or finish
  const advanceOrFinish = (currentRnd: number, wasCorrect: boolean) => {
    if (currentRnd >= totalRounds) {
      finishGame(wasCorrect);
    } else {
      const nextRnd = currentRnd + 1;
      setRoundNumber(nextRnd);
      startNewRound(nextRnd, difficulty);
    }
  };

  // Finish session
  const finishGame = (lastWasCorrect: boolean) => {
    setIsRoundActive(false);
    const finalAnomalies = lastWasCorrect ? anomaliesFound + 1 : anomaliesFound;
    const finalAccuracy =
      totalGuesses > 0 ? Math.round((finalAnomalies / totalGuesses) * 100) : 0;

    const recorded = storage.recordGameResult({
      gameId: 'tiny-anomaly',
      difficulty,
      score,
      elapsedSeconds: elapsedTotalSeconds,
      isCompleted: true,
      stats: {
        anomaliesFound: finalAnomalies,
        streak: bestStreak,
        accuracy: finalAccuracy,
        roundsCompleted: totalRounds,
      },
    });

    setLatestResult(recorded.result);
    setShowResultsModal(true);
  };

  // Scan clue / hint
  const handleUseHint = () => {
    if (hintsAvailable <= 0 || !isRoundActive || activeHintDimmedIds.length > 0) return;
    sound.playClick();
    setHintsAvailable((prev) => prev - 1);
    setHintsUsedCount((prev) => prev + 1);

    // Dim half of the non-anomaly items
    const nonAnomalies = roundConfig.items
      .filter((i) => !i.isAnomaly)
      .map((i) => i.id);
    // Shuffle and pick half
    const halfCount = Math.floor(nonAnomalies.length / 2);
    const shuffled = [...nonAnomalies].sort(() => Math.random() - 0.5);
    setActiveHintDimmedIds(shuffled.slice(0, halfCount));
  };

  // Render SVG Shape
  const renderItemShape = (item: AnomalyItemConfig) => {
    const isCoral = item.glowColor === 'coral';
    const primaryColor = isCoral ? '#FF6B8B' : '#56E6D0';
    const accentFill = isCoral ? 'rgba(255, 107, 139, 0.18)' : 'rgba(86, 230, 208, 0.12)';

    return (
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(86,230,208,0.25)]"
      >
        {item.shapeType === 'hex_core' && (
          <g>
            <polygon
              points="50,12 85,32 85,68 50,88 15,68 15,32"
              fill={accentFill}
              stroke={primaryColor}
              strokeWidth={item.anomalyShapeVariant ? '5' : '3'}
              strokeDasharray={item.anomalyShapeVariant ? '6,3' : undefined}
            />
            {item.anomalyShapeVariant ? (
              <circle cx="50" cy="50" r="14" fill="#FFB454" />
            ) : (
              <circle cx="50" cy="50" r="8" fill={primaryColor} />
            )}
            <line x1="50" y1="20" x2="50" y2="35" stroke={primaryColor} strokeWidth="2.5" />
            <line x1="50" y1="65" x2="50" y2="80" stroke={primaryColor} strokeWidth="2.5" />
            <line x1="24" y1="35" x2="36" y2="42" stroke={primaryColor} strokeWidth="2.5" />
            <line x1="76" y1="65" x2="64" y2="58" stroke={primaryColor} strokeWidth="2.5" />
          </g>
        )}

        {item.shapeType === 'prism_star' && (
          <g>
            <polygon
              points="50,10 62,38 92,38 68,56 77,85 50,68 23,85 32,56 8,38 38,38"
              fill={accentFill}
              stroke={primaryColor}
              strokeWidth="2.5"
            />
            {item.anomalyShapeVariant ? (
              <rect
                x="42"
                y="42"
                width="16"
                height="16"
                fill="#FFB454"
                transform="rotate(45 50 50)"
              />
            ) : (
              <circle cx="50" cy="50" r="6" fill="#F1F7FF" />
            )}
          </g>
        )}

        {item.shapeType === 'tri_rotor' && (
          <g>
            <circle
              cx="50"
              cy="50"
              r="34"
              fill="none"
              stroke={primaryColor}
              strokeWidth="2"
              strokeDasharray="10, 8"
            />
            {/* 3 blades */}
            <path
              d="M 50 50 L 50 18 A 6 6 0 0 1 56 24 L 50 50"
              fill={primaryColor}
            />
            <path
              d="M 50 50 L 77 65 A 6 6 0 0 1 74 72 L 50 50"
              fill={primaryColor}
            />
            <path
              d="M 50 50 L 23 65 A 6 6 0 0 1 20 58 L 50 50"
              fill={primaryColor}
            />
            {item.anomalyShapeVariant ? (
              <polygon points="50,42 58,58 42,58" fill="#FFB454" />
            ) : (
              <circle cx="50" cy="50" r="7" fill={primaryColor} />
            )}
          </g>
        )}

        {item.shapeType === 'ring_gear' && (
          <g>
            <circle
              cx="50"
              cy="50"
              r="28"
              fill={accentFill}
              stroke={primaryColor}
              strokeWidth="3"
            />
            {/* Cog teeth */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <rect
                key={i}
                x="47"
                y="15"
                width="6"
                height="8"
                rx="1"
                fill={item.anomalyShapeVariant && i === 0 ? '#FFB454' : primaryColor}
                transform={`rotate(${angle} 50 50)`}
              />
            ))}
            <circle cx="50" cy="50" r="10" fill="#07111F" stroke={primaryColor} strokeWidth="2" />
          </g>
        )}
      </svg>
    );
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

        <div className="flex items-center gap-2">
          {/* Difficulty selector pills */}
          <div className="flex items-center bg-[#102238] rounded-xl p-1 border border-[rgba(130,180,220,0.16)]">
            {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  sound.playClick();
                  resetGame(d);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  difficulty === d
                    ? 'bg-[#FF6B8B] text-[#07111F] shadow-[0_0_12px_rgba(255,107,139,0.4)]'
                    : 'text-[#91A7BF] hover:text-[#F1F7FF]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

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

      {/* Game Title & Status Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#102238] border border-[rgba(130,180,220,0.18)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B8B] animate-pulse" />
            <h1 className="text-xl font-extrabold tracking-tight text-[#F1F7FF] flex items-center gap-2">
              <span>Tiny Anomaly</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-[#FF6B8B]/20 text-[#FF6B8B] border border-[#FF6B8B]/40 font-mono">
                OBSERVATION
              </span>
            </h1>
          </div>
          <p className="text-xs text-[#91A7BF]">
            Scan the neural cluster. One synthetic unit behaves aberrantly—tap it to isolate!
          </p>
        </div>

        {/* HUD Metrics */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-[#0B192B] border border-[rgba(130,180,220,0.12)]">
            <span className="text-[#91A7BF] block text-[10px]">ROUND</span>
            <span className="text-sm font-bold text-[#F1F7FF] tabular-nums">
              {roundNumber} / {totalRounds}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-[#0B192B] border border-[rgba(130,180,220,0.12)]">
            <span className="text-[#91A7BF] block text-[10px]">SCORE</span>
            <span className="text-sm font-bold text-[#56E6D0] tabular-nums">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-[#0B192B] border border-[rgba(130,180,220,0.12)] flex items-center gap-1.5">
            <Flame className={`w-4 h-4 ${streak > 0 ? 'text-[#FFB454] fill-[#FFB454]' : 'text-[#91A7BF]'}`} />
            <div>
              <span className="text-[#91A7BF] block text-[10px]">STREAK</span>
              <span className="text-sm font-bold text-[#FFB454] tabular-nums">
                {streak}x
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Timer & Relaxed Mode Toggle & Hint */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            {!relaxedMode ? (
              <span className="flex items-center gap-1.5 text-[#91A7BF] font-mono">
                <Clock className="w-3.5 h-3.5 text-[#FF6B8B]" />
                <span className={timeRemaining <= 3 ? 'text-[#FF7285] font-bold animate-pulse' : 'text-[#F1F7FF]'}>
                  {timeRemaining}s remaining
                </span>
              </span>
            ) : (
              <span className="text-[#67E8A5] font-medium font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Relaxed Mode Active (No countdown)
              </span>
            )}

            <button
              onClick={() => {
                sound.playClick();
                setRelaxedMode((prev) => !prev);
              }}
              className="text-[11px] text-[#91A7BF] hover:text-[#56E6D0] underline underline-offset-2"
            >
              {relaxedMode ? 'Enable Timer' : 'Switch to Relaxed'}
            </button>
          </div>

          <button
            onClick={handleUseHint}
            disabled={hintsAvailable <= 0 || !isRoundActive || activeHintDimmedIds.length > 0}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#142B43] border border-[rgba(130,180,220,0.16)] text-xs text-[#56E6D0] hover:border-[#56E6D0]/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Scan Sector ({hintsAvailable} left)</span>
          </button>
        </div>

        {/* Progress Bar for Timer */}
        {!relaxedMode && (
          <div className="w-full h-1.5 bg-[#0B192B] rounded-full overflow-hidden border border-[rgba(130,180,220,0.1)]">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                timeRemaining <= 3 ? 'bg-[#FF7285]' : 'bg-gradient-to-r from-[#56E6D0] via-[#FFB454] to-[#FF6B8B]'
              }`}
              style={{
                width: `${(timeRemaining / roundConfig.timeLimitSeconds) * 100}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Outcome Feedback Banner */}
      <AnimatePresence>
        {roundOutcome && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              roundOutcome === 'CORRECT'
                ? 'bg-[#56E6D0]/10 border-[#56E6D0]/40 text-[#56E6D0]'
                : roundOutcome === 'TIMEOUT'
                ? 'bg-[#FFB454]/10 border-[#FFB454]/40 text-[#FFB454]'
                : 'bg-[#FF7285]/10 border-[#FF7285]/40 text-[#FF7285]'
            }`}
          >
            <div className="flex items-center gap-2">
              {roundOutcome === 'CORRECT' && <CheckCircle2 className="w-4 h-4 text-[#56E6D0]" />}
              {roundOutcome === 'WRONG' && <XCircle className="w-4 h-4 text-[#FF7285]" />}
              {roundOutcome === 'TIMEOUT' && <ShieldAlert className="w-4 h-4 text-[#FFB454]" />}
              <span>{outcomeDescription}</span>
            </div>
            <span className="font-mono text-[11px] opacity-80 uppercase tracking-wider">
              {roundOutcome}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Observation Cluster Grid */}
      <div
        className={`grid gap-4 sm:gap-6 p-6 sm:p-8 rounded-3xl bg-[#0B192B] border border-[rgba(130,180,220,0.18)] shadow-[inset_0_0_30px_rgba(0,0,0,0.6)] ${
          roundConfig.gridCols === 4
            ? 'grid-cols-3 sm:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3'
        }`}
      >
        {roundConfig.items.map((item) => {
          const isDimmed = activeHintDimmedIds.includes(item.id);
          const isSelected = selectedItemId === item.id;
          const isRevealedAnomaly =
            (roundOutcome === 'TIMEOUT' || (roundOutcome === 'CORRECT' && item.isAnomaly)) &&
            item.isAnomaly;

          return (
            <motion.button
              key={item.id}
              onClick={() => handleItemClick(item)}
              disabled={!isRoundActive || isDimmed}
              whileHover={isRoundActive && !isDimmed ? { scale: 1.05 } : undefined}
              whileTap={isRoundActive && !isDimmed ? { scale: 0.95 } : undefined}
              className={`relative aspect-square rounded-2xl p-4 flex items-center justify-center transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B8B] ${
                isDimmed
                  ? 'opacity-20 pointer-events-none bg-[#07111F]'
                  : isRevealedAnomaly
                  ? 'bg-[#FF6B8B]/20 border-2 border-[#FF6B8B] shadow-[0_0_25px_rgba(255,107,139,0.5)]'
                  : isSelected && roundOutcome === 'WRONG'
                  ? 'bg-[#FF7285]/20 border-2 border-[#FF7285] animate-shake'
                  : 'bg-[#102238] border border-[rgba(130,180,220,0.16)] hover:border-[#56E6D0]/50 hover:bg-[#142B43]'
              }`}
            >
              {/* Animated Inner SVG */}
              <motion.div
                animate={{
                  rotate: item.rotationDir * 360,
                  scale: [1, 1.08, 1],
                  x: item.hasWobble ? [-4, 4, -4] : 0,
                  y: item.hasWobble ? [3, -3, 3] : 0,
                }}
                transition={{
                  rotate: {
                    repeat: Infinity,
                    duration: item.rotationDuration,
                    ease: 'linear',
                  },
                  scale: {
                    repeat: Infinity,
                    duration: item.pulseDuration,
                    ease: 'easeInOut',
                  },
                  x: item.hasWobble ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } : undefined,
                  y: item.hasWobble ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } : undefined,
                }}
                className="w-16 h-16 sm:w-20 sm:h-20 pointer-events-none"
              >
                {renderItemShape(item)}
              </motion.div>

              {/* Unit Tag badge */}
              <span className="absolute bottom-2 right-2.5 font-mono text-[9px] text-[#91A7BF]/50 pointer-events-none">
                #{item.id + 1}
              </span>

              {/* Ping icon on correct isolate */}
              {isRevealedAnomaly && (
                <div className="absolute top-2 left-2 text-[#FF6B8B]">
                  <Eye className="w-4 h-4 animate-ping" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Bottom Session Actions */}
      <div className="flex items-center justify-between pt-2">
        <NeonButton
          variant="ghost"
          size="sm"
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={() => {
            sound.playClick();
            resetGame();
          }}
        >
          Restart Game
        </NeonButton>

        <span className="text-xs font-mono text-[#91A7BF]">
          ANOMALY FREQUENCY DETECTOR · SENSORS NOMINAL
        </span>
      </div>

      {/* Help / Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07111F]/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#102238] border border-[rgba(130,180,220,0.22)] rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-[#F1F7FF] flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#FF6B8B]" />
              <span>How to Play Tiny Anomaly</span>
            </h3>

            <div className="text-xs text-[#91A7BF] space-y-2.5 leading-relaxed">
              <p>
                A high-speed cognitive observation exercise. In each round, a cluster of animated geometric nodes operates synchronously.
              </p>
              <p className="text-[#F1F7FF] font-medium">
                Exactly one node is an <span className="text-[#FF6B8B]">Anomaly</span> behaving differently:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[#91A7BF]">
                <li><strong className="text-[#56E6D0]">Reversed Spin:</strong> Rotating in the opposite direction.</li>
                <li><strong className="text-[#56E6D0]">Speed Delta:</strong> Rotating noticeably faster than its peers.</li>
                <li><strong className="text-[#56E6D0]">Pulse Rhythm:</strong> Breathing / pulsing on a different cadence.</li>
                <li><strong className="text-[#56E6D0]">Shape Glitch:</strong> Altered internal geometric elements.</li>
                <li><strong className="text-[#56E6D0]">Orbit Wobble:</strong> Subtle harmonic precession.</li>
                <li><strong className="text-[#56E6D0]">Shifted Glow:</strong> Radiating a coral thermal aura.</li>
              </ul>
              <p>
                Build streaks for multiplier bonuses. If you need a breather, toggle <span className="text-[#67E8A5]">Relaxed Mode</span> to remove the countdown timer!
              </p>
            </div>

            <NeonButton
              variant="coral"
              size="md"
              className="w-full"
              onClick={() => setShowGuide(false)}
            >
              Got it, let&apos;s spot anomalies!
            </NeonButton>
          </div>
        </div>
      )}

      {/* Completion Results Modal */}
      <ResultsModal
        isOpen={showResultsModal}
        gameTitle="Tiny Anomaly"
        result={latestResult}
        onPlayAgain={() => resetGame()}
        onBackToHub={() => navigate('/')}
        onViewProgress={() => navigate('/progress')}
      />
    </div>
  );
};
