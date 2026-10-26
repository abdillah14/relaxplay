import { DailyChallenge, GameId, Difficulty } from '../types';
import { getLocalDateString } from '../utils/dates';

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getDailyChallenge(dateString: string = getLocalDateString()): DailyChallenge {
  const seed = hashString(dateString);
  const gameIndex = seed % 9;
  const diffIndex = Math.floor(seed / 9) % 3;

  const games: { id: GameId; name: string }[] = [
    { id: 'echo-path', name: 'Echo Path' },
    { id: 'one-line', name: 'One Line' },
    { id: 'tiny-anomaly', name: 'Tiny Anomaly' },
    { id: 'hexa-flow', name: 'Hexa Flow' },
    { id: 'mahjong-solitaire', name: 'Mahjong Solitaire' },
    { id: 'classic-solitaire', name: 'Classic Solitaire' },
    { id: 'block-puzzle', name: 'Block Puzzle' },
    { id: 'chess-puzzles', name: 'Chess Puzzles' },
    { id: 'pipe-connect', name: 'Pipe Connect' },
  ];

  const difficulties: Difficulty[] = ['normal', 'easy', 'hard'];
  const selectedGame = games[gameIndex];
  const selectedDiff = difficulties[diffIndex];

  let title = '';
  let description = '';
  let targetMetric: DailyChallenge['targetMetric'] = {
    type: 'level',
    threshold: 5,
    comparison: 'gte',
  };
  let rewardPoints = 200;

  switch (selectedGame.id) {
    case 'echo-path':
      targetMetric = {
        type: 'level',
        threshold: selectedDiff === 'easy' ? 4 : selectedDiff === 'normal' ? 6 : 8,
        comparison: 'gte',
      };
      title = 'Resonant Memory';
      description = `Reach Level ${targetMetric.threshold} in Echo Path`;
      rewardPoints = selectedDiff === 'easy' ? 150 : selectedDiff === 'normal' ? 220 : 320;
      break;

    case 'one-line':
      targetMetric = {
        type: 'level',
        threshold: selectedDiff === 'easy' ? 3 : selectedDiff === 'normal' ? 5 : 8,
        comparison: 'gte',
      };
      title = 'Continuous Circuit';
      description = `Complete Level ${targetMetric.threshold} in One Line`;
      rewardPoints = selectedDiff === 'easy' ? 150 : selectedDiff === 'normal' ? 220 : 320;
      break;

    case 'tiny-anomaly':
      targetMetric = {
        type: 'anomalies',
        threshold: selectedDiff === 'easy' ? 4 : selectedDiff === 'normal' ? 5 : 6,
        comparison: 'gte',
      };
      title = 'Subtle Glitch';
      description = `Spot ${targetMetric.threshold} anomalies in Tiny Anomaly`;
      rewardPoints = selectedDiff === 'easy' ? 160 : selectedDiff === 'normal' ? 240 : 340;
      break;

    case 'hexa-flow':
      targetMetric = {
        type: 'level',
        threshold: selectedDiff === 'easy' ? 3 : selectedDiff === 'normal' ? 6 : 9,
        comparison: 'gte',
      };
      title = 'Hexa Stream';
      description = `Complete Circuit Level ${targetMetric.threshold} in Hexa Flow`;
      rewardPoints = selectedDiff === 'easy' ? 160 : selectedDiff === 'normal' ? 250 : 350;
      break;

    case 'mahjong-solitaire':
      targetMetric = {
        type: 'pairs',
        threshold: selectedDiff === 'easy' ? 10 : selectedDiff === 'normal' ? 18 : 24,
        comparison: 'gte',
      };
      title = 'Jade Pairing';
      description = `Match at least ${targetMetric.threshold} tile pairs in Mahjong Solitaire`;
      rewardPoints = selectedDiff === 'easy' ? 160 : selectedDiff === 'normal' ? 240 : 350;
      break;

    case 'classic-solitaire':
      targetMetric = {
        type: 'cards',
        threshold: selectedDiff === 'easy' ? 12 : selectedDiff === 'normal' ? 24 : 36,
        comparison: 'gte',
      };
      title = 'Grand Tableau';
      description = `Move at least ${targetMetric.threshold} cards to build foundations`;
      rewardPoints = selectedDiff === 'easy' ? 180 : selectedDiff === 'normal' ? 260 : 380;
      break;

    case 'block-puzzle':
      targetMetric = {
        type: 'lines',
        threshold: selectedDiff === 'easy' ? 3 : selectedDiff === 'normal' ? 6 : 10,
        comparison: 'gte',
      };
      title = 'Grid Harmonizer';
      description = `Clear ${targetMetric.threshold} lines in Block Puzzle`;
      rewardPoints = selectedDiff === 'easy' ? 150 : selectedDiff === 'normal' ? 230 : 340;
      break;

    case 'chess-puzzles':
      targetMetric = {
        type: 'puzzles',
        threshold: selectedDiff === 'easy' ? 2 : selectedDiff === 'normal' ? 3 : 5,
        comparison: 'gte',
      };
      title = 'Grandmaster Gambit';
      description = `Solve ${targetMetric.threshold} tactical chess puzzles in a row`;
      rewardPoints = selectedDiff === 'easy' ? 180 : selectedDiff === 'normal' ? 280 : 400;
      break;

    case 'pipe-connect':
    default:
      targetMetric = {
        type: 'pipes',
        threshold: selectedDiff === 'easy' ? 2 : selectedDiff === 'normal' ? 4 : 6,
        comparison: 'gte',
      };
      title = 'Flux Conduit';
      description = `Successfully connect ${targetMetric.threshold} complete pipe conduits`;
      rewardPoints = selectedDiff === 'easy' ? 160 : selectedDiff === 'normal' ? 250 : 360;
      break;
  }

  return {
    dateString,
    gameId: selectedGame.id,
    gameName: selectedGame.name,
    difficulty: selectedDiff,
    title,
    description,
    targetMetric,
    rewardPoints,
    isCompleted: false,
  };
}

export function checkChallengeMet(
  challenge: DailyChallenge,
  result: {
    gameId: GameId;
    difficulty: Difficulty;
    level?: number;
    moves?: number;
    accuracy?: number;
    anomaliesFound?: number;
    rotations?: number;
    pairsMatched?: number;
    linesCleared?: number;
    blocksPlaced?: number;
    puzzlesSolved?: number;
    pipesConnected?: number;
    cardsMoved?: number;
  }
): boolean {
  if (result.gameId !== challenge.gameId) return false;

  const { type, threshold, comparison } = challenge.targetMetric;
  let actualValue: number | undefined;

  if (type === 'level') actualValue = result.level;
  if (type === 'moves') actualValue = result.moves;
  if (type === 'accuracy') actualValue = result.accuracy;
  if (type === 'anomalies') actualValue = result.anomaliesFound;
  if (type === 'rotations') actualValue = result.rotations;
  if (type === 'pairs') actualValue = result.pairsMatched;
  if (type === 'cards') actualValue = result.cardsMoved;
  if (type === 'lines') actualValue = result.linesCleared;
  if (type === 'puzzles') actualValue = result.puzzlesSolved;
  if (type === 'pipes') actualValue = result.pipesConnected;

  if (actualValue === undefined || isNaN(actualValue)) return false;

  if (comparison === 'lte') {
    return actualValue <= threshold;
  } else {
    return actualValue >= threshold;
  }
}
