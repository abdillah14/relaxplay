import { describe, it, expect } from 'vitest';
import { canPlaceOnTableau, canPlaceOnFoundation, Card } from './ClassicSolitaire';
import { canPlaceShape, canFitAnywhere, BlockShape } from './BlockPuzzle';
import { isTileSelectable, TilePos } from './MahjongSolitaire';

describe('Classic Solitaire Rules', () => {
  it('allows only Kings on empty tableau columns', () => {
    const king: Card = { id: 'k-1', suit: 'hearts', rank: 13, faceUp: true };
    const queen: Card = { id: 'q-1', suit: 'spades', rank: 12, faceUp: true };
    expect(canPlaceOnTableau(king, [])).toBe(true);
    expect(canPlaceOnTableau(queen, [])).toBe(false);
  });

  it('enforces descending rank and alternating colors in tableau', () => {
    const red9: Card = { id: 'h-9', suit: 'hearts', rank: 9, faceUp: true };
    const black8: Card = { id: 's-8', suit: 'spades', rank: 8, faceUp: true };
    const red8: Card = { id: 'd-8', suit: 'diamonds', rank: 8, faceUp: true };
    const black7: Card = { id: 'c-7', suit: 'clubs', rank: 7, faceUp: true };

    expect(canPlaceOnTableau(black8, [red9])).toBe(true);
    expect(canPlaceOnTableau(red8, [red9])).toBe(false); // same color
    expect(canPlaceOnTableau(black7, [red9])).toBe(false); // not one rank lower
  });

  it('enforces ascending same-suit build on foundations starting from Ace', () => {
    const aceSpades: Card = { id: 's-1', suit: 'spades', rank: 1, faceUp: true };
    const twoSpades: Card = { id: 's-2', suit: 'spades', rank: 2, faceUp: true };
    const twoHearts: Card = { id: 'h-2', suit: 'hearts', rank: 2, faceUp: true };

    expect(canPlaceOnFoundation(aceSpades, [])).toBe(true);
    expect(canPlaceOnFoundation(twoSpades, [])).toBe(false); // must start with Ace
    expect(canPlaceOnFoundation(twoSpades, [aceSpades])).toBe(true);
    expect(canPlaceOnFoundation(twoHearts, [aceSpades])).toBe(false); // wrong suit
  });
});

describe('Block Puzzle Rules', () => {
  const emptyGrid = Array(10).fill(null).map(() => Array(10).fill(null));
  const testShape: BlockShape = {
    id: 't-1',
    name: 'square-2',
    matrix: [[1, 1], [1, 1]],
    color: '#56E6D0',
  };

  it('allows placement in open spaces within grid bounds', () => {
    expect(canPlaceShape(emptyGrid, testShape, 0, 0)).toBe(true);
    expect(canPlaceShape(emptyGrid, testShape, 8, 8)).toBe(true);
  });

  it('rejects placement that extends beyond grid bounds', () => {
    expect(canPlaceShape(emptyGrid, testShape, 9, 9)).toBe(false);
    expect(canPlaceShape(emptyGrid, testShape, -1, 0)).toBe(false);
  });

  it('rejects placement on already occupied cells', () => {
    const gridWithBlock = emptyGrid.map((row) => [...row]);
    gridWithBlock[0][0] = '#FF0000';
    expect(canPlaceShape(gridWithBlock, testShape, 0, 0)).toBe(false);
  });

  it('correctly detects if shape can fit anywhere', () => {
    expect(canFitAnywhere(emptyGrid, testShape)).toBe(true);
    const fullGrid = Array(10).fill(null).map(() => Array(10).fill('#FF0000'));
    expect(canFitAnywhere(fullGrid, testShape)).toBe(false);
  });
});

describe('Mahjong Solitaire Rules', () => {
  it('detects when a tile is free vs blocked from above', () => {
    const baseTile: TilePos = {
      id: 't-0',
      type: 'dot_1',
      category: 'dots',
      label: '1',
      layer: 0,
      r: 4,
      c: 4,
      matched: false,
    };
    const coveringTile: TilePos = {
      id: 't-1',
      type: 'dot_2',
      category: 'dots',
      label: '2',
      layer: 1,
      r: 4,
      c: 4,
      matched: false,
    };

    // When alone, baseTile is free
    expect(isTileSelectable(baseTile, [baseTile])).toBe(true);
    // When covered directly from above, baseTile is blocked
    expect(isTileSelectable(baseTile, [baseTile, coveringTile])).toBe(false);
  });

  it('detects when a tile is blocked on both left and right sides', () => {
    const center: TilePos = {
      id: 't-c',
      type: 'bam_1',
      category: 'bamboo',
      label: '1',
      layer: 0,
      r: 2,
      c: 4,
      matched: false,
    };
    const left: TilePos = {
      id: 't-l',
      type: 'bam_2',
      category: 'bamboo',
      label: '2',
      layer: 0,
      r: 2,
      c: 2,
      matched: false,
    };
    const right: TilePos = {
      id: 't-r',
      type: 'bam_3',
      category: 'bamboo',
      label: '3',
      layer: 0,
      r: 2,
      c: 6,
      matched: false,
    };

    // Open on right (left only)
    expect(isTileSelectable(center, [center, left])).toBe(true);
    // Blocked on both left and right
    expect(isTileSelectable(center, [center, left, right])).toBe(false);
  });
});
