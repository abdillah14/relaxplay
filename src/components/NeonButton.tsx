import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { sound } from '../services/soundService';

interface NeonButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'cyan' | 'orange' | 'amber' | 'purple' | 'blue' | 'green' | 'coral' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  playSfx?: boolean;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  variant = 'cyan',
  size = 'md',
  children,
  icon,
  playSfx = true,
  onClick,
  className = '',
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (playSfx && !disabled) {
      sound.playClick();
    }
    if (onClick) {
      onClick(e);
    }
  };

  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold',
  };

  const variantStyles = {
    cyan: 'bg-[#56E6D0] text-[#07111F] hover:bg-[#6ef8e2] hover:shadow-[0_0_20px_rgba(86,230,208,0.4)] active:scale-[0.98] focus-visible:ring-[#56E6D0]',
    orange: 'bg-[#FFB454] text-[#07111F] hover:bg-[#ffc375] hover:shadow-[0_0_20px_rgba(255,180,84,0.4)] active:scale-[0.98] focus-visible:ring-[#FFB454]',
    amber: 'bg-[#FFB454] text-[#07111F] hover:bg-[#ffc375] hover:shadow-[0_0_20px_rgba(255,180,84,0.4)] active:scale-[0.98] focus-visible:ring-[#FFB454]',
    purple: 'bg-[#A78BFA] text-[#07111F] hover:bg-[#b9a2ff] hover:shadow-[0_0_20px_rgba(167,139,250,0.4)] active:scale-[0.98] focus-visible:ring-[#A78BFA]',
    blue: 'bg-[#62B7FF] text-[#07111F] hover:bg-[#80c6ff] hover:shadow-[0_0_20px_rgba(98,183,255,0.4)] active:scale-[0.98] focus-visible:ring-[#62B7FF]',
    green: 'bg-[#67E8A5] text-[#07111F] hover:bg-[#7ef5b6] hover:shadow-[0_0_20px_rgba(103,232,165,0.4)] active:scale-[0.98] focus-visible:ring-[#67E8A5]',
    coral: 'bg-[#FF6B8B] text-[#07111F] hover:bg-[#ff7e9c] hover:shadow-[0_0_20px_rgba(255,107,139,0.4)] active:scale-[0.98] focus-visible:ring-[#FF6B8B]',
    ghost: 'bg-[#102238]/80 text-[#F1F7FF] border border-[rgba(130,180,220,0.2)] hover:border-[#56E6D0]/50 hover:bg-[#142B43] hover:text-[#56E6D0] active:scale-[0.98] focus-visible:ring-[#56E6D0]',
    danger: 'bg-transparent text-[#FF7285] border border-[#FF7285]/30 hover:bg-[#FF7285]/10 hover:border-[#FF7285] active:scale-[0.98] focus-visible:ring-[#FF7285]',
  };

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={handleClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
};
