import React from 'react';
import { Trophy, Flame, CheckCircle2, Clock, ArrowLeft, Gamepad2, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProgress, GameId } from '../types';
import { formatDuration } from '../utils/dates';
import { sound } from '../services/soundService';

interface ProgressPageProps {
  progress: UserProgress;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ progress }) => {
  const navigate = useNavigate();

  const gameDetails: Record<GameId, { name: string; color: string; route: string }> = {
    'mahjong-solitaire': { name: 'Mahjong Solitaire', color: 'text-[#56E6D0]', route: '/games/mahjong-solitaire' },
    'classic-solitaire': { name: 'Classic Solitaire', color: 'text-[#A78BFA]', route: '/games/classic-solitaire' },
    'block-puzzle': { name: 'Block Puzzle', color: 'text-[#FFB454]', route: '/games/block-puzzle' },
    'chess-puzzles': { name: 'Chess Puzzles', color: 'text-[#62B7FF]', route: '/games/chess-puzzles' },
    'pipe-connect': { name: 'Pipe Connect', color: 'text-[#67E8A5]', route: '/games/pipe-connect' },
    'echo-path': { name: 'Echo Path', color: 'text-[#56E6D0]', route: '/games/echo-path' },
    'one-line': { name: 'One Line', color: 'text-[#67E8A5]', route: '/games/one-line' },
    'tiny-anomaly': { name: 'Tiny Anomaly', color: 'text-[#FF6B8B]', route: '/games/tiny-anomaly' },
    'hexa-flow': { name: 'Hexa Flow', color: 'text-[#56E6D0]', route: '/games/hexa-flow' },
  };

  const completionRate =
    progress.totalGamesPlayed > 0
      ? Math.round((progress.totalGamesCompleted / progress.totalGamesPlayed) * 100)
      : 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-8">
      {/* Top Header */}
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
          PLAYER TELEMETRY · LOCAL BROWSER STORAGE
        </span>
      </div>

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#F1F7FF] mb-2">
          Focus & Performance Metrics
        </h1>
        <p className="text-sm text-[#91A7BF] leading-relaxed">
          Review your personal records, completion streaks, and recent game sessions across all ten cognitive worlds.
        </p>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#102238] border border-[rgba(130,180,220,0.16)]">
          <span className="text-xs text-[#91A7BF] block mb-1">Total Games Completed</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-[#F1F7FF] tabular-nums">
              {progress.totalGamesCompleted}
            </span>
            <span className="text-xs font-mono text-[#91A7BF]">
              / {progress.totalGamesPlayed} played ({completionRate}%)
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#102238] border border-[rgba(130,180,220,0.16)]">
          <span className="text-xs text-[#91A7BF] block mb-1">Challenge Points</span>
          <div className="flex items-center gap-1.5">
            <span className="text-3xl font-extrabold font-mono text-[#FFB454] tabular-nums">
              {progress.totalChallengePoints.toLocaleString()}
            </span>
            <span className="text-xs text-[#FFB454] font-mono">pts</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#102238] border border-[rgba(130,180,220,0.16)]">
          <span className="text-xs text-[#91A7BF] block mb-1">Active Daily Streak</span>
          <div className="flex items-center gap-2 text-[#FFB454]">
            <Flame className="w-6 h-6 fill-[#FFB454]" />
            <span className="text-3xl font-extrabold font-mono tabular-nums">
              {progress.currentStreak}
            </span>
            <span className="text-xs text-[#91A7BF] font-mono">Days</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#102238] border border-[rgba(130,180,220,0.16)]">
          <span className="text-xs text-[#91A7BF] block mb-1">Longest Daily Streak</span>
          <div className="flex items-center gap-2 text-[#56E6D0]">
            <Award className="w-6 h-6" />
            <span className="text-3xl font-extrabold font-mono tabular-nums">
              {progress.longestStreak}
            </span>
            <span className="text-xs text-[#91A7BF] font-mono">Days</span>
          </div>
        </div>
      </div>

      {/* Game Specific Records Grid (5 Games) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#F1F7FF] flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#FFB454]" />
          <span>Game-Specific Records</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(Object.keys(gameDetails) as GameId[]).map((gameId) => {
            const stats = progress.gameStats[gameId];
            const details = gameDetails[gameId];

            return (
              <div
                key={gameId}
                className="p-5 rounded-2xl bg-[#102238] border border-[rgba(130,180,220,0.16)] space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className={`text-base font-bold ${details.color}`}>{details.name}</h3>
                  <button
                    onClick={() => {
                      sound.playClick();
                      navigate(details.route);
                    }}
                    className="text-xs text-[#91A7BF] hover:text-[#56E6D0] flex items-center gap-1 font-medium"
                  >
                    <span>Play</span>
                    <Gamepad2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#0B192B] border border-[rgba(130,180,220,0.08)]">
                    <span className="text-[#91A7BF]">Easy Level Best:</span>
                    <span className="font-mono font-bold text-[#F1F7FF] tabular-nums">
                      {stats?.bestScorePerDifficulty.easy > 0
                        ? stats.bestScorePerDifficulty.easy.toLocaleString()
                        : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#0B192B] border border-[rgba(130,180,220,0.08)]">
                    <span className="text-[#91A7BF]">Normal Level Best:</span>
                    <span className="font-mono font-bold text-[#56E6D0] tabular-nums">
                      {stats?.bestScorePerDifficulty.normal > 0
                        ? stats.bestScorePerDifficulty.normal.toLocaleString()
                        : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#0B192B] border border-[rgba(130,180,220,0.08)]">
                    <span className="text-[#91A7BF]">Hard Level Best:</span>
                    <span className="font-mono font-bold text-[#FFB454] tabular-nums">
                      {stats?.bestScorePerDifficulty.hard > 0
                        ? stats.bestScorePerDifficulty.hard.toLocaleString()
                        : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#91A7BF] pt-2 border-t border-[rgba(130,180,220,0.1)]">
                  <span>Rounds played:</span>
                  <span className="font-mono text-[#F1F7FF] font-semibold">{stats?.played || 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent History Table */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-[#F1F7FF] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#56E6D0]" />
          <span>Recent Game Sessions</span>
        </h2>

        {progress.recentHistory.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#102238] border border-[rgba(130,180,220,0.15)] text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#142B43] flex items-center justify-center text-[#91A7BF]">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#F1F7FF]">No session records yet</p>
            <p className="text-xs text-[#91A7BF] max-w-sm mx-auto">
              Play your first session across any of MINDPLAY's 10 mini-games to start logging your scores and records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[rgba(130,180,220,0.16)] bg-[#102238]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0B192B] text-xs font-mono text-[#91A7BF] uppercase tracking-wider border-b border-[rgba(130,180,220,0.12)]">
                <tr>
                  <th className="py-3 px-4">Game</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Key Stats</th>
                  <th className="py-3 px-4 text-right">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(130,180,220,0.08)]">
                {progress.recentHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-[#142B43]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#F1F7FF]">
                      {gameDetails[item.gameId]?.name || item.gameId}
                    </td>
                    <td className="py-3 px-4 uppercase text-xs font-mono text-[#91A7BF]">
                      {item.difficulty}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#56E6D0] tabular-nums">
                      {item.score.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[#91A7BF] tabular-nums">
                      {formatDuration(item.elapsedSeconds)}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-[#91A7BF]">
                      {item.stats.pairsMatched !== undefined && `${item.stats.pairsMatched} pairs`}
                      {item.stats.linesCleared !== undefined && `${item.stats.linesCleared} lines`}
                      {item.stats.blocksPlaced !== undefined && `${item.stats.blocksPlaced} blocks`}
                      {item.stats.puzzlesSolved !== undefined && `${item.stats.puzzlesSolved} tactics`}
                      {item.stats.pipesConnected !== undefined && `${item.stats.pipesConnected} pipes`}
                      {item.stats.cardsMoved !== undefined && `${item.stats.cardsMoved} cards`}
                      {item.stats.moves !== undefined && !item.stats.pairsMatched && !item.stats.cardsMoved && `${item.stats.moves} moves`}
                      {item.stats.rotations !== undefined && `${item.stats.rotations} turns`}
                      {item.stats.anomaliesFound !== undefined && `${item.stats.anomaliesFound} anomalies`}
                      {item.stats.level !== undefined && `Level ${item.stats.level}`}
                      {item.stats.accuracy !== undefined && `${item.stats.accuracy}% accuracy`}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.completedDailyChallenge && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FFB454] bg-[#FFB454]/15 px-2 py-0.5 rounded-full border border-[#FFB454]/30 mr-1.5">
                          <Flame className="w-3 h-3" />
                          Daily Solved
                        </span>
                      )}
                      {item.isPersonalBest && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#67E8A5] bg-[#67E8A5]/15 px-2 py-0.5 rounded-full border border-[#67E8A5]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Best
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
