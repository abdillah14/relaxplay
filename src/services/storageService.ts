import { UserProgress, AppSettings, GameId, Difficulty, GameResult } from '../types';
import { getLocalDateString, isConsecutiveDay } from '../utils/dates';
import { getDailyChallenge, checkChallengeMet } from './dailyChallengeService';

const PROGRESS_KEY = 'RELAXPLAY_user_progress_v3';
const SETTINGS_KEY = 'RELAXPLAY_user_settings_v3';

const defaultStats = () => ({
  played: 0,
  completed: 0,
  bestScore: 0,
  bestScorePerDifficulty: {
    easy: 0,
    normal: 0,
    hard: 0,
  },
  customRecords: {},
});

export const defaultProgress: UserProgress = {
  totalGamesPlayed: 0,
  totalGamesCompleted: 0,
  totalChallengePoints: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedDate: '',
  lastCompletedChallengeDate: '',
  gameStats: {
    'echo-path': defaultStats(),
    'one-line': defaultStats(),
    'tiny-anomaly': defaultStats(),
    'hexa-flow': defaultStats(),
    'mahjong-solitaire': defaultStats(),
    'classic-solitaire': defaultStats(),
    'block-puzzle': defaultStats(),
    'chess-puzzles': defaultStats(),
    'pipe-connect': defaultStats(),
  },
  completedDailyChallenges: {},
  recentHistory: [],
};

export const defaultSettings: AppSettings = {
  soundEnabled: true,
  sfxVolume: 0.5,
  ambientEnabled: false,
  ambientVolume: 0.3,
  preferredDifficulty: 'normal',
  reducedMotion: false,
  relaxedModeDefault: false,
};

class StorageService {
  public loadProgress(): UserProgress {
    try {
      let data = localStorage.getItem(PROGRESS_KEY);
      if (!data) {
        data = localStorage.getItem('RELAXPLAY_user_progress_v2');
      }
      if (!data) return { ...defaultProgress };
      const parsed = JSON.parse(data);
      return {
        ...defaultProgress,
        ...parsed,
        gameStats: {
          'echo-path': { ...defaultStats(), ...(parsed.gameStats?.['echo-path'] || {}) },
          'one-line': { ...defaultStats(), ...(parsed.gameStats?.['one-line'] || {}) },
          'tiny-anomaly': { ...defaultStats(), ...(parsed.gameStats?.['tiny-anomaly'] || {}) },
          'hexa-flow': { ...defaultStats(), ...(parsed.gameStats?.['hexa-flow'] || {}) },
          'mahjong-solitaire': { ...defaultStats(), ...(parsed.gameStats?.['mahjong-solitaire'] || {}) },
          'classic-solitaire': { ...defaultStats(), ...(parsed.gameStats?.['classic-solitaire'] || {}) },
          'block-puzzle': { ...defaultStats(), ...(parsed.gameStats?.['block-puzzle'] || {}) },
          'chess-puzzles': { ...defaultStats(), ...(parsed.gameStats?.['chess-puzzles'] || {}) },
          'pipe-connect': { ...defaultStats(), ...(parsed.gameStats?.['pipe-connect'] || {}) },
        },
        completedDailyChallenges: parsed.completedDailyChallenges || {},
        recentHistory: Array.isArray(parsed.recentHistory) ? parsed.recentHistory : [],
      };
    } catch {
      return { ...defaultProgress };
    }
  }

  public saveProgress(progress: UserProgress): void {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {}
  }

  public loadSettings(): AppSettings {
    try {
      let data = localStorage.getItem(SETTINGS_KEY);
      if (!data) {
        data = localStorage.getItem('RELAXPLAY_user_settings_v2');
      }
      if (!data) return { ...defaultSettings };
      return { ...defaultSettings, ...JSON.parse(data) };
    } catch {
      return { ...defaultSettings };
    }
  }

  public saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  }

  public recordGameResult(params: {
    gameId: GameId;
    difficulty: Difficulty;
    score: number;
    elapsedSeconds: number;
    isCompleted: boolean;
    stats: GameResult['stats'];
  }): {
    result: GameResult;
    isPersonalBest: boolean;
    completedDailyChallenge: boolean;
    pointsEarned: number;
  } {
    const validScore = Math.max(0, Math.round(Number.isFinite(params.score) ? params.score : 0));
    const validTime = Math.max(
      0,
      Math.round(Number.isFinite(params.elapsedSeconds) ? params.elapsedSeconds : 0)
    );
    const today = getLocalDateString();

    const progress = this.loadProgress();
    const game = progress.gameStats[params.gameId] || defaultStats();

    game.played += 1;
    if (params.isCompleted) {
      game.completed += 1;
      progress.totalGamesCompleted += 1;
    }
    progress.totalGamesPlayed += 1;
    progress.lastPlayedDate = today;

    const previousBestDiff = game.bestScorePerDifficulty[params.difficulty] || 0;
    const isPersonalBest = validScore > previousBestDiff && params.isCompleted;

    if (isPersonalBest) {
      game.bestScorePerDifficulty[params.difficulty] = validScore;
    }
    if (validScore > game.bestScore && params.isCompleted) {
      game.bestScore = validScore;
    }

    const daily = getDailyChallenge(today);
    const wasAlreadyCompleted = !!progress.completedDailyChallenges[today];
    let justCompletedDaily = false;
    let pointsEarned = 0;

    if (!wasAlreadyCompleted && params.isCompleted) {
      const met = checkChallengeMet(daily, {
        gameId: params.gameId,
        difficulty: params.difficulty,
        level: params.stats.level,
        moves: params.stats.moves || params.stats.rotations,
        accuracy: params.stats.accuracy,
        anomaliesFound: params.stats.anomaliesFound,
        rotations: params.stats.rotations,
        pairsMatched: params.stats.pairsMatched,
        linesCleared: params.stats.linesCleared,
        blocksPlaced: params.stats.blocksPlaced,
        puzzlesSolved: params.stats.puzzlesSolved,
        pipesConnected: params.stats.pipesConnected,
        cardsMoved: params.stats.cardsMoved,
      });

      if (met) {
        justCompletedDaily = true;
        progress.completedDailyChallenges[today] = true;
        pointsEarned = daily.rewardPoints;
        progress.totalChallengePoints += pointsEarned;

        if (progress.lastCompletedChallengeDate) {
          if (isConsecutiveDay(progress.lastCompletedChallengeDate, today)) {
            progress.currentStreak += 1;
          } else if (progress.lastCompletedChallengeDate !== today) {
            progress.currentStreak = 1;
          }
        } else {
          progress.currentStreak = 1;
        }

        progress.longestStreak = Math.max(progress.longestStreak, progress.currentStreak);
        progress.lastCompletedChallengeDate = today;
      }
    }

    const result: GameResult = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      gameId: params.gameId,
      difficulty: params.difficulty,
      score: validScore,
      elapsedSeconds: validTime,
      timestamp: Date.now(),
      stats: params.stats,
      isPersonalBest,
      completedDailyChallenge: justCompletedDaily,
      pointsEarned,
    };

    progress.recentHistory = [result, ...(progress.recentHistory || [])].slice(0, 30);
    this.saveProgress(progress);

    return {
      result,
      isPersonalBest,
      completedDailyChallenge: justCompletedDaily,
      pointsEarned,
    };
  }

  public resetAllData(): void {
    try {
      localStorage.removeItem(PROGRESS_KEY);
      localStorage.removeItem(SETTINGS_KEY);
      localStorage.removeItem('RELAXPLAY_user_progress_v2');
      localStorage.removeItem('RELAXPLAY_user_settings_v2');
    } catch {}
  }
}

export const storage = new StorageService();
