import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 32, className = '' }) => (
  <img
    src="/logo.png"
    alt="RELAXPLAY"
    width={size}
    height={size}
    className={`object-contain select-none max-w-full max-h-full h-auto w-auto ${className}`}
    draggable={false}
  />
);
