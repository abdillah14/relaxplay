import React from 'react';
import { Calendar, Flame, CheckCircle, Trophy, ArrowRight, Zap, Target, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DailyChallenge, UserProgress, GameId } from '../types';
import { formatDisplayDate } from '../utils/dates';
import { NeonButton } from '../components/NeonButton';
import { sound } from '../services/soundService';

interface DailyChallengePageProps {
  challenge: DailyChallenge;
  progress: UserProgress;
}

export const DailyChallengePage: React.FC<DailyChallengePageProps> = ({
  challenge,
  progress,
}) => {
  const navigate = useNavigate();

  const gameRoutes: Record<GameId, string> = {
    'mahjong-solitaire': '/games/mahjong-solitaire',
    'classic-solitaire': '/games/classic-solitaire',
    'block-puzzle': '/games/block-puzzle',
    'chess-puzzles': '/games/chess-puzzles',
    'pipe-connect': '/games/pipe-connect',
    'echo-path': '/games/echo-path',
    'one-line': '/games/one-line',
    'tiny-anomaly': '/games/tiny-anomaly',
    'hexa-flow': '/games/hexa-flow',
  };

  const handleLaunch = () => {
    sound.playClick();
    const route = gameRoutes[challenge.gameId] || '/';
    navigate(route);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-8">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            sound.playClick();
            navigate('/');
          }}
          className="flex items-center gap-1.5 text-xs font-medium text-[#91A7BF] hover:text-[#56E6D0] transition-colors p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Hub</span>
        </button>

        <span className="text-xs font-mono text-[#91A7BF]">
          LOCAL CALENDAR CYCLE · DAILY SYNC
        </span>
      </div>

      {/* Main Challenge Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#102238] via-[#0B192B] to-[#142B43] border border-[#FFB454]/40 p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#FFB454]/15 via-[#56E6D0]/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Metadata chip */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#91A7BF]">
            <span className="flex items-center gap-1.5 text-[#F1F7FF] font-medium">
              <Calendar className="w-4 h-4 text-[#FFB454]" />
              {formatDisplayDate(challenge.dateString)}
            </span>
            <span aria-hidden="true" className="text-[#91A7BF]/40">·</span>
            <span className="uppercase font-mono text-[#56E6D0] tracking-wider">
              {challenge.gameName}
            </span>
            <span aria-hidden="true" className="text-[#91A7BF]/40">·</span>
            <span className="uppercase font-mono text-[#FFB454] tracking-wider">
              {challenge.difficulty} Mode
            </span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F1F7FF] mb-2">
              {challenge.title}
            </h1>
            <p className="text-base text-[#91A7BF] max-w-xl leading-relaxed">
              Complete today&apos;s designated target objective in {challenge.gameName} to strengthen your streak and earn challenge points.
            </p>
          </div>

          {/* Objective Box */}
          <div className="p-5 rounded-2xl bg-[#07111F]/80 border border-[rgba(130,180,220,0.18)] max-w-lg">
            <span className="text-xs font-mono uppercase tracking-wider text-[#91A7BF] block mb-1">
              Required Target Objective
            </span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#56E6D0]/10 text-[#56E6D0] flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-[#F1F7FF] block">
                  {challenge.description}
                </span>
                <span className="text-xs text-[#91A7BF]">
                  Must be accomplished in a single session
                </span>
              </div>
            </div>
          </div>

          {/* Reward & Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[rgba(130,180,220,0.14)]">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs text-[#91A7BF] block mb-0.5 font-mono">REWARD</span>
                <span className="text-xl font-bold font-mono text-[#FFB454] flex items-center gap-1.5">
                  <Zap className="w-5 h-5 fill-[#FFB454]" />
                  +{challenge.rewardPoints} Points
                </span>
              </div>
              <div className="h-8 w-px bg-[rgba(130,180,220,0.2)]" />
              <div>
                <span className="text-xs text-[#91A7BF] block mb-0.5 font-mono">STATUS</span>
                <span className={`text-sm font-semibold flex items-center gap-1.5 ${
                  challenge.isCompleted ? 'text-[#67E8A5]' : 'text-[#91A7BF]'
                }`}>
                  {challenge.isCompleted ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Completed for Today
                    </>
                  ) : (
                    'Ready to Attempt'
                  )}
                </span>
              </div>
            </div>

            <NeonButton
              variant={challenge.isCompleted ? 'ghost' : 'orange'}
              size="lg"
              icon={challenge.isCompleted ? <CheckCircle className="w-5 h-5 text-[#67E8A5]" /> : <ArrowRight className="w-5 h-5" />}
              onClick={handleLaunch}
            >
              {challenge.isCompleted ? 'Play Again for Practice' : 'Launch Challenge Round'}
            </NeonButton>
          </div>
        </div>
      </div>

      {/* Streak and Past Records */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Streak Stats Card */}
        <div className="p-6 rounded-2xl bg-[#102238] border border-[rgba(130,180,220,0.16)] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFB454]/10 text-[#FFB454] flex items-center justify-center">
              <Flame className="w-5 h-5 fill-[#FFB454]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F1F7FF]">Daily Streak Mechanics</h3>
              <p className="text-xs text-[#91A7BF]">Consistency fosters synaptic plasticity</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[#0B192B] border border-[rgba(130,180,220,0.1)]">
              <span className="text-xs text-[#91A7BF] block mb-1">Active Streak</span>
              <span className="text-2xl font-bold font-mono text-[#FFB454] tabular-nums">
                {progress.currentStreak} Days
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0B192B] border border-[rgba(130,180,220,0.1)]">
              <span className="text-xs text-[#91A7BF] block mb-1">Longest Record</span>
              <span className="text-2xl font-bold font-mono text-[#56E6D0] tabular-nums">
                {progress.longestStreak} Days
              </span>
            </div>
          </div>

          <p className="text-xs text-[#91A7BF] leading-relaxed">
            Streaks increment once per calendar day upon satisfying the target challenge. Missing a day resets the active streak to 1, while preserving your all-time longest record.
          </p>
        </div>

        {/* Challenge Points Card */}
        <div className="p-6 rounded-2xl bg-[#102238] border border-[rgba(130,180,220,0.16)] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#56E6D0]/10 text-[#56E6D0] flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F1F7FF]">Total Challenge Points</h3>
              <p className="text-xs text-[#91A7BF]">Accumulated through daily completion</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B192B] border border-[rgba(130,180,220,0.1)] flex items-center justify-between">
            <span className="text-sm font-medium text-[#F1F7FF]">Points Earned</span>
            <span className="text-3xl font-extrabold font-mono text-[#56E6D0] tabular-nums">
              {progress.totalChallengePoints.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-[#91A7BF] pt-1">
            <span>Challenges solved all-time:</span>
            <span className="font-mono text-[#F1F7FF] font-semibold">
              {Object.keys(progress.completedDailyChallenges).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
