import React, { useState } from 'react';
import {
  Play,
  Sparkles,
  Flame,
  CheckCircle2,
  ArrowRight,
  Brain,
  Zap,
  ShieldCheck,
  Smile,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GameInfo, UserProgress, DailyChallenge, GameMood } from '../types';
import { GameCard } from '../components/GameCard';
import { DailyChallengeBanner } from '../components/DailyChallengeBanner';
import { NeonButton } from '../components/NeonButton';

interface HomeProps {
  games: GameInfo[];
  progress: UserProgress;
  dailyChallenge: DailyChallenge;
  onSelectGame: (route: string) => void;
}

export const Home: React.FC<HomeProps> = ({
  games,
  progress,
  dailyChallenge,
  onSelectGame,
}) => {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<GameMood | 'all'>('all');

  const filteredGames =
    selectedMood === 'all'
      ? games
      : games.filter((g) => g.moods.includes(selectedMood));

  const overallBestScore = Math.max(
    ...Object.values(progress.gameStats).map((s) => s.bestScore || 0)
  );

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-10 overflow-hidden">
        {/* Ambient neon radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-[#56E6D0]/10 via-[#62B7FF]/10 to-[#A78BFA]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-5 px-4">
         

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#F1F7FF] text-balance">
            Challenge your mind.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#56E6D0] via-[#62B7FF] to-[#A78BFA]">
              Find your calm.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#91A7BF] max-w-2xl mx-auto text-balance leading-relaxed">
            Nine timeless worlds. Endless ways to reset. Discover Mahjong Solitaire, Classic Klondike, 10×10 Block Puzzle, Chess Tactics, Fluid Conduits, and neural memory puzzles.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <NeonButton
              variant="cyan"
              size="lg"
              icon={<Play className="w-5 h-5 fill-current" />}
              onClick={() => {
                const el = document.getElementById('games-grid');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Play Games
            </NeonButton>

            <NeonButton
              variant="ghost"
              size="lg"
              icon={<Sparkles className="w-4 h-4 text-[#FFB454]" />}
              onClick={() => navigate('/daily')}
            >
              Daily Challenge
            </NeonButton>
          </div>

          {/* Mood Discovery Filter Shortcuts */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-[#91A7BF] mr-1">Discovery Mood:</span>
            <button
              onClick={() => setSelectedMood('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedMood === 'all'
                  ? 'bg-[#142B43] text-[#56E6D0] border border-[#56E6D0]/40'
                  : 'bg-[#102238]/60 text-[#91A7BF] border border-[rgba(130,180,220,0.12)] hover:text-[#F1F7FF]'
              }`}
            >
              All {games.length} Games
            </button>
            <button
              onClick={() => setSelectedMood('challenge')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                selectedMood === 'challenge'
                  ? 'bg-[#142B43] text-[#FFB454] border border-[#FFB454]/40'
                  : 'bg-[#102238]/60 text-[#91A7BF] border border-[rgba(130,180,220,0.12)] hover:text-[#F1F7FF]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-[#FFB454]" />
              <span>Challenge Me</span>
            </button>
            <button
              onClick={() => setSelectedMood('break')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                selectedMood === 'break'
                  ? 'bg-[#142B43] text-[#62B7FF] border border-[#62B7FF]/40'
                  : 'bg-[#102238]/60 text-[#91A7BF] border border-[rgba(130,180,220,0.12)] hover:text-[#F1F7FF]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#62B7FF]" />
              <span>Quick Break</span>
            </button>
            <button
              onClick={() => setSelectedMood('relax')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                selectedMood === 'relax'
                  ? 'bg-[#142B43] text-[#67E8A5] border border-[#67E8A5]/40'
                  : 'bg-[#102238]/60 text-[#91A7BF] border border-[rgba(130,180,220,0.12)] hover:text-[#F1F7FF]'
              }`}
            >
              <Smile className="w-3.5 h-3.5 text-[#67E8A5]" />
              <span>Help Me Relax</span>
            </button>
          </div>
        </div>
      </section>

      {/* Actual Saved Statistics Grid */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.15)]">
            <span className="text-xs text-[#91A7BF] block mb-1">Total Games Played</span>
            <span className="text-2xl font-extrabold font-mono text-[#F1F7FF] tabular-nums">
              {progress.totalGamesPlayed}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.15)]">
            <span className="text-xs text-[#91A7BF] block mb-1">Best Score Recorded</span>
            <span className="text-2xl font-extrabold font-mono text-[#56E6D0] tabular-nums">
              {overallBestScore > 0 ? overallBestScore.toLocaleString() : '—'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.15)]">
            <span className="text-xs text-[#91A7BF] block mb-1">Current Daily Streak</span>
            <span className="text-2xl font-extrabold font-mono text-[#FFB454] tabular-nums flex items-center gap-1.5">
              <Flame className="w-5 h-5 fill-[#FFB454]" />
              {progress.currentStreak} Days
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.15)]">
            <span className="text-xs text-[#91A7BF] block mb-1">Challenges Solved</span>
            <span className="text-2xl font-extrabold font-mono text-[#67E8A5] tabular-nums flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5" />
              {Object.keys(progress.completedDailyChallenges).length}
            </span>
          </div>
        </div>
      </section>

      {/* Featured Daily Challenge Section */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#91A7BF] font-mono">
            Today&apos;s Featured Challenge
          </h2>
          <button
            onClick={() => navigate('/daily')}
            className="text-xs font-medium text-[#56E6D0] hover:underline flex items-center gap-1"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <DailyChallengeBanner
          challenge={dailyChallenge}
          currentStreak={progress.currentStreak}
          onStartChallenge={(gameId) => {
            const matchedGame = games.find((g) => g.id === gameId);
            if (matchedGame) onSelectGame(matchedGame.route);
          }}
        />
      </section>

      {/* Games Catalog Section */}
      <section id="games-grid" className="max-w-5xl mx-auto px-4 pt-4">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#F1F7FF]">
              Playable Game Library
            </h2>
            <p className="text-sm text-[#91A7BF] mt-1">
              Nine complete, functional mini-games combining timeless classics with clean futuristic ergonomics.
            </p>
          </div>
          <span className="text-xs font-mono text-[#56E6D0]">
            Showing {filteredGames.length} of {games.length} games
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              stats={progress.gameStats[game.id]}
              onPlay={() => onSelectGame(game.route)}
              renderPreviewIcon={() => {
                if (game.id === 'mahjong-solitaire') {
                  return (
                    <div className="relative w-8 h-8 flex items-center justify-center">
                      <div className="w-5 h-6 rounded bg-[#102339] border border-[#56E6D0] flex items-center justify-center text-[10px] font-bold text-[#56E6D0]">
                        萬
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-5 rounded bg-[#152e4a] border border-[#FFB454] flex items-center justify-center text-[8px] font-bold text-[#FFB454]">
                        中
                      </div>
                    </div>
                  );
                } else if (game.id === 'classic-solitaire') {
                  return (
                    <div className="relative w-8 h-8 flex items-center justify-center">
                      <div className="w-5 h-7 rounded bg-[#102339] border border-[#62B7FF] flex flex-col items-center justify-center text-[10px] text-[#62B7FF] leading-none">
                        <span>A</span>
                        <span>♠</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-6 rounded bg-[#16273f] border border-[#FF6B8B] flex items-center justify-center text-[9px] text-[#FF6B8B]">
                        ♥
                      </div>
                    </div>
                  );
                } else if (game.id === 'block-puzzle') {
                  return (
                    <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-8 h-8 p-1 bg-[#091524] rounded-lg border border-[#23456b]">
                      <div className="bg-[#56E6D0] rounded-xs" />
                      <div className="bg-[#56E6D0] rounded-xs" />
                      <div className="bg-transparent" />
                      <div className="bg-[#FFB454] rounded-xs" />
                      <div className="bg-[#56E6D0] rounded-xs" />
                      <div className="bg-[#67E8A5] rounded-xs" />
                      <div className="bg-[#FFB454] rounded-xs" />
                      <div className="bg-transparent" />
                      <div className="bg-[#67E8A5] rounded-xs" />
                    </div>
                  );
                } else if (game.id === 'chess-puzzles') {
                  return (
                    <div className="w-8 h-8 rounded-lg bg-[#0c1c2e] border border-[#56E6D0] flex items-center justify-center text-xl text-[#56E6D0]">
                      ♞
                    </div>
                  );
                } else if (game.id === 'pipe-connect') {
                  return (
                    <svg viewBox="0 0 100 100" className="w-8 h-8">
                      <path d="M 15,50 L 50,50 L 50,85" stroke="#56E6D0" strokeWidth="16" strokeLinecap="round" fill="none" />
                      <circle cx="50" cy="50" r="14" fill="#FFB454" />
                    </svg>
                  );
                } else if (game.id === 'echo-path') {
                  return (
                    <div className="grid grid-cols-3 gap-1">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            [0, 1, 4, 7, 8].includes(i) ? 'bg-[#56E6D0]' : 'bg-[#102238] border border-[rgba(130,180,220,0.3)]'
                          }`}
                        />
                      ))}
                    </div>
                  );
                } else if (game.id === 'one-line') {
                  return (
                    <div className="w-8 h-8 flex flex-col justify-between p-1">
                      <div className="w-full h-1 bg-[#67E8A5] rounded-full" />
                      <div className="w-1 h-3 bg-[#67E8A5] rounded-full self-end" />
                      <div className="w-full h-1 bg-[#67E8A5] rounded-full" />
                    </div>
                  );
                } else if (game.id === 'tiny-anomaly') {
                  return (
                    <div className="relative w-8 h-8 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border border-[#FF6B8B]/40 animate-ping opacity-30" />
                      <div className="w-6 h-6 rounded-full border-2 border-[#FF6B8B] flex items-center justify-center bg-[#FF6B8B]/10">
                        <div className="w-2 h-2 rounded-full bg-[#FFB454] shadow-[0_0_6px_#FFB454]" />
                      </div>
                    </div>
                  );
                } else if (game.id === 'hexa-flow') {
                  return (
                    <svg viewBox="0 0 100 100" className="w-8 h-8">
                      <polygon
                        points="50,10 85,30 85,70 50,90 15,70 15,30"
                        fill="#102238"
                        stroke="#56E6D0"
                        strokeWidth="5"
                      />
                      <line x1="50" y1="50" x2="85" y2="30" stroke="#56E6D0" strokeWidth="6" strokeLinecap="round" />
                      <line x1="50" y1="50" x2="50" y2="90" stroke="#56E6D0" strokeWidth="6" strokeLinecap="round" />
                      <circle cx="50" cy="50" r="8" fill="#FFB454" />
                    </svg>
                  );
                } else {
                  return (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#56E6D0] to-[#62B7FF] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#fff]" />
                    </div>
                  );
                }
              }}
            />
          ))}
        </div>
      </section>

      {/* Why MINDPLAY Design Values */}
      <section className="max-w-5xl mx-auto px-4 pt-6">
        <div className="rounded-2xl bg-[#0B192B] border border-[rgba(130,180,220,0.14)] p-6 sm:p-8">
          <h3 className="text-lg font-bold text-[#F1F7FF] mb-4">Nine Timeless Worlds. Endless Ways to Reset.</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-[#56E6D0]/10 text-[#56E6D0] flex items-center justify-center mb-2">
                <Brain className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-[#F1F7FF]">Cognitive Variety</h4>
              <p className="text-xs text-[#91A7BF] leading-relaxed">
                Rotate through Mahjong tile pairs, Klondike cards, 10×10 polyominoes, chess tactics, pipe conduits, and memory recall.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-[#A78BFA]/10 text-[#A78BFA] flex items-center justify-center mb-2">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-[#F1F7FF]">Synthesized Audio</h4>
              <p className="text-xs text-[#91A7BF] leading-relaxed">
                Pure Web Audio harmonics with zero external audio assets. Responsive haptic chimes and optional calming ambient drones.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-[#67E8A5]/10 text-[#67E8A5] flex items-center justify-center mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-[#F1F7FF]">Private & Local</h4>
              <p className="text-xs text-[#91A7BF] leading-relaxed">
                All records, streaks, and progress persist securely inside your browser via LocalStorage. No account required.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
