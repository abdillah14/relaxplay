import { describe, it, expect } from 'vitest';
import {
  HexTile,
  rotateTileClockwise,
  rotateTileCounterClockwise,
  computeEnergyFlow,
  getActiveConduits,
  HEXA_LEVELS,
  calculateHexaScore,
} from './hexaFlowLogic';

describe('Hexa Flow Circuit Logic', () => {
  const sampleTile: HexTile = {
    id: 'test_1',
    q: 0,
    r: 0,
    type: 'conduit',
    baseConduits: [0, 2],
    currentRotation: 0,
    solvedRotation: 0,
    isPowered: false,
  };

  it('rotates conduits 60 degrees clockwise modulo 6', () => {
    const rotated = rotateTileClockwise(sampleTile);
    expect(rotated.currentRotation).toBe(1);
    expect(getActiveConduits(rotated)).toEqual([1, 3]);

    const rotatedTwice = rotateTileClockwise(rotated);
    expect(rotatedTwice.currentRotation).toBe(2);
    expect(getActiveConduits(rotatedTwice)).toEqual([2, 4]);
  });

  it('rotates conduits counter-clockwise properly', () => {
    const rotatedCCW = rotateTileCounterClockwise(sampleTile);
    expect(rotatedCCW.currentRotation).toBe(5);
    expect(getActiveConduits(rotatedCCW)).toEqual([5, 1]);
  });

  it('does not rotate fixed tiles', () => {
    const fixedTile: HexTile = { ...sampleTile, isFixed: true };
    const triedRotate = rotateTileClockwise(fixedTile);
    expect(triedRotate.currentRotation).toBe(0);
  });

  it('correctly propagates energy in solved Level 1', () => {
    const level1 = HEXA_LEVELS[0];
    const { isSolved, poweredTiles, poweredSinkCount, totalSinkCount } = computeEnergyFlow(level1.tiles);
    expect(isSolved).toBe(true);
    expect(poweredSinkCount).toBe(totalSinkCount);
    expect(poweredTiles.every((t) => t.isPowered)).toBe(true);
  });

  it('detects unpowered state when conduits are misaligned', () => {
    const level1 = HEXA_LEVELS[0];
    // Rotate the middle conduit away from solution
    const misalignedTiles = level1.tiles.map((t) =>
      t.id === 't2' ? { ...t, currentRotation: 2 } : t
    );
    const { isSolved, poweredSinkCount } = computeEnergyFlow(misalignedTiles);
    expect(isSolved).toBe(false);
    expect(poweredSinkCount).toBe(0);
  });

  it('verifies all 15 handcrafted levels have at least one source and sink and can be solved', () => {
    expect(HEXA_LEVELS.length).toBe(15);

    HEXA_LEVELS.forEach((level) => {
      const sources = level.tiles.filter((t) => t.type === 'source');
      const sinks = level.tiles.filter((t) => t.type === 'sink');

      expect(sources.length).toBeGreaterThanOrEqual(1);
      expect(sinks.length).toBeGreaterThanOrEqual(1);

      // Verify that in the base solved orientation, the level solves
      const solvedTiles = level.tiles.map((t) => ({ ...t, currentRotation: t.solvedRotation }));
      const { isSolved, poweredSinkCount, totalSinkCount } = computeEnergyFlow(solvedTiles);
      if (!isSolved) {
        throw new Error(`Level ${level.id} (${level.name}) failed to solve: powered ${poweredSinkCount}/${totalSinkCount}`);
      }
      expect(isSolved).toBe(true);
    });
  });

  it('calculates score rewarding fewer rotations and quick times', () => {
    const efficientScore = calculateHexaScore(5, 5, 20, 'easy');
    const wastefulScore = calculateHexaScore(5, 15, 60, 'easy');
    expect(efficientScore).toBeGreaterThan(wastefulScore);
  });
});
