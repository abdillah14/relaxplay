import React from 'react';
import { Calendar, Flame, CheckCircle, ArrowRight, Zap, Target } from 'lucide-react';
import { DailyChallenge } from '../types';
import { formatDisplayDate } from '../utils/dates';
import { NeonButton } from './NeonButton';

interface DailyChallengeBannerProps {
  challenge: DailyChallenge;
  currentStreak: number;
  onStartChallenge: (gameId: string, difficulty: string) => void;
  compact?: boolean;
}

export const DailyChallengeBanner: React.FC<DailyChallengeBannerProps> = ({
  challenge,
  currentStreak,
  onStartChallenge,
  compact = false,
}) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#102238] via-[#0B192B] to-[#142B43] border ${
      challenge.isCompleted ? 'border-[#67E8A5]/40' : 'border-[#FFB454]/40'
    } p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.4)]`}>
      
      {/* Subtle neon glow */}
      <div className={`absolute -right-10 -bottom-10 w-44 h-44 rounded-full blur-3xl pointer-events-none ${
        challenge.isCompleted ? 'bg-[#67E8A5]/10' : 'bg-[#FFB454]/15'
      }`} />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          {/* Top metadata strip */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#91A7BF]">
            <span className="flex items-center gap-1.5 font-medium text-[#F1F7FF]">
              <Calendar className="w-3.5 h-3.5 text-[#FFB454]" />
              {formatDisplayDate(challenge.dateString)}
            </span>
            <span aria-hidden="true" className="text-[#91A7BF]/40">·</span>
            <span className="flex items-center gap-1 text-[#FFB454] font-medium">
              <Flame className="w-3.5 h-3.5 fill-[#FFB454]/30" />
              {currentStreak} Day Streak
            </span>
            <span aria-hidden="true" className="text-[#91A7BF]/40">·</span>
            <span className="text-xs uppercase font-mono tracking-wider text-[#56E6D0]">
              {challenge.gameName} ({challenge.difficulty})
            </span>
          </div>

          {/* Title & description */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#F1F7FF] flex items-center gap-2">
              <span>{challenge.title}</span>
              {challenge.isCompleted && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#67E8A5] bg-[#67E8A5]/10 border border-[#67E8A5]/30 px-2.5 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Completed
                </span>
              )}
            </h2>
            <p className="text-sm text-[#91A7BF] mt-0.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#56E6D0] shrink-0" />
              <span>{challenge.description}</span>
            </p>
          </div>
        </div>

        {/* Right side: reward points & launch CTA */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-[#91A7BF] uppercase tracking-wider font-mono">Daily Reward</span>
            <span className="text-lg font-bold font-mono text-[#FFB454] flex items-center gap-1">
              <Zap className="w-4 h-4 fill-[#FFB454]" />
              +{challenge.rewardPoints} pts
            </span>
          </div>

          <NeonButton
            variant={challenge.isCompleted ? 'ghost' : 'orange'}
            size={compact ? 'sm' : 'md'}
            icon={challenge.isCompleted ? <CheckCircle className="w-4 h-4 text-[#67E8A5]" /> : <ArrowRight className="w-4 h-4" />}
            onClick={() => onStartChallenge(challenge.gameId, challenge.difficulty)}
          >
            {challenge.isCompleted ? 'Play Again' : 'Start Challenge'}
          </NeonButton>
        </div>
      </div>
    </div>
  );
};
