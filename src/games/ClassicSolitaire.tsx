import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, RotateCcw, Lightbulb, Volume2, VolumeX, 
  HelpCircle, Sparkles, CheckCircle2, FastForward, Trophy 
} from 'lucide-react';
import { NeonButton } from '../components/NeonButton';
import { ResultsModal } from '../components/ResultsModal';
import { storage } from '../services/storageService';
import { sound } from '../services/soundService';
import { GameResult } from '../types';
import { formatDuration } from '../utils/dates';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export interface Card {
  id: string;
  suit: Suit;
  rank: number; // 1 = Ace, 11 = Jack, 12 = Queen, 13 = King
  faceUp: boolean;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS: Record<Suit, 'red' | 'black'> = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black',
};

function getRankLabel(rank: number): string {
  if (rank === 1) return 'A';
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  return String(rank);
}

// Generate shuffled deck
function createDeck(): Card[] {
  const suits: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
  const deck: Card[] = [];
  suits.forEach((suit) => {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({
        id: `${suit}-${rank}-${Math.random().toString(36).substring(2, 6)}`,
        suit,
        rank,
        faceUp: false,
      });
    }
  });

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export interface SolitaireState {
  stock: Card[];
  waste: Card[];
  foundations: Card[][]; // 4 piles: 0..3 (Spades, Hearts, Clubs, Diamonds)
  tableau: Card[][];     // 7 columns: 0..6
}

function dealGame(): SolitaireState {
  const deck = createDeck();
  const tableau: Card[][] = [[], [], [], [], [], [], []];

  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = deck.pop()!;
      if (row === col) {
        card.faceUp = true;
      }
      tableau[col].push(card);
    }
  }

  return {
    stock: deck,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
  };
}

// Helper: Ensure top card of tableau column is turned face up when uncovered
function flipTopTableauCard(col: Card[]): Card[] {
  if (col.length === 0) return col;
  const lastIdx = col.length - 1;
  const lastCard = col[lastIdx];
  if (!lastCard.faceUp) {
    const updated = [...col];
    updated[lastIdx] = { ...lastCard, faceUp: true };
    return updated;
  }
  return col;
}

// Rule check: can card place on tableau column?
// Tableau rule: descending rank, alternating color; or King (13) on empty column
export function canPlaceOnTableau(card: Card, column: Card[]): boolean {
  if (column.length === 0) {
    return card.rank === 13; // Only Kings can start an empty column
  }
  const topCard = column[column.length - 1];
  if (!topCard.faceUp) return false;
  const isOppositeColor = SUIT_COLORS[card.suit] !== SUIT_COLORS[topCard.suit];
  const isOneLower = card.rank === topCard.rank - 1;
  return isOppositeColor && isOneLower;
}

// Rule check: can card place on foundation pile?
// Foundation rule: same suit, ascending rank from Ace (1) to King (13)
export function canPlaceOnFoundation(card: Card, foundationPile: Card[]): boolean {
  if (foundationPile.length === 0) {
    return card.rank === 1; // Must start with Ace
  }
  const topCard = foundationPile[foundationPile.length - 1];
  return card.suit === topCard.suit && card.rank === topCard.rank + 1;
}

// Visual Card Component
export const CardView: React.FC<{
  card: Card;
  isSelected?: boolean;
  isHinted?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  style?: React.CSSProperties;
}> = ({ card, isSelected, isHinted, onClick, onDoubleClick, onDragStart, style }) => {
  const isRed = SUIT_COLORS[card.suit] === 'red';

  if (!card.faceUp) {
    return (
      <div
        onClick={onClick}
        style={style}
        className="w-11 sm:w-16 h-16 sm:h-24 rounded-lg bg-gradient-to-br from-[#12243a] to-[#0a1524] border border-[#23456b] shadow-md flex items-center justify-center select-none cursor-pointer hover:border-[#56E6D0]/60 transition-all duration-150 relative overflow-hidden"
      >
        <div className="w-6 sm:w-9 h-10 sm:h-16 rounded border border-[#2b517d]/60 bg-[#162a42]/40 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#56E6D0]/30" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      draggable={card.faceUp}
      onDragStart={onDragStart}
      style={style}
      className={`w-11 sm:w-16 h-16 sm:h-24 rounded-lg bg-[#14263e] border shadow-md flex flex-col justify-between p-1 sm:p-1.5 select-none cursor-grab active:cursor-grabbing transition-all duration-150 relative font-mono
        ${isRed ? 'text-[#FF6B8B] border-[#442335]' : 'text-[#56E6D0] border-[#1d435f]'}
        ${isSelected ? 'ring-2 ring-[#FFB454] -translate-y-2 !border-[#FFB454] shadow-[0_0_15px_rgba(255,180,84,0.5)] z-40' : 'hover:border-[#56E6D0]/70'}
        ${isHinted ? 'ring-2 ring-[#67E8A5] animate-pulse !border-[#67E8A5] shadow-[0_0_15px_rgba(103,232,165,0.6)] z-30' : ''}
      `}
    >
      {/* Top rank & suit */}
      <div className="flex items-center gap-0.5 leading-none pointer-events-none">
        <span className="text-xs sm:text-sm font-bold">{getRankLabel(card.rank)}</span>
        <span className="text-[10px] sm:text-xs">{SUIT_SYMBOLS[card.suit]}</span>
      </div>

      {/* Center suit symbol */}
      <div className="self-center text-lg sm:text-2xl drop-shadow pointer-events-none">
        {SUIT_SYMBOLS[card.suit]}
      </div>

      {/* Bottom inverted rank & suit */}
      <div className="flex items-center justify-end gap-0.5 leading-none rotate-180 pointer-events-none">
        <span className="text-xs sm:text-sm font-bold">{getRankLabel(card.rank)}</span>
        <span className="text-[10px] sm:text-xs">{SUIT_SYMBOLS[card.suit]}</span>
      </div>
    </div>
  );
};

interface ClassicSolitaireProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const ClassicSolitaire: React.FC<ClassicSolitaireProps> = ({
  soundEnabled,
  onToggleSound,
}) => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<SolitaireState>(() => dealGame());
  const [history, setHistory] = useState<SolitaireState[]>([]);
  const [selectedCard, setSelectedCard] = useState<{
    card: Card;
    location: 'waste' | 'tableau' | 'foundation';
    columnIndex?: number;
    cardIndex?: number;
    foundationIndex?: number;
  } | null>(null);
  const [hintInfo, setHintInfo] = useState<{ cardId: string; targetNote: string } | null>(null);
  const [score, setScore] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsed, setElapsed] = useState<number>(0);
  const [drawMode, setDrawMode] = useState<1 | 3>(1);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [showRules, setShowRules] = useState<boolean>(false);

  // Timer
  useEffect(() => {
    if (isWon) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isWon]);

  // Push history snapshot before modifying state
  const pushHistory = useCallback(() => {
    setHistory((prev) => [
      ...prev.slice(-30),
      JSON.parse(JSON.stringify(gameState)),
    ]);
  }, [gameState]);

  // Restart
  const handleRestart = useCallback(() => {
    setGameState(dealGame());
    setHistory([]);
    setSelectedCard(null);
    setHintInfo(null);
    setScore(0);
    setMoves(0);
    setStartTime(Date.now());
    setElapsed(0);
    setIsWon(false);
    sound.playClick();
  }, []);

  // Total cards in foundations
  const totalInFoundations = useMemo(() => {
    return gameState.foundations.reduce((sum, pile) => sum + pile.length, 0);
  }, [gameState.foundations]);

  // Win condition check
  useEffect(() => {
    if (totalInFoundations === 52 && !isWon) {
      setIsWon(true);
      sound.playVictory();
      const recorded = storage.recordGameResult({
        gameId: 'classic-solitaire',
        difficulty: drawMode === 1 ? 'easy' : 'normal',
        score: score + 1000,
        elapsedSeconds: elapsed,
        isCompleted: true,
        stats: {
          cardsMoved: 52,
          foundationsCompleted: 4,
          moves,
        },
      });
      setLastResult(recorded.result);
    }
  }, [totalInFoundations, isWon, drawMode, score, elapsed, moves]);

  // Stock Draw Handler
  const handleDrawStock = () => {
    pushHistory();
    setHintInfo(null);
    setSelectedCard(null);

    if (gameState.stock.length === 0) {
      // Recycle waste pile back to stock
      if (gameState.waste.length === 0) return;
      const recycled = [...gameState.waste].reverse().map((c) => ({ ...c, faceUp: false }));
      setGameState((prev) => ({
        ...prev,
        stock: recycled,
        waste: [],
      }));
      sound.playCardFlip();
    } else {
      // Draw 1 or 3
      const drawCount = Math.min(drawMode, gameState.stock.length);
      const drawn = gameState.stock.slice(-drawCount).map((c) => ({ ...c, faceUp: true }));
      const remainingStock = gameState.stock.slice(0, -drawCount);

      setGameState((prev) => ({
        ...prev,
        stock: remainingStock,
        waste: [...prev.waste, ...drawn],
      }));
      setMoves((m) => m + 1);
      sound.playCardFlip();
    }
  };

  // Smart single-tap move (Waste -> Foundation/Tableau, Tableau -> Foundation)
  const trySmartMove = (card: Card, location: 'waste' | 'tableau', colIdx?: number): boolean => {
    // 1. Try foundations first (always priority)
    for (let f = 0; f < 4; f++) {
      if (canPlaceOnFoundation(card, gameState.foundations[f])) {
        pushHistory();
        if (location === 'waste') {
          setGameState((prev) => {
            const nextWaste = prev.waste.slice(0, -1);
            const nextFoundations = prev.foundations.map((pile, idx) =>
              idx === f ? [...pile, card] : pile
            );
            return { ...prev, waste: nextWaste, foundations: nextFoundations };
          });
        } else if (colIdx !== undefined) {
          setGameState((prev) => {
            const nextTableau = prev.tableau.map((col, idx) =>
              idx === colIdx ? flipTopTableauCard(col.slice(0, -1)) : col
            );
            const nextFoundations = prev.foundations.map((pile, idx) =>
              idx === f ? [...pile, card] : pile
            );
            return { ...prev, tableau: nextTableau, foundations: nextFoundations };
          });
        }
        setScore((s) => s + 10);
        setMoves((m) => m + 1);
        sound.playCardPlace();
        return true;
      }
    }

    // 2. Try tableau ONLY if card is coming from waste
    if (location === 'waste') {
      for (let t = 0; t < 7; t++) {
        if (canPlaceOnTableau(card, gameState.tableau[t])) {
          pushHistory();
          setGameState((prev) => {
            const nextWaste = prev.waste.slice(0, -1);
            const nextTableau = prev.tableau.map((col, idx) =>
              idx === t ? [...col, card] : col
            );
            return { ...prev, waste: nextWaste, tableau: nextTableau };
          });
          setScore((s) => s + 5);
          setMoves((m) => m + 1);
          sound.playCardPlace();
          return true;
        }
      }
    }

    return false;
  };

  // Double Click / Double Tap auto-move to Foundation
  const handleCardDoubleClick = (
    card: Card,
    location: 'waste' | 'tableau',
    columnIndex?: number
  ) => {
    if (!card.faceUp) return;
    for (let f = 0; f < 4; f++) {
      if (canPlaceOnFoundation(card, gameState.foundations[f])) {
        trySmartMove(card, location, columnIndex);
        return;
      }
    }
  };

  // Card click handler
  const handleCardClick = (
    card: Card,
    location: 'waste' | 'tableau',
    columnIndex?: number,
    cardIndex?: number
  ) => {
    // If player taps a face-down card at the top of a column, reveal it
    if (!card.faceUp) {
      if (location === 'tableau' && columnIndex !== undefined) {
        const col = gameState.tableau[columnIndex];
        if (col.length > 0 && col[col.length - 1].id === card.id) {
          pushHistory();
          setGameState((prev) => ({
            ...prev,
            tableau: prev.tableau.map((c, i) =>
              i === columnIndex ? flipTopTableauCard(c) : c
            ),
          }));
          sound.playCardFlip();
        }
      }
      return;
    }
    setHintInfo(null);

    // If a card was already selected, try to place it on this clicked column
    if (selectedCard) {
      if (selectedCard.card.id === card.id) {
        // Deselect
        setSelectedCard(null);
        return;
      }

      // Try placing selected onto this clicked card's column (if in tableau)
      if (location === 'tableau' && columnIndex !== undefined) {
        const targetCol = gameState.tableau[columnIndex];
        if (canPlaceOnTableau(selectedCard.card, targetCol)) {
          executeMoveToTableau(columnIndex);
          return;
        }
      }

      // If cannot place, select this card instead
      setSelectedCard({ card, location, columnIndex, cardIndex });
      sound.playTileSelect();
      return;
    }

    // Attempt smart move to foundation first
    const moved = trySmartMove(card, location, columnIndex);
    if (!moved) {
      // Select for manual target placement
      setSelectedCard({ card, location, columnIndex, cardIndex });
      sound.playTileSelect();
    }
  };

  // Place selected stack on tableau column
  const executeMoveToTableau = (targetColIdx: number) => {
    if (!selectedCard) return;
    pushHistory();

    const card = selectedCard.card;
    if (selectedCard.location === 'waste') {
      setGameState((prev) => {
        const nextWaste = prev.waste.slice(0, -1);
        const nextTableau = prev.tableau.map((col, idx) =>
          idx === targetColIdx ? [...col, card] : col
        );
        return { ...prev, waste: nextWaste, tableau: nextTableau };
      });
    } else if (selectedCard.location === 'foundation' && selectedCard.foundationIndex !== undefined) {
      // Move from foundation back to tableau
      const fIdx = selectedCard.foundationIndex;
      setGameState((prev) => {
        const nextFoundations = prev.foundations.map((pile, idx) =>
          idx === fIdx ? pile.slice(0, -1) : pile
        );
        const nextTableau = prev.tableau.map((col, idx) =>
          idx === targetColIdx ? [...col, card] : col
        );
        return { ...prev, foundations: nextFoundations, tableau: nextTableau };
      });
      setScore((s) => Math.max(0, s - 15));
    } else if (selectedCard.columnIndex !== undefined) {
      const sourceColIdx = selectedCard.columnIndex;
      const sourceCol = gameState.tableau[sourceColIdx];
      const cardIdx = sourceCol.findIndex((c) => c.id === card.id);
      const movingStack = sourceCol.slice(cardIdx);
      const remaining = flipTopTableauCard(sourceCol.slice(0, cardIdx));

      setGameState((prev) => {
        const nextTableau = prev.tableau.map((col, idx) => {
          if (idx === sourceColIdx) return remaining;
          if (idx === targetColIdx) return [...col, ...movingStack];
          return col;
        });
        return { ...prev, tableau: nextTableau };
      });
      setScore((s) => s + 5);
    }

    setMoves((m) => m + 1);
    setSelectedCard(null);
    sound.playCardPlace();
  };

  // Foundation click
  const handleFoundationClick = (foundationIdx: number) => {
    // If we have a selected card, try to place it on this foundation
    if (selectedCard) {
      const foundationPile = gameState.foundations[foundationIdx];
      if (canPlaceOnFoundation(selectedCard.card, foundationPile)) {
        pushHistory();
        const card = selectedCard.card;
        if (selectedCard.location === 'waste') {
          setGameState((prev) => {
            const nextWaste = prev.waste.slice(0, -1);
            const nextFoundations = prev.foundations.map((p, idx) =>
              idx === foundationIdx ? [...p, card] : p
            );
            return { ...prev, waste: nextWaste, foundations: nextFoundations };
          });
        } else if (selectedCard.columnIndex !== undefined) {
          const sourceColIdx = selectedCard.columnIndex;
          setGameState((prev) => {
            const nextTableau = prev.tableau.map((col, idx) =>
              idx === sourceColIdx ? flipTopTableauCard(col.slice(0, -1)) : col
            );
            const nextFoundations = prev.foundations.map((p, idx) =>
              idx === foundationIdx ? [...p, card] : p
            );
            return { ...prev, tableau: nextTableau, foundations: nextFoundations };
          });
        }
        setScore((s) => s + 10);
        setMoves((m) => m + 1);
        setSelectedCard(null);
        sound.playCardPlace();
        return;
      }
    }

    // Otherwise, if this foundation has cards, select its top card so it can be moved back down to tableau
    const pile = gameState.foundations[foundationIdx];
    if (pile.length > 0) {
      const top = pile[pile.length - 1];
      setSelectedCard({
        card: top,
        location: 'foundation',
        foundationIndex: foundationIdx,
      });
      sound.playTileSelect();
    }
  };

  // Tableau empty space click
  const handleTableauEmptyClick = (colIdx: number) => {
    if (!selectedCard) return;
    if (selectedCard.card.rank === 13) {
      // King to empty column
      executeMoveToTableau(colIdx);
    }
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (
    e: React.DragEvent,
    card: Card,
    location: 'waste' | 'tableau',
    columnIndex?: number,
    cardIndex?: number
  ) => {
    if (!card.faceUp) return;
    setSelectedCard({ card, location, columnIndex, cardIndex });
    e.dataTransfer.setData('text/plain', card.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTableauDrop = (e: React.DragEvent, targetColIdx: number) => {
    e.preventDefault();
    if (!selectedCard) return;
    const targetCol = gameState.tableau[targetColIdx];
    if (canPlaceOnTableau(selectedCard.card, targetCol)) {
      executeMoveToTableau(targetColIdx);
    }
  };

  const handleFoundationDrop = (e: React.DragEvent, foundationIdx: number) => {
    e.preventDefault();
    if (!selectedCard) return;
    const pile = gameState.foundations[foundationIdx];
    if (canPlaceOnFoundation(selectedCard.card, pile)) {
      handleFoundationClick(foundationIdx);
    }
  };

  // Undo
  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setGameState(previous);
    setHistory((h) => h.slice(0, -1));
    setSelectedCard(null);
    setHintInfo(null);
    sound.playCardFlip();
  };

  // Hint
  const handleHint = () => {
    // 1. Check waste to foundation
    if (gameState.waste.length > 0) {
      const topWaste = gameState.waste[gameState.waste.length - 1];
      for (let f = 0; f < 4; f++) {
        if (canPlaceOnFoundation(topWaste, gameState.foundations[f])) {
          setHintInfo({ cardId: topWaste.id, targetNote: 'Move Waste card to Foundation' });
          sound.playClick();
          return;
        }
      }
    }

    // 2. Check tableau to foundation
    for (let c = 0; c < 7; c++) {
      const col = gameState.tableau[c];
      if (col.length > 0) {
        const top = col[col.length - 1];
        if (top.faceUp) {
          for (let f = 0; f < 4; f++) {
            if (canPlaceOnFoundation(top, gameState.foundations[f])) {
              setHintInfo({ cardId: top.id, targetNote: `Move ${top.rank} to Foundation` });
              sound.playClick();
              return;
            }
          }
        }
      }
    }

    // 3. Check waste to tableau
    if (gameState.waste.length > 0) {
      const topWaste = gameState.waste[gameState.waste.length - 1];
      for (let c = 0; c < 7; c++) {
        if (canPlaceOnTableau(topWaste, gameState.tableau[c])) {
          setHintInfo({ cardId: topWaste.id, targetNote: 'Move Waste card to Tableau' });
          sound.playClick();
          return;
        }
      }
    }

    // 4. Check tableau to tableau
    for (let c1 = 0; c1 < 7; c1++) {
      const col1 = gameState.tableau[c1];
      const firstFaceUpIdx = col1.findIndex((card) => card.faceUp);
      if (firstFaceUpIdx !== -1) {
        const card = col1[firstFaceUpIdx];
        for (let c2 = 0; c2 < 7; c2++) {
          if (c1 === c2) continue;
          if (canPlaceOnTableau(card, gameState.tableau[c2])) {
            setHintInfo({ cardId: card.id, targetNote: 'Move stack to another Tableau column' });
            sound.playClick();
            return;
          }
        }
      }
    }

    sound.playMismatch();
  };

  // Auto-complete if all remaining tableau cards are face-up
  const canAutoComplete = useMemo(() => {
    if (gameState.stock.length > 0 || gameState.waste.length > 0) return false;
    for (const col of gameState.tableau) {
      for (const card of col) {
        if (!card.faceUp) return false;
      }
    }
    return totalInFoundations < 52;
  }, [gameState, totalInFoundations]);

  const handleAutoComplete = () => {
    let current = { ...gameState };
    let moved = true;

    while (moved) {
      moved = false;
      for (let c = 0; c < 7; c++) {
        const col = current.tableau[c];
        if (col.length > 0) {
          const top = col[col.length - 1];
          for (let f = 0; f < 4; f++) {
            if (canPlaceOnFoundation(top, current.foundations[f])) {
              current.tableau[c] = col.slice(0, -1);
              current.foundations[f] = [...current.foundations[f], top];
              moved = true;
              break;
            }
          }
        }
        if (moved) break;
      }
    }

    setGameState({ ...current });
    sound.playSuccess();
  };

  // Visible waste cards (for Draw 3 horizontal fan)
  const visibleWaste = useMemo(() => {
    const len = gameState.waste.length;
    if (len === 0) return [];
    const count = drawMode === 3 ? Math.min(3, len) : 1;
    return gameState.waste.slice(len - count);
  }, [gameState.waste, drawMode]);

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-6 py-4 flex flex-col items-center">
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
          {/* Draw mode toggle */}
          <button
            onClick={() => {
              setDrawMode((prev) => (prev === 1 ? 3 : 1));
              handleRestart();
            }}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#102238] border border-[rgba(130,180,220,0.18)] text-[#91A7BF] hover:text-[#56E6D0]"
          >
            Draw {drawMode}
          </button>

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

      {/* Dashboard Stats */}
      <div className="w-full grid grid-cols-4 gap-2 sm:gap-3 mb-4">
        <div className="p-2 sm:p-3 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.14)] text-center">
          <span className="text-[10px] sm:text-xs text-[#91A7BF] block">Score</span>
          <span className="text-base sm:text-lg font-bold font-mono text-[#56E6D0] tabular-nums">
            {score}
          </span>
        </div>
        <div className="p-2 sm:p-3 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.14)] text-center">
          <span className="text-[10px] sm:text-xs text-[#91A7BF] block">Foundations</span>
          <span className="text-base sm:text-lg font-bold font-mono text-[#67E8A5] tabular-nums">
            {totalInFoundations} / 52
          </span>
        </div>
        <div className="p-2 sm:p-3 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.14)] text-center">
          <span className="text-[10px] sm:text-xs text-[#91A7BF] block">Moves</span>
          <span className="text-base sm:text-lg font-bold font-mono text-[#FFB454] tabular-nums">
            {moves}
          </span>
        </div>
        <div className="p-2 sm:p-3 rounded-xl bg-[#102238] border border-[rgba(130,180,220,0.14)] text-center">
          <span className="text-[10px] sm:text-xs text-[#91A7BF] block">Time</span>
          <span className="text-base sm:text-lg font-bold font-mono text-white tabular-nums">
            {formatDuration(elapsed)}
          </span>
        </div>
      </div>

      {/* Auto Complete banner if eligible */}
      {canAutoComplete && (
        <div className="w-full mb-3 p-3 rounded-xl bg-[#56E6D0]/15 border border-[#56E6D0]/40 flex items-center justify-between text-xs sm:text-sm text-[#56E6D0]">
          <span>All tableau cards are face-up! You can auto-finish.</span>
          <button
            onClick={handleAutoComplete}
            className="px-3 py-1 bg-[#56E6D0] text-[#07111F] rounded-lg font-bold flex items-center gap-1.5 hover:bg-[#6ef0dc]"
          >
            <FastForward className="w-4 h-4" />
            Auto Complete
          </button>
        </div>
      )}

      {/* Solitaire Playing Field */}
      <div className="w-full bg-[#0a1727]/90 border border-[rgba(130,180,220,0.16)] rounded-2xl p-3 sm:p-6 min-h-[500px] flex flex-col gap-6">
        
        {/* Top row: Stock, Waste, and 4 Foundations */}
        <div className="w-full flex items-center justify-between gap-2">
          {/* Stock & Waste */}
          <div className="flex gap-2 sm:gap-4 items-center">
            {/* Stock */}
            <div
              onClick={handleDrawStock}
              className="w-11 sm:w-16 h-16 sm:h-24 rounded-lg border-2 border-dashed border-[#244b75] bg-[#0c1a2c] flex items-center justify-center cursor-pointer hover:border-[#56E6D0] transition-colors relative"
            >
              {gameState.stock.length > 0 ? (
                <CardView card={gameState.stock[gameState.stock.length - 1]} />
              ) : (
                <RotateCcw className="w-5 h-5 text-[#56E6D0]/50" />
              )}
              <span className="absolute -bottom-4 text-[9px] text-[#91A7BF] font-mono">
                {gameState.stock.length}
              </span>
            </div>

            {/* Waste (with horizontal fan for Draw 3) */}
            <div className="relative flex items-center min-w-[50px] sm:min-w-[80px] h-16 sm:h-24">
              {visibleWaste.map((card, idx) => {
                const isTopWaste = idx === visibleWaste.length - 1;
                return (
                  <div
                    key={card.id}
                    style={{
                      transform: `translateX(${idx * 16}px)`,
                      zIndex: idx + 1,
                    }}
                    className="absolute"
                  >
                    <CardView
                      card={card}
                      isSelected={selectedCard?.card.id === card.id}
                      isHinted={hintInfo?.cardId === card.id}
                      onClick={() => {
                        if (isTopWaste) handleCardClick(card, 'waste');
                      }}
                      onDoubleClick={() => {
                        if (isTopWaste) handleCardDoubleClick(card, 'waste');
                      }}
                      onDragStart={(e) => {
                        if (isTopWaste) handleDragStart(e, card, 'waste');
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4 Foundations */}
          <div className="flex gap-1.5 sm:gap-3">
            {gameState.foundations.map((pile, idx) => {
              const topCard = pile[pile.length - 1];
              const suitIcons = ['♠', '♥', '♣', '♦'];
              return (
                <div
                  key={idx}
                  onClick={() => handleFoundationClick(idx)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => handleFoundationDrop(e, idx)}
                  className="w-11 sm:w-16 h-16 sm:h-24 rounded-lg border border-[#1e3b5e] bg-[#0d1c2e] flex items-center justify-center cursor-pointer hover:border-[#56E6D0]/60 relative transition-all"
                >
                  {topCard ? (
                    <CardView
                      card={topCard}
                      isSelected={selectedCard?.card.id === topCard.id}
                    />
                  ) : (
                    <span className="text-sm sm:text-xl text-[#3b628c]/60 select-none">
                      {suitIcons[idx]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tableau: 7 Columns */}
        <div className="w-full grid grid-cols-7 gap-1 sm:gap-3 pt-4 border-t border-[rgba(130,180,220,0.1)]">
          {gameState.tableau.map((column, colIdx) => (
            <div
              key={colIdx}
              onClick={() => {
                if (column.length === 0) {
                  handleTableauEmptyClick(colIdx);
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => handleTableauDrop(e, colIdx)}
              className="min-h-[240px] sm:min-h-[340px] rounded-lg border border-dashed border-[#1a334e] bg-[#081320]/40 p-0.5 sm:p-1 flex flex-col relative"
            >
              {column.map((card, cardIdx) => {
                const isSelected = selectedCard?.card.id === card.id;
                const isHinted = hintInfo?.cardId === card.id;
                return (
                  <div
                    key={card.id}
                    style={{
                      marginTop: cardIdx === 0 ? 0 : (column[cardIdx - 1]?.faceUp ? '-38px' : '-46px'),
                      zIndex: cardIdx + 1,
                    }}
                    className="relative"
                  >
                    <CardView
                      card={card}
                      isSelected={isSelected}
                      isHinted={isHinted}
                      onClick={() => handleCardClick(card, 'tableau', colIdx, cardIdx)}
                      onDoubleClick={() => handleCardDoubleClick(card, 'tableau', colIdx)}
                      onDragStart={(e) => handleDragStart(e, card, 'tableau', colIdx, cardIdx)}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="w-full flex items-center justify-between gap-2 mt-4">
        <div className="flex gap-2">
          <NeonButton
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={history.length === 0}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Undo
          </NeonButton>
          <NeonButton
            variant="amber"
            size="sm"
            onClick={handleHint}
            icon={<Lightbulb className="w-4 h-4" />}
          >
            Hint
          </NeonButton>
        </div>

        <NeonButton
          variant="cyan"
          size="sm"
          onClick={handleRestart}
          icon={<RotateCcw className="w-4 h-4" />}
        >
          New Game
        </NeonButton>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07111F]/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#102238] border border-[rgba(130,180,220,0.22)] rounded-2xl p-6 text-left space-y-4">
            <h3 className="text-lg font-bold text-[#56E6D0] flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Classic Solitaire (Klondike) Rules
            </h3>
            <ul className="text-xs sm:text-sm text-[#91A7BF] space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#56E6D0] shrink-0 mt-0.5" />
                <span>
                  <strong>Tableau:</strong> Build downward in rank with alternating red and black suits.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#56E6D0] shrink-0 mt-0.5" />
                <span>
                  <strong>Foundations:</strong> Build upward from Ace to King by matching suit.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#56E6D0] shrink-0 mt-0.5" />
                <span>
                  <strong>Kings Only:</strong> Only a King or a King-led sequence can fill an empty column.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#56E6D0] shrink-0 mt-0.5" />
                <span>
                  <strong>Controls:</strong> Drag and drop, tap to move, or double-tap any card to send it to the foundations.
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
        isOpen={isWon}
        gameTitle="Classic Solitaire"
        result={lastResult}
        onPlayAgain={handleRestart}
        onBackToHub={() => navigate('/')}
        onViewProgress={() => navigate('/progress')}
      />
    </div>
  );
};
