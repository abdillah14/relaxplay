import { Difficulty } from '../types';

export type AnomalyType =
  | 'REVERSE_ROTATION'
  | 'SPEED_DELTA'
  | 'PULSE_RHYTHM'
  | 'SHAPE_GLITCH'
  | 'ORBIT_WOBBLE'
  | 'GLOW_PHASE';

export interface AnomalyItemConfig {
  id: number;
  isAnomaly: boolean;
  shapeType: 'hex_core' | 'prism_star' | 'tri_rotor' | 'ring_gear';
  anomalyShapeVariant?: boolean;
  rotationDir: 1 | -1;
  rotationDuration: number; // in seconds
  pulseDuration: number;    // in seconds
  hasWobble: boolean;
  glowColor: 'cyan' | 'amber' | 'coral';
}

export interface RoundConfig {
  roundNumber: number;
  totalItems: number;
  gridCols: number;
  anomalyIndex: number;
  anomalyType: AnomalyType;
  anomalyDescription: string;
  items: AnomalyItemConfig[];
  timeLimitSeconds: number;
}

export function getItemCountForDifficulty(diff: Difficulty): { count: number; cols: number } {
  switch (diff) {
    case 'easy':
      return { count: 6, cols: 3 };
    case 'normal':
      return { count: 9, cols: 3 };
    case 'hard':
      return { count: 16, cols: 4 };
  }
}

export function getTimeLimitForDifficulty(diff: Difficulty): number {
  switch (diff) {
    case 'easy':
      return 15;
    case 'normal':
      return 10;
    case 'hard':
      return 8;
  }
}

export function generateRound(
  roundNumber: number,
  difficulty: Difficulty,
  forcedAnomalyType?: AnomalyType
): RoundConfig {
  const { count, cols } = getItemCountForDifficulty(difficulty);
  const timeLimitSeconds = getTimeLimitForDifficulty(difficulty);
  const anomalyIndex = Math.floor(Math.random() * count);

  // Available anomaly types based on difficulty
  const easyTypes: AnomalyType[] = ['REVERSE_ROTATION', 'SPEED_DELTA', 'SHAPE_GLITCH'];
  const normalTypes: AnomalyType[] = ['REVERSE_ROTATION', 'SPEED_DELTA', 'PULSE_RHYTHM', 'SHAPE_GLITCH', 'GLOW_PHASE'];
  const hardTypes: AnomalyType[] = [
    'REVERSE_ROTATION',
    'SPEED_DELTA',
    'PULSE_RHYTHM',
    'SHAPE_GLITCH',
    'ORBIT_WOBBLE',
    'GLOW_PHASE',
  ];

  const pool = difficulty === 'easy' ? easyTypes : difficulty === 'normal' ? normalTypes : hardTypes;
  const anomalyType = forcedAnomalyType || pool[Math.floor(Math.random() * pool.length)];

  // Base parameters for normal objects
  const shapes: AnomalyItemConfig['shapeType'][] = ['hex_core', 'prism_star', 'tri_rotor', 'ring_gear'];
  const baseShape = shapes[(roundNumber - 1) % shapes.length];
  const baseDir: 1 | -1 = roundNumber % 2 === 0 ? 1 : -1;
  const baseRotDuration = difficulty === 'hard' ? 4.5 : 5.0;
  const basePulseDuration = 2.4;
  const baseGlow: AnomalyItemConfig['glowColor'] = 'cyan';

  let anomalyDescription = 'Identified anomaly';

  const items: AnomalyItemConfig[] = Array.from({ length: count }, (_, idx) => {
    const isAnomaly = idx === anomalyIndex;

    let dir = baseDir;
    let rotDur = baseRotDuration;
    let pulseDur = basePulseDuration;
    let wobble = false;
    let shapeVariant = false;
    let glow: AnomalyItemConfig['glowColor'] = baseGlow;

    if (isAnomaly) {
      switch (anomalyType) {
        case 'REVERSE_ROTATION':
          dir = baseDir === 1 ? -1 : 1;
          anomalyDescription = 'Spins in the opposite direction';
          break;

        case 'SPEED_DELTA':
          rotDur = difficulty === 'easy' ? baseRotDuration * 0.4 : difficulty === 'normal' ? baseRotDuration * 0.6 : baseRotDuration * 0.75;
          anomalyDescription = 'Rotates at an elevated frequency';
          break;

        case 'PULSE_RHYTHM':
          pulseDur = 1.1;
          anomalyDescription = 'Pulses with rapid asynchronous cadence';
          break;

        case 'SHAPE_GLITCH':
          shapeVariant = true;
          anomalyDescription = 'Displays altered internal geometry';
          break;

        case 'ORBIT_WOBBLE':
          wobble = true;
          anomalyDescription = 'Exhibits off-axis harmonic wobble';
          break;

        case 'GLOW_PHASE':
          glow = 'coral';
          anomalyDescription = 'Radiates a shifted thermal energy phase';
          break;
      }
    }

    return {
      id: idx,
      isAnomaly,
      shapeType: baseShape,
      anomalyShapeVariant: shapeVariant,
      rotationDir: dir,
      rotationDuration: rotDur,
      pulseDuration: pulseDur,
      hasWobble: wobble,
      glowColor: glow,
    };
  });

  return {
    roundNumber,
    totalItems: count,
    gridCols: cols,
    anomalyIndex,
    anomalyType,
    anomalyDescription,
    items,
    timeLimitSeconds,
  };
}

export function calculateRoundScore(
  timeRemaining: number,
  timeLimit: number,
  streak: number,
  difficulty: Difficulty
): number {
  const baseByDiff = {
    easy: 100,
    normal: 160,
    hard: 240,
  };

  const base = baseByDiff[difficulty];
  const timeRatio = Math.max(0, Math.min(1, timeRemaining / timeLimit));
  const timeBonus = Math.round(base * 0.8 * timeRatio);
  const streakMultiplier = 1 + Math.min(streak, 5) * 0.25;

  return Math.round((base + timeBonus) * streakMultiplier);
}
