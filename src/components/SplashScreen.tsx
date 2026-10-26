import React, { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Logo } from './Logo';

interface SplashScreenProps {
  onComplete: () => void;
}

const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: `${(i * 41 + 13) % 100}%`,
  top: `${(i * 67 + 7) % 100}%`,
  size: 2 + (i % 4),
  delay: (i % 9) * 0.18,
  duration: 2.8 + (i % 5) * 0.45,
}));

const TITLE = [
  { char: 'R', accent: false },
  { char: 'E', accent: false },
  { char: 'L', accent: false },
  { char: 'A', accent: false },
  { char: 'X', accent: false },
  { char: 'P', accent: true },
  { char: 'L', accent: true },
  { char: 'A', accent: true },
  { char: 'Y', accent: true },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  useEffect(() => {
    const boot = document.getElementById('boot-splash');
    if (!boot) return undefined;
    boot.classList.add('boot-splash-hide');
    const removeTimer = window.setTimeout(() => boot.remove(), 280);
    return () => {
      window.clearTimeout(removeTimer);
      boot.remove();
    };
  }, []);

  useEffect(() => {
    const duration = reducedMotion ? 450 : 2800;
    const timer = window.setTimeout(onComplete, duration);
    return () => window.clearTimeout(timer);
  }, [onComplete, reducedMotion]);

  return (
    <motion.div
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-x-hidden overflow-y-auto bg-[#07111F] cursor-pointer min-h-[100dvh] w-full max-w-[100vw]"
      role="dialog"
      aria-label="RELAXPLAY loading"
      aria-live="polite"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      onClick={onComplete}
    >
      <div className="absolute inset-0 splash-aurora pointer-events-none" />

      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute w-[min(28rem,85vw)] h-[min(28rem,85vw)] rounded-full bg-[#56E6D0]/18 blur-[90px] -translate-x-1/2 -translate-y-1/2 left-[42%] top-[46%]"
          animate={reducedMotion ? undefined : { scale: [1, 1.18, 1], opacity: [0.45, 0.8, 0.45] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-72 h-72 rounded-full bg-[#62B7FF]/16 blur-[80px] left-[52%] top-[38%]"
          animate={reducedMotion ? undefined : { scale: [1.1, 0.92, 1.1], opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-[#A78BFA]/14 blur-[70px] left-[36%] top-[52%]"
          animate={reducedMotion ? undefined : { scale: [0.9, 1.15, 0.9], opacity: [0.3, 0.65, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
      </div>

      {!reducedMotion &&
        PARTICLES.map((particle) => (
          <motion.span
            key={particle.id}
            className="absolute rounded-full bg-[#56E6D0] pointer-events-none"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              boxShadow: '0 0 8px rgba(86, 230, 208, 0.8)',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: [0, 0.9, 0], y: [8, -18, -36] }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}

      <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] my-auto w-full max-w-lg">
        <div className="relative flex items-center justify-center w-[min(65vw,13rem)] h-[min(65vw,13rem)] sm:w-60 sm:h-60 md:w-64 md:h-64 max-h-[min(65vw,40vh)] sm:max-h-none">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#56E6D0]/35"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.85, 1.22, 0.85], opacity: [0.2, 0.65, 0.2] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-[14px] rounded-full border-2 border-[#62B7FF]/30"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [1, 1.14, 1], opacity: [0.25, 0.6, 0.25] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          />
          <div className="splash-orbit-ring absolute inset-[-6px] rounded-full" />
          <div className="splash-orbit-ring splash-orbit-ring-reverse absolute inset-[22px] rounded-full" />

          <motion.div
            className="relative z-10 splash-logo-glow w-[min(58vw,7.5rem)] h-[min(58vw,7.5rem)] sm:w-[8.75rem] sm:h-[8.75rem] md:w-[9.5rem] md:h-[9.5rem] rounded-2xl sm:rounded-[2rem] bg-gradient-to-br from-[#56E6D0] via-[#62B7FF] to-[#A78BFA] p-[2.5px]"
            initial={{ scale: 0.72, opacity: 0.85, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 14, delay: 0.05 }}
          >
            <div className="relative w-full h-full rounded-[1.65rem] sm:rounded-[1.85rem] bg-[#07111F] overflow-hidden flex items-center justify-center p-2 sm:p-3">
              <motion.div
                className="w-full h-full"
                animate={reducedMotion ? undefined : { y: [0, -5, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
              >
                <Logo size={128} className="w-full h-full drop-shadow-[0_0_18px_rgba(86,230,208,0.45)]" />
              </motion.div>
              <span className="splash-shine" />
            </div>
          </motion.div>
        </div>

        <motion.h1
          className="mt-5 sm:mt-7 text-[clamp(1.75rem,8vw,3rem)] sm:text-5xl md:text-6xl font-extrabold tracking-tight flex flex-wrap justify-center"
          aria-label="RELAXPLAY"
        >
          {TITLE.map((letter, index) => (
            <motion.span
              key={`${letter.char}-${index}`}
              className={letter.accent ? 'text-[#56E6D0]' : 'text-[#F1F7FF]'}
              initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: 0.45,
                delay: reducedMotion ? 0 : 0.32 + index * 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {letter.char}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          className="mt-2 sm:mt-3 text-xs sm:text-base text-[#91A7BF] tracking-wide text-center text-balance px-2 max-w-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: reducedMotion ? 0.1 : 1.1 }}
        >
          Challenge your mind. Find your calm.
        </motion.p>

        <motion.div
          className="mt-6 sm:mt-8 h-[3px] w-[min(70vw,11rem)] sm:w-44 overflow-hidden rounded-full bg-[rgba(130,180,220,0.16)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reducedMotion ? 0 : 1.2 }}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#56E6D0] via-[#62B7FF] to-[#A78BFA] shadow-[0_0_12px_rgba(86,230,208,0.7)]"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: reducedMotion ? 0.3 : 1.35, delay: reducedMotion ? 0 : 1.25, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};
