import { describe, it, expect } from 'vitest';
import {
  getItemCountForDifficulty,
  getTimeLimitForDifficulty,
  generateRound,
  calculateRoundScore,
} from './tinyAnomalyLogic';

describe('Tiny Anomaly Game Logic', () => {
  it('returns correct item count and columns for each difficulty tier', () => {
    const easy = getItemCountForDifficulty('easy');
    expect(easy.count).toBe(6);
    expect(easy.cols).toBe(3);

    const normal = getItemCountForDifficulty('normal');
    expect(normal.count).toBe(9);
    expect(normal.cols).toBe(3);

    const hard = getItemCountForDifficulty('hard');
    expect(hard.count).toBe(16);
    expect(hard.cols).toBe(4);
  });

  it('provides appropriate time limits for each tier', () => {
    expect(getTimeLimitForDifficulty('easy')).toBe(15);
    expect(getTimeLimitForDifficulty('normal')).toBe(10);
    expect(getTimeLimitForDifficulty('hard')).toBe(8);
  });

  it('generates a round with exactly one anomaly item', () => {
    const round = generateRound(1, 'normal');
    expect(round.items.length).toBe(9);
    const anomalies = round.items.filter((item) => item.isAnomaly);
    expect(anomalies.length).toBe(1);
    expect(round.items[round.anomalyIndex].isAnomaly).toBe(true);
  });

  it('handles reverse rotation anomaly properly', () => {
    const round = generateRound(1, 'easy', 'REVERSE_ROTATION');
    const anomaly = round.items[round.anomalyIndex];
    const normalItem = round.items[(round.anomalyIndex + 1) % round.items.length];
    expect(anomaly.rotationDir).not.toBe(normalItem.rotationDir);
  });

  it('handles speed delta anomaly properly', () => {
    const round = generateRound(2, 'normal', 'SPEED_DELTA');
    const anomaly = round.items[round.anomalyIndex];
    const normalItem = round.items[(round.anomalyIndex + 1) % round.items.length];
    expect(anomaly.rotationDuration).toBeLessThan(normalItem.rotationDuration);
  });

  it('calculates score scaling with remaining time and streak multiplier', () => {
    const lowScore = calculateRoundScore(2, 10, 0, 'normal');
    const highScore = calculateRoundScore(9, 10, 3, 'normal');
    expect(highScore).toBeGreaterThan(lowScore);
  });
});
