import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { PUZZLES } from './ChessPuzzles';

describe('ChessPuzzles Validation', () => {
  it('contains verified tactical puzzles with valid FEN and legal solution lines', () => {
    expect(PUZZLES.length).toBeGreaterThanOrEqual(10);

    PUZZLES.forEach((puzzle) => {
      const game = new Chess(puzzle.fen);
      expect(game).toBeDefined();

      // Play through each move in the solution line
      puzzle.moves.forEach((moveStr) => {
        const moveResult = game.move(moveStr);
        expect(moveResult, `Move "${moveStr}" in puzzle "${puzzle.name}" should be legal`).not.toBeNull();
      });
    });
  });

  it('verifies that each puzzle has a non-empty explanation and theme', () => {
    PUZZLES.forEach((puzzle) => {
      expect(puzzle.name.length).toBeGreaterThan(0);
      expect(puzzle.tacticalTheme.length).toBeGreaterThan(0);
      expect(puzzle.explanation.length).toBeGreaterThan(10);
    });
  });
});
