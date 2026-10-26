/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { GameInfo, AppSettings } from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { SettingsModal } from './components/SettingsModal';
import { Home } from './pages/Home';
import { DailyChallengePage } from './pages/DailyChallengePage';
import { ProgressPage } from './pages/ProgressPage';
import { EchoPath } from './games/EchoPath';
import { OneLine } from './games/OneLine';
import { TinyAnomaly } from './games/TinyAnomaly';
import { HexaFlow } from './games/HexaFlow';
import { MahjongSolitaire } from './games/MahjongSolitaire';
import { ClassicSolitaire } from './games/ClassicSolitaire';
import { BlockPuzzle } from './games/BlockPuzzle';
import { ChessPuzzles } from './games/ChessPuzzles';
import { PipeConnect } from './games/PipeConnect';
import { storage } from './services/storageService';
import { sound } from './services/soundService';
import { getDailyChallenge } from './services/dailyChallengeService';
import { getLocalDateString } from './utils/dates';

export const ALL_GAMES: GameInfo[] = [
  {
    id: 'mahjong-solitaire',
    name: 'Mahjong Solitaire',
    tagline: 'Classic Tile Matching',
    description: 'Match open pairs of traditional tiles across multi-tier layouts with hints, undo, and deadlock shuffle.',
    category: 'Observation',
    estimatedTime: '3–10 min',
    difficultyLevels: ['easy', 'normal', 'hard'],
    accentColor: 'cyan',
    route: '/games/mahjong-solitaire',
    moods: ['relax', 'challenge'],
  },
  {
    id: 'classic-solitaire',
    name: 'Classic Solitaire',
    tagline: 'Klondike Card Strategy',
    description: 'Traditional 52-card Klondike solitaire with foundations, alternating tableau stacks, smart tap, and auto-complete.',
    category: 'Strategy',
    estimatedTime: '5–15 min',
    difficultyLevels: ['easy', 'normal', 'hard'],
    accentColor: 'purple',
    route: '/games/classic-solitaire',
    moods: ['challenge', 'break'],
  },
  {
    id: 'block-puzzle',
    name: 'Block Puzzle',
    tagline: '10×10 Grid Architect',
    description: 'Place geometric polyomino shapes onto the grid, clear full rows and columns simultaneously, and trigger huge combo streaks.',
    category: 'Spatial',
    estimatedTime: '2–10 min',
    difficultyLevels: ['easy', 'normal', 'hard'],
    accentColor: 'amber',
    route: '/games/block-puzzle',
    moods: ['challenge', 'relax'],
  },
  {
    id: 'chess-puzzles',
    name: 'Chess Puzzles',
    tagline: 'Grandmaster Tactics',
    description: 'Solve curated tactical chess puzzles verified with rules engine — from checkmate-in-1 to queen sacrifices.',
    category: 'Strategy',
    estimatedTime: '1–5 min',
    difficultyLevels: ['easy', 'normal', 'hard'],
    accentColor: 'blue',
    route: '/games/chess-puzzles',
    moods: ['challenge', 'break'],
  },
  {
    id: 'pipe-connect',
    name: 'Pipe Connect',
    tagline: 'Fluid Flux Conduits',
    description: 'Rotate pipe tiles to establish unbroken conductive paths from source to terminal destination.',
    category: 'Logic',
    estimatedTime: '1–4 min',
    difficultyLevels: ['easy', 'normal', 'hard'],
    accentColor: 'green',
    route: '/games/pipe-connect',
    moods: ['challenge', 'relax'],
  },
  {
    id: 'echo-path',
    name: 'Echo Path',
    tagline: 'Resonant Synaptic Recall',
    description: 'Observe the radiant signal travelling across connected grid nodes, then reproduce the path from memory.',
    category: 'Memory',
    estimatedTime: '30–90 sec',
    difficultyLevels: ['easy', 'normal', 'hard'],
    accentColor: 'cyan',
    route: '/games/echo-path',
    moods: ['challenge', 'break'],
  },
  {
    id: 'one-line',
    name: 'One Line',
    tagline: 'Continuous Circuit Solver',
    description: 'Draw a single continuous circuit connecting every required node without retracing or lifting.',
    category: 'Logic',
    estimatedTime: '30 sec–2 min',
    difficultyLevels: ['easy', 'normal', 'hard'],
    accentColor: 'green',
    route: '/games/one-line',
    moods: ['challenge', 'relax'],
  },
  {
    id: 'tiny-anomaly',
    name: 'Tiny Anomaly',
    tagline: 'High-Cadence Observation',
    description: 'Something is different. Can you spot it? Scan synchronous animated nodes to isolate the aberrant unit.',
    category: 'Observation',
    estimatedTime: '30–60 sec',
    difficultyLevels: ['easy', 'normal', 'hard'],
    accentColor: 'coral',
    route: '/games/tiny-anomaly',
    moods: ['challenge', 'break'],
  },
  {
    id: 'hexa-flow',
    name: 'Hexa Flow',
    tagline: 'Axial Circuit Synchronizer',
    description: 'Rotate the tiles. Connect the energy. Power terminal capacitors across a geometric hex matrix.',
    category: 'Logic',
    estimatedTime: '1–2 min',
    difficultyLevels: ['easy', 'normal', 'hard'],
    accentColor: 'cyan',
    route: '/games/hexa-flow',
    moods: ['challenge', 'relax'],
  },
];

function AppContent() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(() => storage.loadProgress());
  const [settings, setSettings] = useState<AppSettings>(() => storage.loadSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Sync settings with audio service
  useEffect(() => {
    sound.setSfxEnabled(settings.soundEnabled);
    sound.setSfxVolume(settings.sfxVolume);
    sound.setAmbientEnabled(settings.ambientEnabled);
    sound.setAmbientVolume(settings.ambientVolume);
  }, []);

  const updateSettings = useCallback(
    (updater: (prev: AppSettings) => AppSettings) => {
      setSettings((prev) => {
        const next = updater(prev);
        storage.saveSettings(next);
        return next;
      });
    },
    []
  );

  const refreshProgress = useCallback(() => {
    setProgress(storage.loadProgress());
  }, []);

  const handleResetAllData = () => {
    storage.resetAllData();
    setProgress(storage.loadProgress());
    sound.playClick();
  };

  const todayStr = getLocalDateString();
  const daily = getDailyChallenge(todayStr);
  daily.isCompleted = !!progress.completedDailyChallenges[todayStr];

  return (
    <div className="min-h-screen tech-grid-bg text-[#F1F7FF] flex flex-col font-sans selection:bg-[#56E6D0]/30 selection:text-[#56E6D0]">
      {/* Top Bar Navigation */}
      <Header
        settings={settings}
        onUpdateSettings={updateSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-20 md:pb-12">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                games={ALL_GAMES}
                progress={progress}
                dailyChallenge={daily}
                onSelectGame={(route) => {
                  refreshProgress();
                  navigate(route);
                }}
              />
            }
          />

          {/* 5 Classic Games */}
          <Route
            path="/games/mahjong-solitaire"
            element={
              <MahjongSolitaire
                soundEnabled={settings.soundEnabled}
                onToggleSound={() => {
                  updateSettings((prev) => {
                    const next = !prev.soundEnabled;
                    sound.setSfxEnabled(next);
                    if (next) sound.playClick();
                    return { ...prev, soundEnabled: next };
                  });
                }}
              />
            }
          />

          <Route
            path="/games/classic-solitaire"
            element={
              <ClassicSolitaire
                soundEnabled={settings.soundEnabled}
                onToggleSound={() => {
                  updateSettings((prev) => {
                    const next = !prev.soundEnabled;
                    sound.setSfxEnabled(next);
                    if (next) sound.playClick();
                    return { ...prev, soundEnabled: next };
                  });
                }}
              />
            }
          />

          <Route
            path="/games/block-puzzle"
            element={
              <BlockPuzzle
                soundEnabled={settings.soundEnabled}
                onToggleSound={() => {
                  updateSettings((prev) => {
                    const next = !prev.soundEnabled;
                    sound.setSfxEnabled(next);
                    if (next) sound.playClick();
                    return { ...prev, soundEnabled: next };
                  });
                }}
              />
            }
          />

          <Route
            path="/games/chess-puzzles"
            element={
              <ChessPuzzles
                soundEnabled={settings.soundEnabled}
                onToggleSound={() => {
                  updateSettings((prev) => {
                    const next = !prev.soundEnabled;
                    sound.setSfxEnabled(next);
                    if (next) sound.playClick();
                    return { ...prev, soundEnabled: next };
                  });
                }}
              />
            }
          />

          <Route
            path="/games/pipe-connect"
            element={
              <PipeConnect
                soundEnabled={settings.soundEnabled}
                onToggleSound={() => {
                  updateSettings((prev) => {
                    const next = !prev.soundEnabled;
                    sound.setSfxEnabled(next);
                    if (next) sound.playClick();
                    return { ...prev, soundEnabled: next };
                  });
                }}
              />
            }
          />

          {/* Original 4 Kept Games */}
          <Route
            path="/games/echo-path"
            element={
              <EchoPath
                soundEnabled={settings.soundEnabled}
                onToggleSound={() => {
                  updateSettings((prev) => {
                    const next = !prev.soundEnabled;
                    sound.setSfxEnabled(next);
                    if (next) sound.playClick();
                    return { ...prev, soundEnabled: next };
                  });
                }}
              />
            }
          />

          <Route
            path="/games/one-line"
            element={
              <OneLine
                soundEnabled={settings.soundEnabled}
                onToggleSound={() => {
                  updateSettings((prev) => {
                    const next = !prev.soundEnabled;
                    sound.setSfxEnabled(next);
                    if (next) sound.playClick();
                    return { ...prev, soundEnabled: next };
                  });
                }}
              />
            }
          />

          <Route
            path="/games/tiny-anomaly"
            element={
              <TinyAnomaly
                soundEnabled={settings.soundEnabled}
                onToggleSound={() => {
                  updateSettings((prev) => {
                    const next = !prev.soundEnabled;
                    sound.setSfxEnabled(next);
                    if (next) sound.playClick();
                    return { ...prev, soundEnabled: next };
                  });
                }}
              />
            }
          />

          <Route
            path="/games/hexa-flow"
            element={
              <HexaFlow
                soundEnabled={settings.soundEnabled}
                onToggleSound={() => {
                  updateSettings((prev) => {
                    const next = !prev.soundEnabled;
                    sound.setSfxEnabled(next);
                    if (next) sound.playClick();
                    return { ...prev, soundEnabled: next };
                  });
                }}
              />
            }
          />

          <Route
            path="/daily"
            element={<DailyChallengePage challenge={daily} progress={progress} />}
          />

          <Route
            path="/progress"
            element={<ProgressPage progress={progress} />}
          />

          {/* Catch-all redirect to home */}
          <Route
            path="*"
            element={
              <Home
                games={ALL_GAMES}
                progress={progress}
                dailyChallenge={daily}
                onSelectGame={(route) => {
                  refreshProgress();
                  navigate(route);
                }}
              />
            }
          />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        onResetData={handleResetAllData}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
