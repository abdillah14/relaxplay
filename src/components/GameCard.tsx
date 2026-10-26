import React from 'react';
import { motion } from 'motion/react';
import { Play, Clock, Trophy } from 'lucide-react';
import { GameInfo, GameStats } from '../types';
import { NeonButton } from './NeonButton';
import { sound } from '../services/soundService';

interface GameCardProps {
  game: GameInfo;
  stats?: GameStats;
  onPlay: (route: string) => void;
  renderPreviewIcon: () => React.ReactNode;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  stats,
  onPlay,
  renderPreviewIcon,
}) => {
  const accentBorder: Record<GameInfo['accentColor'], string> = {
    cyan: 'hover:border-[#56E6D0]/50 group-hover:shadow-[0_0_24px_rgba(86,230,208,0.2)]',
    amber: 'hover:border-[#FFB454]/50 group-hover:shadow-[0_0_24px_rgba(255,180,84,0.2)]',
    purple: 'hover:border-[#A78BFA]/50 group-hover:shadow-[0_0_24px_rgba(167,139,250,0.2)]',
    blue: 'hover:border-[#62B7FF]/50 group-hover:shadow-[0_0_24px_rgba(98,183,255,0.2)]',
    green: 'hover:border-[#67E8A5]/50 group-hover:shadow-[0_0_24px_rgba(103,232,165,0.2)]',
    coral: 'hover:border-[#FF6B8B]/50 group-hover:shadow-[0_0_24px_rgba(255,107,139,0.2)]',
  };

  const buttonVariant: Record<GameInfo['accentColor'], 'cyan' | 'amber' | 'purple' | 'blue' | 'green' | 'coral'> = {
    cyan: 'cyan',
    amber: 'amber',
    purple: 'purple',
    blue: 'blue',
    green: 'green',
    coral: 'coral',
  };

  const bestScore = stats?.bestScore || 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-2xl bg-[#102238] border border-[rgba(130,180,220,0.16)] p-6 flex flex-col justify-between transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.4)] ${accentBorder[game.accentColor]}`}
    >
      <div>
        {/* Top visual preview / icon lockup */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0B192B] border border-[rgba(130,180,220,0.15)] flex items-center justify-center p-2.5 transition-transform group-hover:scale-105">
            {renderPreviewIcon()}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#91A7BF]">
            <Clock className="w-3.5 h-3.5" />
            <span>{game.estimatedTime}</span>
          </div>
        </div>

        {/* Title and description */}
        <h3 className="text-xl font-bold tracking-tight text-[#F1F7FF] mb-1 group-hover:text-[#56E6D0] transition-colors">
          {game.name}
        </h3>
        <p className="text-xs font-medium text-[#56E6D0]/90 mb-2">{game.tagline}</p>
        <p className="text-sm text-[#91A7BF] leading-relaxed mb-5">
          {game.description}
        </p>

        {/* Unboxed Metadata Discipline */}
        <div className="flex items-center gap-2 text-xs text-[#91A7BF] mb-6 pt-3 border-t border-[rgba(130,180,220,0.1)]">
          <span>{game.category}</span>
          <span aria-hidden="true" className="text-[#91A7BF]/40">·</span>
          <span>Adaptive Pace</span>
        </div>
      </div>

      {/* Bottom stats and action button */}
      <div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B192B] border border-[rgba(130,180,220,0.1)] mb-4">
          <div className="flex items-center gap-2 text-xs text-[#91A7BF]">
            <Trophy className="w-3.5 h-3.5 text-[#FFB454]" />
            <span>Personal Best</span>
          </div>
          <span className="text-sm font-bold font-mono text-[#F1F7FF] tabular-nums">
            {bestScore > 0 ? bestScore.toLocaleString() : 'Not played yet'}
          </span>
        </div>

        <NeonButton
          variant={buttonVariant[game.accentColor]}
          size="md"
          className="w-full"
          icon={<Play className="w-4 h-4 fill-current" />}
          onClick={() => {
            sound.playClick();
            onPlay(game.route);
          }}
        >
          Play {game.name}
        </NeonButton>
      </div>
    </motion.div>
  );
};
