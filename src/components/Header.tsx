import React from 'react';
import { Volume2, VolumeX, Music, Settings } from 'lucide-react';
import { Logo } from './Logo';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppSettings } from '../types';
import { sound } from '../services/soundService';

interface HeaderProps {
  settings: AppSettings;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  onOpenSettings,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const toggleSfx = () => {
    onUpdateSettings((prev) => {
      const next = !prev.soundEnabled;
      sound.setSfxEnabled(next);
      if (next) sound.playClick();
      return { ...prev, soundEnabled: next };
    });
  };

  const toggleAmbient = () => {
    onUpdateSettings((prev) => {
      const next = !prev.ambientEnabled;
      sound.setAmbientEnabled(next);
      if (next) sound.playClick();
      return { ...prev, ambientEnabled: next };
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[rgba(130,180,220,0.12)] bg-[#07111F]/90 backdrop-blur-md px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 pt-[max(0.625rem,env(safe-area-inset-top))] transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4 md:gap-8 min-w-0">
        {/* Zone 1: Brand wordmark */}
        <button
          onClick={() => {
            sound.playClick();
            navigate('/');
          }}
          className="flex items-center gap-1.5 sm:gap-2 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#56E6D0] rounded-lg p-0.5 sm:p-1 cursor-pointer min-w-0 shrink"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#56E6D0] via-[#62B7FF] to-[#A78BFA] p-[1.5px] shadow-[0_0_12px_rgba(86,230,208,0.3)] transition-transform group-hover:scale-105 shrink-0">
            <div className="w-full h-full bg-[#07111F] rounded-[7px] flex items-center justify-center overflow-hidden p-0.5">
              <Logo size={24} className="w-full h-full" />
            </div>
          </div>
          <span className="text-base sm:text-xl font-extrabold tracking-tight text-[#F1F7FF] whitespace-nowrap truncate">
            RELAX<span className="text-[#56E6D0]">PLAY</span>
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#91A7BF]">
          <button
            onClick={() => {
              sound.playClick();
              navigate('/');
            }}
            className={`whitespace-nowrap transition-colors hover:text-[#F1F7FF] py-1 cursor-pointer ${
              pathname === '/' ? 'text-[#56E6D0] border-b-2 border-[#56E6D0] font-semibold' : ''
            }`}
          >
            Home
          </button>

          <button
            onClick={() => {
              sound.playClick();
              if (pathname === '/') {
                const el = document.getElementById('games-grid');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              } else {
                navigate('/');
                setTimeout(() => {
                  const el = document.getElementById('games-grid');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className={`whitespace-nowrap transition-colors hover:text-[#F1F7FF] py-1 cursor-pointer ${
              pathname.startsWith('/games') ? 'text-[#56E6D0] border-b-2 border-[#56E6D0] font-semibold' : ''
            }`}
          >
            Games
          </button>

          <button
            onClick={() => {
              sound.playClick();
              navigate('/daily');
            }}
            className={`whitespace-nowrap transition-colors hover:text-[#F1F7FF] py-1 cursor-pointer ${
              pathname === '/daily' ? 'text-[#56E6D0] border-b-2 border-[#56E6D0] font-semibold' : ''
            }`}
          >
            Daily Challenge
          </button>

          <button
            onClick={() => {
              sound.playClick();
              navigate('/progress');
            }}
            className={`whitespace-nowrap transition-colors hover:text-[#F1F7FF] py-1 cursor-pointer ${
              pathname === '/progress' ? 'text-[#56E6D0] border-b-2 border-[#56E6D0] font-semibold' : ''
            }`}
          >
            Progress
          </button>
        </nav>

        {/* Zone 3: Interactive audio & settings controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={toggleSfx}
            title={settings.soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
            aria-label={settings.soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all border cursor-pointer ${
              settings.soundEnabled
                ? 'bg-[#102238] border-[#56E6D0]/40 text-[#56E6D0] shadow-[0_0_10px_rgba(86,230,208,0.2)]'
                : 'bg-[#102238]/60 border-[rgba(130,180,220,0.15)] text-[#91A7BF] hover:text-[#F1F7FF]'
            }`}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleAmbient}
            title={settings.ambientEnabled ? 'Stop ambient music' : 'Start ambient music'}
            aria-label={settings.ambientEnabled ? 'Stop ambient music' : 'Start ambient music'}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all border cursor-pointer ${
              settings.ambientEnabled
                ? 'bg-[#102238] border-[#A78BFA]/50 text-[#A78BFA] shadow-[0_0_10px_rgba(167,139,250,0.25)]'
                : 'bg-[#102238]/60 border-[rgba(130,180,220,0.15)] text-[#91A7BF] hover:text-[#F1F7FF]'
            }`}
          >
            <Music className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            title="Settings"
            aria-label="Settings"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all bg-[#102238]/60 border border-[rgba(130,180,220,0.15)] text-[#91A7BF] hover:text-[#F1F7FF] hover:border-[#56E6D0]/40 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
