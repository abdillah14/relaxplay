import React, { useState } from 'react';
import { X, Volume2, VolumeX, Music, RotateCcw, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { AppSettings } from '../types';
import { NeonButton } from './NeonButton';
import { sound } from '../services/soundService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetData,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07111F]/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#102238] border border-[rgba(130,180,220,0.22)] rounded-2xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(130,180,220,0.12)] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#56E6D0]/10 text-[#56E6D0] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#F1F7FF]">Preferences & Sound</h3>
              <p className="text-xs text-[#91A7BF]">Configure audio, motion, and application storage</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#91A7BF] hover:text-[#F1F7FF] hover:bg-[#142B43] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Audio Controls */}
        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-xl bg-[#0B192B] border border-[rgba(130,180,220,0.1)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#56E6D0]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-[#91A7BF]" />
                )}
                <div>
                  <div className="text-sm font-semibold text-[#F1F7FF]">Sound Effects</div>
                  <div className="text-xs text-[#91A7BF]">Synthesized clicks, flips, and victory chimes</div>
                </div>
              </div>
              <button
                onClick={() => {
                  onUpdateSettings((prev) => {
                    const next = !prev.soundEnabled;
                    sound.setSfxEnabled(next);
                    if (next) sound.playClick();
                    return { ...prev, soundEnabled: next };
                  });
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.soundEnabled ? 'bg-[#56E6D0]' : 'bg-[#142B43]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-[#07111F] transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.soundEnabled && (
              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs text-[#91A7BF] w-12">Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.sfxVolume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    sound.setSfxVolume(val);
                    onUpdateSettings((prev) => ({ ...prev, sfxVolume: val }));
                  }}
                  className="w-full accent-[#56E6D0] cursor-pointer"
                />
                <span className="text-xs font-mono text-[#F1F7FF] w-8 text-right">
                  {Math.round(settings.sfxVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Ambient procedural background */}
          <div className="p-4 rounded-xl bg-[#0B192B] border border-[rgba(130,180,220,0.1)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <Music className="w-4 h-4 text-[#A78BFA]" />
                <div>
                  <div className="text-sm font-semibold text-[#F1F7FF]">Zen Ambient Drone</div>
                  <div className="text-xs text-[#91A7BF]">Calm harmonic procedural synthesizer (no external audio)</div>
                </div>
              </div>
              <button
                onClick={() => {
                  onUpdateSettings((prev) => {
                    const next = !prev.ambientEnabled;
                    sound.setAmbientEnabled(next);
                    return { ...prev, ambientEnabled: next };
                  });
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.ambientEnabled ? 'bg-[#A78BFA]' : 'bg-[#142B43]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-[#07111F] transition-transform ${
                    settings.ambientEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.ambientEnabled && (
              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs text-[#91A7BF] w-12">Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.ambientVolume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    sound.setAmbientVolume(val);
                    onUpdateSettings((prev) => ({ ...prev, ambientVolume: val }));
                  }}
                  className="w-full accent-[#A78BFA] cursor-pointer"
                />
                <span className="text-xs font-mono text-[#F1F7FF] w-8 text-right">
                  {Math.round(settings.ambientVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Reduced motion */}
          <div className="p-4 rounded-xl bg-[#0B192B] border border-[rgba(130,180,220,0.1)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#62B7FF]" />
              <div>
                <div className="text-sm font-semibold text-[#F1F7FF]">Reduced Motion</div>
                <div className="text-xs text-[#91A7BF]">Simplify transitions and minimize motion effects</div>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onUpdateSettings((prev) => ({ ...prev, reducedMotion: !prev.reducedMotion }));
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.reducedMotion ? 'bg-[#62B7FF]' : 'bg-[#142B43]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-[#07111F] transition-transform ${
                  settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Data Reset Section */}
        <div className="pt-4 border-t border-[rgba(130,180,220,0.12)]">
          {!showConfirmReset ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-[#91A7BF]">Local Storage</div>
                <div className="text-[11px] text-[#91A7BF]/70">Scores, daily streaks & history</div>
              </div>
              <NeonButton
                variant="danger"
                size="sm"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={() => setShowConfirmReset(true)}
              >
                Reset Progress
              </NeonButton>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#FF7285]/10 border border-[#FF7285]/30 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#FF7285] mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Reset all saved records and daily streaks?</span>
              </div>
              <p className="text-[11px] text-[#91A7BF] mb-3">
                This will wipe all high scores, completed daily challenges, and personal bests. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <NeonButton
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onResetData();
                    setShowConfirmReset(false);
                    onClose();
                  }}
                >
                  Yes, Reset Everything
                </NeonButton>
                <NeonButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirmReset(false)}
                >
                  Cancel
                </NeonButton>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
