export type GameId =
  | 'echo-path'
  | 'one-line'
  | 'tiny-anomaly'
  | 'hexa-flow'
  | 'mahjong-solitaire'
  | 'classic-solitaire'
  | 'block-puzzle'
  | 'chess-puzzles'
  | 'pipe-connect';

export type Difficulty = 'easy' | 'normal' | 'hard';
export type GameMood = 'challenge' | 'break' | 'relax';

export interface GameInfo {
  id: GameId;
  name: string;
  tagline: string;
  description: string;
  category: string;
  estimatedTime: string;
  difficultyLevels: Difficulty[];
  accentColor: 'cyan' | 'amber' | 'purple' | 'green' | 'blue' | 'coral';
  route: string;
  moods: GameMood[];
}

export interface GameStats {
  played: number;
  completed: number;
  bestScore: number;
  bestScorePerDifficulty: {
    easy: number;
    normal: number;
    hard: number;
  };
  customRecords?: Record<string, number | string>;
}

export interface GameResult {
  id: string;
  gameId: GameId;
  difficulty: Difficulty;
  score: number;
  elapsedSeconds: number;
  timestamp: number;
  stats: {
    level?: number;
    moves?: number;
    rotations?: number;
    accuracy?: number;
    particlesCollected?: number;
    maxSequence?: number;
    hintsUsed?: number;
    anomaliesFound?: number;
    streak?: number;
    roundsCompleted?: number;
    // Classic 5 games additions
    pairsMatched?: number;
    tilesRemaining?: number;
    cardsMoved?: number;
    foundationsCompleted?: number;
    linesCleared?: number;
    blocksPlaced?: number;
    puzzlesSolved?: number;
    pipesConnected?: number;
  };
  isPersonalBest: boolean;
  completedDailyChallenge: boolean;
  pointsEarned: number;
}

export interface DailyChallenge {
  dateString: string; // YYYY-MM-DD
  gameId: GameId;
  gameName: string;
  difficulty: Difficulty;
  title: string;
  description: string;
  targetMetric: {
    type:
      | 'level'
      | 'moves'
      | 'accuracy'
      | 'anomalies'
      | 'rotations'
      | 'pairs'
      | 'cards'
      | 'lines'
      | 'puzzles'
      | 'pipes';
    threshold: number;
    comparison: 'lte' | 'gte';
  };
  rewardPoints: number;
  isCompleted: boolean;
  completedAt?: number;
}

export interface UserProgress {
  totalGamesPlayed: number;
  totalGamesCompleted: number;
  totalChallengePoints: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string; // YYYY-MM-DD
  lastCompletedChallengeDate: string; // YYYY-MM-DD
  gameStats: Record<GameId, GameStats>;
  completedDailyChallenges: Record<string, boolean>; // dateString -> boolean
  recentHistory: GameResult[];
}

export interface AppSettings {
  soundEnabled: boolean;
  sfxVolume: number;
  ambientEnabled: boolean;
  ambientVolume: number;
  preferredDifficulty: Difficulty;
  reducedMotion: boolean;
  relaxedModeDefault: boolean;
}
