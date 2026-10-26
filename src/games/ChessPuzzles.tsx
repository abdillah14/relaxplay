import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess, Square } from 'chess.js';
import { 
  ArrowLeft, RotateCcw, Lightbulb, Volume2, VolumeX, 
  HelpCircle, Sparkles, CheckCircle2, ChevronRight, RefreshCw, 
  Bot, Users, Trophy, Play 
} from 'lucide-react';
import { NeonButton } from '../components/NeonButton';
import { ResultsModal } from '../components/ResultsModal';
import { storage } from '../services/storageService';
import { sound } from '../services/soundService';
import { Difficulty, GameResult } from '../types';

export interface TacticalPuzzle {
  id: string;
  name: string;
  difficulty: Difficulty;
  fen: string;
  orientation: 'w' | 'b';
  turnDescription: string;
  tacticalTheme: string;
  moves: string[]; // SAN moves sequence: [userMove1, botReply1, userMove2, ...]
  explanation: string;
}

export const PUZZLES: TacticalPuzzle[] = [
  // EASY: Mate in 1 & Simple Tactics
  {
    id: 'easy-1',
    name: "Scholar's Judgment",
    difficulty: 'easy',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4',
    orientation: 'w',
    turnDescription: 'White to move: Deliver instantaneous checkmate',
    tacticalTheme: 'Mate in 1',
    moves: ['Qxf7#'],
    explanation: 'The Queen strikes f7 with the Bishop defending, giving checkmate since the Black King has nowhere to run.',
  },
  {
    id: 'easy-2',
    name: 'Back Rank Collapse',
    difficulty: 'easy',
    fen: '6k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1',
    orientation: 'w',
    turnDescription: 'White to move: Punish the trapped King',
    tacticalTheme: 'Back Rank Mate',
    moves: ['Rb8#'],
    explanation: 'The pawn wall traps the enemy King on the back rank, leaving it helpless against the invading Rook.',
  },
  {
    id: 'easy-3',
    name: 'Smothered Leap',
    difficulty: 'easy',
    fen: '6rk/6pp/7N/8/8/8/8/7K w - - 0 1',
    orientation: 'w',
    turnDescription: 'White to move: Royal knight checkmate',
    tacticalTheme: 'Smothered Mate',
    moves: ['Nf7#'],
    explanation: 'The Knight leaps to f7 delivering mate because the Black King is suffocated by its own friendly Rook and pawns.',
  },
  {
    id: 'easy-4',
    name: "Boden's Diagonal",
    difficulty: 'easy',
    fen: '2kr3r/ppp2ppp/8/2b1P3/4p1b1/8/PPP2PPP/R1B1KB1R b KQ - 0 11',
    orientation: 'b',
    turnDescription: 'Black to move: Infiltrate the baseline',
    tacticalTheme: 'Baseline Infiltration',
    moves: ['Rd1#'],
    explanation: 'The Black Rook strikes d1 while the Bishop cuts off the flight square on e2, sealing victory.',
  },
  {
    id: 'easy-5',
    name: 'Opera Pin Crusher',
    difficulty: 'easy',
    fen: '4kb1r/p2n1ppp/8/1B2p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 1',
    orientation: 'w',
    turnDescription: 'White to move: Capitalize on the absolute pin',
    tacticalTheme: 'Absolute Pin',
    moves: ['Bxd7#'],
    explanation: 'The Knight on d7 is pinned to the King, allowing the Bishop to capture it with inescapable checkmate.',
  },

  // NORMAL: Mate in 2 & Discovered Tactics
  {
    id: 'normal-1',
    name: 'Smothered Queen Sacrifice',
    difficulty: 'normal',
    fen: '6k1/5Npp/8/8/8/8/5PPP/4Q1K1 w - - 0 1',
    orientation: 'w',
    turnDescription: 'White to move: Force the decisive finish',
    tacticalTheme: 'Deflection & Mate',
    moves: ['Qe8#'],
    explanation: 'White infiltrates with the Queen; the Knight cuts off the escape to f8, finishing the contest.',
  },
  {
    id: 'normal-2',
    name: 'Greek Gift Knockout',
    difficulty: 'normal',
    fen: 'r1bq1rk1/ppp2ppp/2n5/3np3/8/3B1N2/PPP2PPP/RNBQ1RK1 w - - 0 1',
    orientation: 'w',
    turnDescription: 'White to move: Shatter the kingside fortress',
    tacticalTheme: 'Greek Gift Sacrifice',
    moves: ['Bxh7+', 'Kxh7', 'Ng5+'],
    explanation: 'Sacrificing the bishop on h7 tears open Black’s pawn shield and unleashes a fatal Knight and Queen assault.',
  },
  {
    id: 'normal-3',
    name: 'Morphy Corridor',
    difficulty: 'normal',
    fen: 'r1b2rk1/2p2ppp/p7/1p6/3P3q/1BP2Pb1/PP4P1/RNBQR1K1 b - - 0 1',
    orientation: 'b',
    turnDescription: 'Black to move: Relentless offensive sequence',
    tacticalTheme: 'King Hunt',
    moves: ['Qh2+', 'Kf1', 'Qh1+', 'Ke2', 'Qxg2+'],
    explanation: 'Black drives the White King out of safety with successive tempo checks, clearing the defending pawns.',
  },
  {
    id: 'normal-4',
    name: 'Deflection Decoy',
    difficulty: 'normal',
    fen: '3r2k1/p4ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
    orientation: 'w',
    turnDescription: 'White to move: Trade off or strike',
    tacticalTheme: 'Back Rank Control',
    moves: ['Rxd8#'],
    explanation: 'Exchanging rooks on the back rank proves instantly lethal because the enemy king has no luft (breathing room).',
  },

  // HARD: Multi-move Masterpieces
  {
    id: 'hard-1',
    name: 'The Immortal Opera Combo',
    difficulty: 'hard',
    fen: '4kb1r/p2rqppp/5n2/1B2p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 14',
    orientation: 'w',
    turnDescription: 'White to move: Paul Morphy’s legendary sequence',
    tacticalTheme: 'Queen Sacrifice & Double Rook Checkmate',
    moves: ['Bxd7+', 'Nxd7', 'Qb8+', 'Nxb8', 'Rd8#'],
    explanation: 'White gives up the Queen to deflect the defending Knight away from d8, delivering the immortal baseline checkmate.',
  },
  {
    id: 'hard-2',
    name: 'Blackburne Bishop Barrage',
    difficulty: 'hard',
    fen: 'r1b2rk1/2p2ppp/p7/1p6/3P3q/1BP2Pb1/PP4P1/RNBQR1K1 b - - 0 1',
    orientation: 'b',
    turnDescription: 'Black to move: Precision tactical attack',
    tacticalTheme: 'Decisive King Pursuit',
    moves: ['Qh2+', 'Kf1', 'Qh1+', 'Ke2', 'Qxg2+'],
    explanation: 'Coordinating the Queen and Bishop to dismantle the White King’s defenses with checking tempos.',
  },
];

// Vector piece renderer
const ChessPieceView: React.FC<{ type: string; color: 'w' | 'b' }> = ({ type, color }) => {
  const isWhite = color === 'w';
  const pieceColor = isWhite 
    ? 'text-[#56E6D0] drop-shadow-[0_0_8px_rgba(86,230,208,0.7)]' 
    : 'text-[#FF758F] drop-shadow-[0_0_8px_rgba(255,117,143,0.5)]';

  const symbols: Record<string, string> = {
    k: '♚',
    q: '♛',
    r: '♜',
    b: '♝',
    n: '♞',
    p: '♟',
  };

  return (
    <span className={`text-2xl sm:text-4xl font-serif select-none transition-transform hover:scale-110 ${pieceColor}`}>
      {symbols[type.toLowerCase()] || ''}
    </span>
  );
};

// Simple heuristic bot evaluator for Practice Board
function getBestBotMove(game: Chess): string | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  const pieceValues: Record<string, number> = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000,
  };

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const m of moves) {
    let moveScore = 0;
    // Capture bonus
    if (m.captured) {
      const capturedVal = pieceValues[m.captured] || 100;
      const pieceVal = pieceValues[m.piece] || 100;
      moveScore += capturedVal * 10 - pieceVal;
    }
    // Check bonus
    if (m.san.includes('+')) moveScore += 50;
    if (m.san.includes('#')) moveScore += 10000;
    // Center control bonus
    if (['d4', 'd5', 'e4', 'e5'].includes(m.to)) moveScore += 20;

    // Small random noise to vary openings
    moveScore += Math.random() * 15;

    if (moveScore > bestScore) {
      bestScore = moveScore;
      bestMove = m;
    }
  }

  return bestMove.san;
}

interface ChessPuzzlesProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const ChessPuzzles: React.FC<ChessPuzzlesProps> = ({
  soundEnabled,
  onToggleSound,
}) => {
  const navigate = useNavigate();

  // Mode: 'practice' (interactive chessboard) or 'puzzle' (tactical challenges)
  const [activeTab, setActiveTab] = useState<'practice' | 'puzzle'>('practice');

  // Common Board State
  const [chess, setChess] = useState<Chess>(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [flipBoard, setFlipBoard] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [isGameOverModal, setIsGameOverModal] = useState<boolean>(false);

  // Practice Board state
  const [practiceOpponent, setPracticeOpponent] = useState<'bot' | 'pass'>('bot');
  const [moveHistorySAN, setMoveHistorySAN] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string } | null>(null);

  // Puzzle Mode state
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [puzzleIndex, setPuzzleIndex] = useState<number>(0);
  const [currentMoveStep, setCurrentMoveStep] = useState<number>(0);
  const [hintStep, setHintStep] = useState<number>(0);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [isWrongMove, setIsWrongMove] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);

  // Filter puzzles
  const filteredPuzzles = useMemo(() => {
    return PUZZLES.filter((p) => p.difficulty === difficulty);
  }, [difficulty]);

  const activePuzzle = useMemo(() => {
    return filteredPuzzles[puzzleIndex % filteredPuzzles.length];
  }, [filteredPuzzles, puzzleIndex]);

  // Reset Practice Board
  const startNewPracticeGame = useCallback(() => {
    const newGame = new Chess();
    setChess(newGame);
    setSelectedSquare(null);
    setMoveHistorySAN([]);
    setHistoryIndex(-1);
    setPromotionPending(null);
    setIsGameOverModal(false);
    sound.playClick();
  }, []);

  // Load Puzzle
  const loadPuzzle = useCallback((p: TacticalPuzzle) => {
    const game = new Chess(p.fen);
    setChess(game);
    setCurrentMoveStep(0);
    setSelectedSquare(null);
    setHintStep(0);
    setIsSolved(false);
    setIsWrongMove(false);
    setFlipBoard(p.orientation === 'b');
  }, []);

  // Switch tabs
  const handleTabSwitch = (tab: 'practice' | 'puzzle') => {
    setActiveTab(tab);
    setSelectedSquare(null);
    if (tab === 'practice') {
      startNewPracticeGame();
    } else {
      loadPuzzle(activePuzzle);
    }
  };

  useEffect(() => {
    if (activeTab === 'puzzle' && activePuzzle) {
      loadPuzzle(activePuzzle);
    }
  }, [activeTab, activePuzzle, loadPuzzle]);

  // Legal moves from selected square
  const legalDestinationSquares = useMemo(() => {
    if (!selectedSquare) return [];
    try {
      const moves = chess.moves({ square: selectedSquare as Square, verbose: true });
      return moves.map((m) => m.to);
    } catch {
      return [];
    }
  }, [chess, selectedSquare]);

  // Execute Move on Practice Board
  const executePracticeMove = (from: string, to: string, promotion: string = 'q') => {
    try {
      const move = chess.move({
        from: from as Square,
        to: to as Square,
        promotion,
      });

      if (!move) {
        sound.playMismatch();
        setSelectedSquare(null);
        return;
      }

      // Play appropriate sound
      if (move.captured) {
        sound.playChessCapture();
      } else if (move.san.includes('+')) {
        sound.playChessCheck();
      } else {
        sound.playChessMove();
      }

      const updatedSAN = [...moveHistorySAN, move.san];
      setMoveHistorySAN(updatedSAN);
      setHistoryIndex(updatedSAN.length - 1);
      setSelectedSquare(null);
      setPromotionPending(null);

      // Check game over
      if (chess.isGameOver()) {
        sound.playVictory();
        return;
      }

      // If playing vs Bot and it's Black's turn
      if (practiceOpponent === 'bot' && chess.turn() === 'b') {
        setTimeout(() => {
          const botSAN = getBestBotMove(chess);
          if (botSAN) {
            const botMove = chess.move(botSAN);
            if (botMove) {
              if (botMove.captured) sound.playChessCapture();
              else if (botMove.san.includes('+')) sound.playChessCheck();
              else sound.playChessMove();

              setMoveHistorySAN((prev) => [...prev, botMove.san]);
              setChess(new Chess(chess.fen()));
            }
          }
        }, 500);
      }
    } catch {
      setSelectedSquare(null);
    }
  };

  // Square Click Handler
  const handleSquareClick = (square: string) => {
    if (activeTab === 'practice') {
      if (chess.isGameOver()) return;

      const piece = chess.get(square as Square);

      // Select friendly piece
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);
        sound.playTileSelect();
        return;
      }

      // Move selected piece
      if (selectedSquare) {
        // Check for pawn promotion (rank 7 to 8 for white, rank 2 to 1 for black)
        const movingPiece = chess.get(selectedSquare as Square);
        if (
          movingPiece &&
          movingPiece.type === 'p' &&
          ((movingPiece.color === 'w' && square[1] === '8') ||
            (movingPiece.color === 'b' && square[1] === '1'))
        ) {
          setPromotionPending({ from: selectedSquare, to: square });
          return;
        }

        executePracticeMove(selectedSquare, square);
      }
      return;
    }

    // PUZZLE MODE
    if (isSolved) return;
    const piece = chess.get(square as Square);

    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(square);
      sound.playTileSelect();
      return;
    }

    if (selectedSquare) {
      try {
        const attemptedMove = chess.move({
          from: selectedSquare as Square,
          to: square as Square,
          promotion: 'q',
        });

        if (!attemptedMove) {
          sound.playMismatch();
          setSelectedSquare(null);
          return;
        }

        const attemptedSAN = attemptedMove.san;
        const targetSAN = activePuzzle.moves[currentMoveStep];

        // Check if matching expected solution
        if (
          attemptedSAN === targetSAN ||
          attemptedSAN.replace('+', '').replace('#', '') ===
            targetSAN.replace('+', '').replace('#', '')
        ) {
          sound.playChessMove();
          const nextStep = currentMoveStep + 1;
          setCurrentMoveStep(nextStep);
          setSelectedSquare(null);
          setIsWrongMove(false);

          if (nextStep >= activePuzzle.moves.length) {
            setIsSolved(true);
            setStreak((s) => s + 1);
            sound.playVictory();

            const recorded = storage.recordGameResult({
              gameId: 'chess-puzzles',
              difficulty,
              score: (streak + 1) * 150,
              elapsedSeconds: 0,
              isCompleted: true,
              stats: {
                puzzlesSolved: streak + 1,
                streak: streak + 1,
              },
            });
            setLastResult(recorded.result);
          } else {
            // Opponent forced reply
            const botSAN = activePuzzle.moves[nextStep];
            setTimeout(() => {
              chess.move(botSAN);
              setChess(new Chess(chess.fen()));
              setCurrentMoveStep(nextStep + 1);
              sound.playChessCapture();
            }, 450);
          }
        } else {
          // Wrong move
          sound.playMismatch();
          setIsWrongMove(true);
          setTimeout(() => {
            chess.undo();
            setChess(new Chess(chess.fen()));
            setSelectedSquare(null);
          }, 600);
        }
      } catch {
        setSelectedSquare(null);
      }
    }
  };

  // Undo move in practice mode
  const handleUndoPracticeMove = () => {
    if (moveHistorySAN.length === 0) return;
    chess.undo();
    if (practiceOpponent === 'bot' && chess.turn() === 'b') {
      chess.undo(); // undo bot move too
    }
    setChess(new Chess(chess.fen()));
    setMoveHistorySAN((prev) => prev.slice(0, practiceOpponent === 'bot' ? -2 : -1));
    setSelectedSquare(null);
    sound.playCardFlip();
  };

  // Hint in puzzle mode
  const handlePuzzleHint = () => {
    setHintStep((h) => Math.min(2, h + 1));
    sound.playClick();
  };

  const expectedMoveSAN = activePuzzle?.moves[currentMoveStep];
  const hintInfo = useMemo(() => {
    if (hintStep === 0 || !expectedMoveSAN) return null;
    try {
      const tempGame = new Chess(chess.fen());
      const moveObj = tempGame.move(expectedMoveSAN);
      if (!moveObj) return null;
      return { from: moveObj.from, to: moveObj.to };
    } catch {
      return null;
    }
  }, [chess, expectedMoveSAN, hintStep]);

  // Board coordinates generator
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const displayFiles = flipBoard ? [...files].reverse() : files;
  const displayRanks = flipBoard ? [...ranks].reverse() : ranks;

  const isCheck = chess.inCheck();
  const isCheckmate = chess.isCheckmate();
  const isDraw = chess.isDraw();

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-6 py-4 flex flex-col items-center">
      {/* Top Header & Navigation */}
      <div className="w-full flex items-center justify-between gap-3 mb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#91A7BF] hover:text-[#56E6D0] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Game Hub</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Main Mode Tabs */}
          <div className="flex bg-[#102238] p-1 rounded-xl border border-[rgba(130,180,220,0.18)]">
            <button
              onClick={() => handleTabSwitch('practice')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'practice'
                  ? 'bg-[#56E6D0] text-[#07111F] shadow-[0_0_12px_rgba(86,230,208,0.4)]'
                  : 'text-[#91A7BF] hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Practice Board
            </button>
            <button
              onClick={() => handleTabSwitch('puzzle')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'puzzle'
                  ? 'bg-[#56E6D0] text-[#07111F] shadow-[0_0_12px_rgba(86,230,208,0.4)]'
                  : 'text-[#91A7BF] hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Tactical Puzzles
            </button>
          </div>

          <button
            onClick={() => setShowRules(true)}
            className="p-2 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.18)] text-[#91A7BF] hover:text-[#56E6D0]"
            title="Rules"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.18)] text-[#91A7BF] hover:text-[#56E6D0]"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>
        </div>
      </div>

      {/* Mode Status Banner */}
      {activeTab === 'practice' ? (
        <div className="w-full bg-[#102238] border border-[rgba(130,180,220,0.16)] rounded-2xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${chess.turn() === 'w' ? 'bg-[#56E6D0]' : 'bg-[#FF758F]'}`} />
              <span className="text-sm font-bold text-[#F1F7FF]">
                {isCheckmate
                  ? `Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins.`
                  : isDraw
                  ? 'Game Drawn (Stalemate / 50 Moves)'
                  : isCheck
                  ? `${chess.turn() === 'w' ? 'White' : 'Black'} is in Check!`
                  : `${chess.turn() === 'w' ? 'White' : 'Black'} to move`}
              </span>
            </div>

            {/* Opponent Selector */}
            <div className="flex bg-[#0b1728] p-0.5 rounded-lg border border-[rgba(130,180,220,0.12)]">
              <button
                onClick={() => setPracticeOpponent('bot')}
                className={`px-2 py-0.5 text-[11px] rounded flex items-center gap-1 ${
                  practiceOpponent === 'bot' ? 'bg-[#56E6D0] text-[#07111F] font-bold' : 'text-[#91A7BF]'
                }`}
              >
                <Bot className="w-3 h-3" /> vs Computer
              </button>
              <button
                onClick={() => setPracticeOpponent('pass')}
                className={`px-2 py-0.5 text-[11px] rounded flex items-center gap-1 ${
                  practiceOpponent === 'pass' ? 'bg-[#56E6D0] text-[#07111F] font-bold' : 'text-[#91A7BF]'
                }`}
              >
                <Users className="w-3 h-3" /> Pass & Play
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFlipBoard((f) => !f)}
              className="p-2 rounded-xl bg-[#0a1727] border border-[rgba(130,180,220,0.14)] text-[#91A7BF] hover:text-[#56E6D0]"
              title="Flip Board"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <NeonButton variant="ghost" size="sm" onClick={handleUndoPracticeMove} disabled={moveHistorySAN.length === 0}>
              Back
            </NeonButton>
            <NeonButton variant="cyan" size="sm" onClick={startNewPracticeGame}>
              Restart
            </NeonButton>
          </div>
        </div>
      ) : (
        <div className="w-full bg-[#102238] border border-[rgba(130,180,220,0.16)] rounded-2xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-[#56E6D0]/20 text-[#56E6D0] font-bold">
                {activePuzzle.tacticalTheme}
              </span>
              <span className="text-sm font-bold text-[#F1F7FF]">{activePuzzle.name}</span>
            </div>
            <p className="text-xs text-[#91A7BF]">{activePuzzle.turnDescription}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-[#0a1727] border border-[rgba(130,180,220,0.14)] text-center">
              <span className="text-[10px] text-[#91A7BF] block">Streak</span>
              <span className="text-sm font-bold font-mono text-[#FFB454]">{streak} 🔥</span>
            </div>

            {/* Difficulty selector */}
            <div className="flex bg-[#0a1727] p-1 rounded-xl border border-[rgba(130,180,220,0.14)]">
              {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDifficulty(d);
                    setPuzzleIndex(0);
                  }}
                  className={`px-2 py-0.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                    difficulty === d ? 'bg-[#56E6D0] text-[#07111F]' : 'text-[#91A7BF]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <button
              onClick={() => setFlipBoard((f) => !f)}
              className="p-2 rounded-xl bg-[#0a1727] border border-[rgba(130,180,220,0.14)] text-[#91A7BF] hover:text-[#56E6D0]"
              title="Flip Board"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Solved / Wrong Move Banners */}
      {activeTab === 'puzzle' && isWrongMove && (
        <div className="w-full mb-3 p-3 rounded-xl bg-[#FF6B8B]/15 border border-[#FF6B8B]/40 text-xs sm:text-sm text-[#FF6B8B] text-center animate-shake">
          Incorrect move. That doesn't exploit the tactical flaw. Resetting position...
        </div>
      )}

      {activeTab === 'puzzle' && isSolved && (
        <div className="w-full mb-4 p-4 rounded-xl bg-[#56E6D0]/15 border border-[#56E6D0]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-[#56E6D0]">
              <CheckCircle2 className="w-4 h-4" />
              Puzzle Solved!
            </div>
            <p className="text-xs text-[#E2EDF8] leading-relaxed">
              {activePuzzle.explanation}
            </p>
          </div>
          <NeonButton
            variant="cyan"
            size="sm"
            onClick={() => {
              setPuzzleIndex((prev) => (prev + 1) % filteredPuzzles.length);
              sound.playClick();
            }}
            icon={<ChevronRight className="w-4 h-4" />}
          >
            Next Puzzle
          </NeonButton>
        </div>
      )}

      {/* 8x8 Chessboard */}
      <div className="relative p-2 sm:p-4 rounded-2xl bg-[#0a1524] border border-[rgba(130,180,220,0.2)] shadow-[0_12px_40px_rgba(0,0,0,0.6)] mb-4">
        <div className="grid grid-cols-8 grid-rows-8 border border-[#1b3452] rounded-lg overflow-hidden">
          {displayRanks.map((rank, rIdx) =>
            displayFiles.map((file, fIdx) => {
              const square = `${file}${rank}`;
              const piece = chess.get(square as Square);
              const isDarkSquare = (rIdx + fIdx) % 2 === 1;
              const isSelected = selectedSquare === square;
              const isLegalTarget = legalDestinationSquares.includes(square as Square);
              const isHintFrom = hintStep >= 1 && hintInfo?.from === square;
              const isHintTo = hintStep >= 2 && hintInfo?.to === square;
              const isKingInCheck =
                piece && piece.type === 'k' && piece.color === chess.turn() && chess.inCheck();

              return (
                <button
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  className={`w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center relative transition-all duration-150 cursor-pointer select-none
                    ${isDarkSquare ? 'bg-[#10233b]' : 'bg-[#183457]'}
                    ${isSelected ? '!bg-[#245287] ring-2 ring-[#56E6D0] z-20' : ''}
                    ${isHintFrom ? 'ring-2 ring-[#FFB454] !bg-[#363e26]' : ''}
                    ${isHintTo ? 'ring-2 ring-[#67E8A5] !bg-[#214738]' : ''}
                    ${isKingInCheck ? 'ring-2 ring-red-500 !bg-red-950/60 animate-pulse' : ''}
                  `}
                >
                  {/* Square coordinate indicators */}
                  {fIdx === 0 && (
                    <span className="absolute top-0.5 left-1 text-[9px] font-mono text-[#4b6d94] select-none pointer-events-none">
                      {rank}
                    </span>
                  )}
                  {rIdx === 7 && (
                    <span className="absolute bottom-0.5 right-1 text-[9px] font-mono text-[#4b6d94] select-none pointer-events-none">
                      {file}
                    </span>
                  )}

                  {/* Piece */}
                  {piece && (
                    <ChessPieceView type={piece.type} color={piece.color} />
                  )}

                  {/* Legal move indicator dot */}
                  {isLegalTarget && (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#56E6D0]/70 ring-2 ring-[#56E6D0] shadow-[0_0_8px_rgba(86,230,208,0.8)] pointer-events-none" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Pawn Promotion Modal */}
      {promotionPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07111F]/80 backdrop-blur-md">
          <div className="bg-[#102238] border border-[rgba(130,180,220,0.25)] rounded-2xl p-5 text-center space-y-4">
            <h4 className="text-sm font-bold text-[#56E6D0]">Promote Pawn</h4>
            <div className="flex gap-3 justify-center">
              {['q', 'r', 'b', 'n'].map((p) => (
                <button
                  key={p}
                  onClick={() => executePracticeMove(promotionPending.from, promotionPending.to, p)}
                  className="w-14 h-14 rounded-xl bg-[#0a1727] border border-[#2b517d] flex items-center justify-center text-3xl hover:border-[#56E6D0] transition-colors"
                >
                  <ChessPieceView type={p} color={chess.turn()} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Move History for Practice Board */}
      {activeTab === 'practice' && (
        <div className="w-full max-w-lg bg-[#0a1727] border border-[rgba(130,180,220,0.14)] rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between text-xs text-[#91A7BF] mb-1.5 font-mono">
            <span>Move History</span>
            <span>{moveHistorySAN.length} half-moves</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto font-mono text-xs">
            {moveHistorySAN.length === 0 ? (
              <span className="text-[#5e7794] text-xs">No moves yet. White moves first.</span>
            ) : (
              moveHistorySAN.map((san, idx) => (
                <span
                  key={idx}
                  className={`px-1.5 py-0.5 rounded text-xs ${
                    idx % 2 === 0 ? 'text-[#56E6D0] bg-[#102238]' : 'text-[#FF758F] bg-[#161c2e]'
                  }`}
                >
                  {idx % 2 === 0 ? `${Math.floor(idx / 2) + 1}. ` : ''}
                  {san}
                </span>
              ))
            )}
          </div>
        </div>
      )}

      {/* Puzzle Controls */}
      {activeTab === 'puzzle' && (
        <div className="w-full flex items-center justify-between gap-2 max-w-lg">
          <NeonButton
            variant="ghost"
            size="sm"
            onClick={() => loadPuzzle(activePuzzle)}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Retry
          </NeonButton>
          <NeonButton
            variant="amber"
            size="sm"
            onClick={handlePuzzleHint}
            disabled={isSolved || hintStep >= 2}
            icon={<Lightbulb className="w-4 h-4" />}
          >
            {hintStep === 0 ? 'Hint: Show Piece' : 'Hint: Show Target'}
          </NeonButton>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07111F]/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#102238] border border-[rgba(130,180,220,0.22)] rounded-2xl p-6 text-left space-y-4">
            <h3 className="text-lg font-bold text-[#56E6D0] flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Chess & Tactics Rules
            </h3>
            <ul className="text-xs sm:text-sm text-[#91A7BF] space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#56E6D0] shrink-0 mt-0.5" />
                <span>
                  <strong>Practice Board:</strong> Play legal chess against the computer or pass-and-play with a friend. Full castling, promotion, and checkmate detection supported.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#56E6D0] shrink-0 mt-0.5" />
                <span>
                  <strong>Tactical Puzzles:</strong> Solve tactical positions including checkmates in 1 or 2 moves, deflection sacrifices, and forks.
                </span>
              </li>
            </ul>
            <div className="pt-2 text-right">
              <NeonButton variant="cyan" size="sm" onClick={() => setShowRules(false)}>
                Got It
              </NeonButton>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      <ResultsModal
        isOpen={isGameOverModal}
        gameTitle="Chess Tactics"
        result={lastResult}
        onPlayAgain={() => {
          setIsGameOverModal(false);
          if (activeTab === 'practice') startNewPracticeGame();
          else loadPuzzle(activePuzzle);
        }}
        onBackToHub={() => navigate('/')}
        onViewProgress={() => navigate('/progress')}
      />
    </div>
  );
};
