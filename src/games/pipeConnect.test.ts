import { describe, it, expect } from 'vitest';
import {
  getOpenDirections,
  areTilesConnected,
  computePoweredTiles,
  PipeTile,
  CURATED_LEVELS,
} from './PipeConnect';

describe('PipeConnect Logic', () => {
  it('correctly calculates open directions after rotation', () => {
    const straightTile: PipeTile = {
      id: 'test-1',
      r: 0,
      c: 0,
      type: 'straight',
      solutionRotation: 0,
      currentRotation: 1, // 90 deg rotation of [0, 2] -> [1, 3] (Right & Left)
    };
    expect(getOpenDirections(straightTile)).toEqual([1, 3]);

    const cornerTile: PipeTile = {
      id: 'test-2',
      r: 0,
      c: 0,
      type: 'corner',
      solutionRotation: 0,
      currentRotation: 2, // 180 deg of [0, 1] -> [2, 3] (Down & Left)
    };
    expect(getOpenDirections(cornerTile)).toEqual([2, 3]);
  });

  it('determines if two adjacent tiles are connected', () => {
    const tileA: PipeTile = {
      id: 'a',
      r: 0,
      c: 0,
      type: 'straight',
      solutionRotation: 1,
      currentRotation: 1, // open Right (1) & Left (3)
    };

    const tileB: PipeTile = {
      id: 'b',
      r: 0,
      c: 1,
      type: 'straight',
      solutionRotation: 1,
      currentRotation: 1, // open Right (1) & Left (3)
    };

    expect(areTilesConnected(tileA, tileB)).toBe(true);

    // If tileB is rotated vertically (0) -> open Up (0) & Down (2)
    const rotatedB: PipeTile = { ...tileB, currentRotation: 0 };
    expect(areTilesConnected(tileA, rotatedB)).toBe(false);
  });

  it('verifies that each curated level has a valid solvable solution rotation that reaches destination', () => {
    CURATED_LEVELS.forEach((level) => {
      const solutionTiles: PipeTile[] = level.tiles.map((t, idx) => ({
        id: `pipe-${t.r}-${t.c}-${idx}`,
        r: t.r,
        c: t.c,
        type: t.type,
        solutionRotation: t.correctRot,
        currentRotation: t.correctRot, // using correct rotation
        isSource: t.isSource,
        isDestination: t.isDestination,
      }));

      const powered = computePoweredTiles(solutionTiles, level.rows, level.cols);
      const dest = solutionTiles.find((t) => t.isDestination);
      expect(dest).toBeDefined();
      expect(powered.has(dest!.id), `Level "${level.name}" should be solvable`).toBe(true);
    });
  });
});
