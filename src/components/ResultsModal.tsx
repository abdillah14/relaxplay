import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Flame, RotateCcw, ArrowRight, BarChart2 } from 'lucide-react';
import { NeonButton } from './NeonButton';
import { GameResult } from '../types';
import { formatDuration } from '../utils/dates';
import { sound } from '../services/soundService';

interface ResultsModalProps {
  isOpen: boolean;
  gameTitle: string;
  result: GameResult | null;
  onPlayAgain: () => void;
  onBackToHub: () => void;
  onViewProgress: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  isOpen,
  gameTitle,
  result,
  onPlayAgain,
  onBackToHub,
  onViewProgress,
}) => {
  useEffect(() => {
    if (isOpen && result) {
      if (result.completedDailyChallenge) {
        sound.playChallengeComplete();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#56E6D0', '#FFB454', '#A78BFA', '#62B7FF'],
        });
      } else if (result.isPersonalBest || result.score > 0) {
        sound.playVictory();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#56E6D0', '#62B7FF', '#67E8A5'],
        });
      }
    }
  }, [isOpen, result]);

  if (!isOpen || !result) return null;

  let encouragingMessage = 'Nice work. Your focus is building with every round.';
  if (result.completedDailyChallenge) {
    encouragingMessage = 'Daily challenge complete. Tremendous focus and clarity!';
  } else if (result.isPersonalBest) {
    encouragingMessage = 'A new personal best! You pushed your mental horizon further.';
  } else if (result.score >= 500) {
    encouragingMessage = 'Outstanding performance. High cognitive agility demonstrated.';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07111F]/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#102238] border border-[rgba(130,180,220,0.22)] rounded-2xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow backdrop */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-20 bg-gradient-to-b from-[#56E6D0]/20 to-transparent blur-2xl pointer-events-none rounded-full" />

        {/* Header Icon & Title */}
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#56E6D0]/20 to-[#62B7FF]/10 border border-[#56E6D0]/40 flex items-center justify-center text-[#56E6D0] shadow-[0_0_20px_rgba(86,230,208,0.25)]">
          <Trophy className="w-7 h-7" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F1F7FF] mb-1">
          {gameTitle} Complete
        </h3>
        
        <p className="text-sm text-[#91A7BF] mb-5 leading-relaxed">
          {encouragingMessage}
        </p>

        {/* Daily Challenge Bonus Banner */}
        {result.completedDailyChallenge && (
          <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-[#FFB454]/15 via-[#FFB454]/10 to-transparent border border-[#FFB454]/40 flex items-center justify-between text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FFB454]/20 flex items-center justify-center text-[#FFB454]">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#FFB454]">Daily Challenge Solved!</div>
                <div className="text-[11px] text-[#91A7BF]">Streak bonus applied to your profile</div>
              </div>
            </div>
            <div className="text-sm font-bold font-mono text-[#FFB454]">
              +{result.pointsEarned} pts
            </div>
          </div>
        )}

        {/* Personal Best Banner */}
        {result.isPersonalBest && !result.completedDailyChallenge && (
          <div className="mb-5 p-2.5 rounded-xl bg-[#56E6D0]/10 border border-[#56E6D0]/30 text-xs font-medium text-[#56E6D0] flex items-center justify-center gap-2">
            <Trophy className="w-4 h-4" />
            <span>New Personal Best for {result.difficulty.toUpperCase()} difficulty!</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-[#0B192B] p-4 rounded-xl border border-[rgba(130,180,220,0.12)]">
          <div className="text-left">
            <span className="text-xs text-[#91A7BF] block mb-0.5">Final Score</span>
            <span className="text-2xl font-extrabold font-mono text-[#56E6D0] tabular-nums">
              {result.score.toLocaleString()}
            </span>
          </div>
          <div className="text-left">
            <span className="text-xs text-[#91A7BF] block mb-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Time Elapsed
            </span>
            <span className="text-2xl font-bold font-mono text-[#F1F7FF] tabular-nums">
              {formatDuration(result.elapsedSeconds)}
            </span>
          </div>

          {result.stats.moves !== undefined && (
            <div className="text-left pt-2 border-t border-[rgba(130,180,220,0.08)]">
              <span className="text-xs text-[#91A7BF] block mb-0.5">Moves</span>
              <span className="text-lg font-semibold font-mono text-[#F1F7FF] tabular-nums">
                {result.stats.moves}
              </span>
            </div>
          )}

          {result.stats.rotations !== undefined && (
            <div className="text-left pt-2 border-t border-[rgba(130,180,220,0.08)]">
              <span className="text-xs text-[#91A7BF] block mb-0.5">Rotations</span>
              <span className="text-lg font-semibold font-mono text-[#FFB454] tabular-nums">
                {result.stats.rotations}
              </span>
            </div>
          )}

          {result.stats.accuracy !== undefined && (
            <div className="text-left pt-2 border-t border-[rgba(130,180,220,0.08)]">
              <span className="text-xs text-[#91A7BF] block mb-0.5">Accuracy</span>
              <span className="text-lg font-semibold font-mono text-[#67E8A5] tabular-nums">
                {result.stats.accuracy}%
              </span>
            </div>
          )}

          {result.stats.level !== undefined && (
            <div className="text-left pt-2 border-t border-[rgba(130,180,220,0.08)]">
              <span className="text-xs text-[#91A7BF] block mb-0.5">Level</span>
              <span className="text-lg font-semibold font-mono text-[#A78BFA] tabular-nums">
                Level {result.stats.level}
              </span>
            </div>
          )}

          {result.stats.particlesCollected !== undefined && (
            <div className="text-left pt-2 border-t border-[rgba(130,180,220,0.08)]">
              <span className="text-xs text-[#91A7BF] block mb-0.5">Particles Collected</span>
              <span className="text-lg font-semibold font-mono text-[#62B7FF] tabular-nums">
                {result.stats.particlesCollected}
              </span>
            </div>
          )}

          {result.stats.anomaliesFound !== undefined && (
            <div className="text-left pt-2 border-t border-[rgba(130,180,220,0.08)]">
              <span className="text-xs text-[#91A7BF] block mb-0.5">Anomalies Detected</span>
              <span className="text-lg font-semibold font-mono text-[#FF6B8B] tabular-nums">
                {result.stats.anomaliesFound}
              </span>
            </div>
          )}

          {result.stats.streak !== undefined && (
            <div className="text-left pt-2 border-t border-[rgba(130,180,220,0.08)]">
              <span className="text-xs text-[#91A7BF] block mb-0.5">Best Streak</span>
              <span className="text-lg font-semibold font-mono text-[#FFB454] tabular-nums">
                {result.stats.streak}x
              </span>
            </div>
          )}

          {result.stats.pairsMatched !== undefined && (
            <div className="text-left pt-2 border-t border-[rgba(130,180,220,0.08)]">
              <span className="text-xs text-[#91A7BF] block mb-0.5">Pairs Matched</span>
              <span className="text-lg font-semibold font-mono text-[#56E6D0] tabular-nums">
                {result.stats.pairsMatched}
              </span>
            </div>
          )}

          {result.stats.linesCleared !== undefined && (
            <div className="text-left pt-2 border-t border-[rgba(130,180,220,0.08)]">
              <span className="text-xs text-[#91A7BF] block mb-0.5">Lines Cleared</span>
              <span className="text-lg font-semibold font-mono text-[#67E8A5] tabular-nums">
                {result.stats.linesCleared}
              </span>
            </div>
          )}

          {result.stats.blocksPlaced !== undefined && (
            <div className="text-left pt-2 border-t border-[rgba(130,180,220,0.08)]">
              <span className="text-xs text-[#91A7BF] block mb-0.5">Blocks Placed</span>
              <span className="text-lg font-semibold font-mono text-[#FFB454] tabular-nums">
                {result.stats.blocksPlaced}
              </span>
            </div>
          )}

          {result.stats.puzzlesSolved !== undefined && (
            <div className="text-left pt-2 border-t border-[rgba(130,180,220,0.08)]">
              <span className="text-xs text-[#91A7BF] block mb-0.5">Tactics Solved</span>
              <span className="text-lg font-semibold font-mono text-[#A78BFA] tabular-nums">
                {result.stats.puzzlesSolved}
              </span>
            </div>
          )}

          {result.stats.pipesConnected !== undefined && (
            <div className="text-left pt-2 border-t border-[rgba(130,180,220,0.08)]">
              <span className="text-xs text-[#91A7BF] block mb-0.5">Conduits Connected</span>
              <span className="text-lg font-semibold font-mono text-[#56E6D0] tabular-nums">
                {result.stats.pipesConnected}
              </span>
            </div>
          )}

          {result.stats.cardsMoved !== undefined && (
            <div className="text-left pt-2 border-t border-[rgba(130,180,220,0.08)]">
              <span className="text-xs text-[#91A7BF] block mb-0.5">Cards Played</span>
              <span className="text-lg font-semibold font-mono text-[#62B7FF] tabular-nums">
                {result.stats.cardsMoved}
              </span>
            </div>
          )}

          {result.stats.hintsUsed !== undefined && (
            <div className="text-left pt-2 border-t border-[rgba(130,180,220,0.08)]">
              <span className="text-xs text-[#91A7BF] block mb-0.5">Hints Used</span>
              <span className="text-lg font-semibold font-mono text-[#91A7BF] tabular-nums">
                {result.stats.hintsUsed}
              </span>
            </div>
          )}

          <div className="text-left pt-2 border-t border-[rgba(130,180,220,0.08)]">
            <span className="text-xs text-[#91A7BF] block mb-0.5">Difficulty</span>
            <span className="text-sm font-semibold uppercase tracking-wider text-[#FFB454]">
              {result.difficulty}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <NeonButton
            variant="cyan"
            size="lg"
            className="w-full"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={onPlayAgain}
          >
            Play Again
          </NeonButton>

          <div className="grid grid-cols-2 gap-2.5">
            <NeonButton
              variant="ghost"
              size="md"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={onBackToHub}
            >
              Game Hub
            </NeonButton>
            <NeonButton
              variant="ghost"
              size="md"
              icon={<BarChart2 className="w-4 h-4" />}
              onClick={onViewProgress}
            >
              My Records
            </NeonButton>
          </div>
        </div>

      </div>
    </div>
  );
};
