import React from 'react';
import { motion } from 'motion/react';
import { BreathingPhase } from '../types';

interface CrystalLatticeProps {
  phase: BreathingPhase;
  phaseText: string;
  secondsRemaining: number;
  totalPhaseSeconds: number;
}

export const CrystalLatticeVisualizer: React.FC<CrystalLatticeProps> = ({
  phase,
  phaseText,
  secondsRemaining,
  totalPhaseSeconds,
}) => {
  // Determine scale target and glow colors based on breathing phase
  let scaleTarget = 1.0;
  let glowColor = 'rgba(0, 243, 255, 0.6)';
  let auraOpacity = 0.4;
  const transitionDuration = totalPhaseSeconds && totalPhaseSeconds > 0 ? totalPhaseSeconds : 4;

  if (phase === 'IN' || phase === 'IN_EXTRA') {
    // Bigger when inhaling
    scaleTarget = 1.4;
    glowColor = 'rgba(0, 243, 255, 0.85)';
    auraOpacity = 0.85;
  } else if (phase === 'HOLD_IN') {
    // Keep same large size while holding full
    scaleTarget = 1.4;
    glowColor = 'rgba(230, 0, 255, 0.8)';
    auraOpacity = 0.75;
  } else if (phase === 'OUT') {
    // Smaller when exhaling
    scaleTarget = 0.8;
    glowColor = 'rgba(255, 0, 127, 0.7)';
    auraOpacity = 0.35;
  } else if (phase === 'HOLD_OUT') {
    // Hold small size while holding empty
    scaleTarget = 0.8;
    glowColor = 'rgba(150, 0, 255, 0.6)';
    auraOpacity = 0.3;
  }

  return (
    <div className="relative flex flex-col items-center justify-center my-4 min-h-[360px] select-none">
      {/* Dynamic Top Phase Instruction Text matching photo ("Breathe In...") */}
      <div className="h-16 flex flex-col items-center justify-center mb-2">
        <motion.h2
          key={phaseText}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="text-3xl md:text-4xl font-extrabold tracking-wide text-cyan-300 drop-shadow-[0_0_18px_rgba(0,243,255,0.85)] text-center font-sans"
        >
          {phaseText}
        </motion.h2>
        <span className="text-xs text-pink-300/80 font-mono tracking-widest mt-1">
          {secondsRemaining}s
        </span>
      </div>

      {/* Central Expanding Sacred Geometry Crystal Lattice */}
      <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
        {/* Glowing Background Radial Aura Pulse */}
        <motion.div
          animate={{
            scale: scaleTarget,
            opacity: auraOpacity,
          }}
          transition={{
            duration: transitionDuration,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${glowColor} 0%, rgba(255, 0, 127, 0.2) 45%, transparent 75%)`,
          }}
        />

        {/* Rotating Outer Energy Rings */}
        <motion.div
          animate={{ rotate: 360, scale: scaleTarget }}
          transition={{
            rotate: { duration: 32, repeat: Infinity, ease: 'linear' },
            scale: { duration: transitionDuration, ease: 'easeInOut' },
          }}
          className="absolute w-72 h-72 border border-cyan-500/30 rounded-full border-dashed shadow-[0_0_20px_rgba(0,243,255,0.2)]"
        />

        <motion.div
          animate={{ rotate: -360, scale: scaleTarget }}
          transition={{
            rotate: { duration: 24, repeat: Infinity, ease: 'linear' },
            scale: { duration: transitionDuration, ease: 'easeInOut' },
          }}
          className="absolute w-60 h-60 border border-pink-500/25 rounded-full border-dotted shadow-[0_0_15px_rgba(255,0,127,0.2)]"
        />

        {/* Pure Floating Multi-Strand Neon Figure-8 Infinity Symbol */}
        <motion.div
          animate={{ scale: scaleTarget }}
          transition={{ duration: transitionDuration, ease: 'easeInOut' }}
          className="relative z-10 w-80 h-60 sm:w-[440px] sm:h-72 flex items-center justify-center"
        >
          <svg
            viewBox="0 0 500 300"
            className="w-full h-full overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Radial Center Star Flare */}
              <radialGradient id="centerFlare" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="25%" stopColor="#80f7ff" stopOpacity="0.9" />
                <stop offset="55%" stopColor="#ff52c5" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>

              {/* Cyan to Magenta Ribbon Linear Gradient 1 */}
              <linearGradient id="infinityRibbonGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f3ff" />
                <stop offset="35%" stopColor="#38b6ff" />
                <stop offset="65%" stopColor="#d946ef" />
                <stop offset="100%" stopColor="#ff007f" />
              </linearGradient>

              {/* Magenta to Cyan Ribbon Linear Gradient 2 */}
              <linearGradient id="infinityRibbonGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ff007f" />
                <stop offset="40%" stopColor="#ec4899" />
                <stop offset="70%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#00f3ff" />
              </linearGradient>
            </defs>

            {/* Ambient Center Glow Background */}
            <circle cx="250" cy="150" r="120" fill="url(#centerFlare)" opacity="0.6" />

            {/* COLOR OSCILLATING MULTI-STRAND INFINITY SYMBOL */}
            <motion.g
              animate={{
                filter: [
                  'hue-rotate(0deg) drop-shadow(0 0 18px rgba(0,243,255,0.95))',
                  'hue-rotate(90deg) drop-shadow(0 0 22px rgba(255,0,127,0.95))',
                  'hue-rotate(180deg) drop-shadow(0 0 20px rgba(0,255,180,0.95))',
                  'hue-rotate(270deg) drop-shadow(0 0 22px rgba(180,80,255,0.95))',
                  'hue-rotate(360deg) drop-shadow(0 0 18px rgba(0,243,255,0.95))',
                ],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              {/* Wide Soft Underglow Path */}
              <path
                d="M 250 150 C 300 70, 420 70, 420 150 C 420 230, 300 230, 250 150 C 200 70, 80 70, 80 150 C 80 230, 200 230, 250 150 Z"
                stroke="url(#infinityRibbonGrad1)"
                strokeWidth="16"
                strokeOpacity="0.3"
                fill="none"
              />

              {/* Multi-Strand Parallel Luminous Ribbons */}
              {/* Strand 1 (Outer Top) */}
              <path
                d="M 250 150 C 304 64, 424 64, 424 150 C 424 236, 304 236, 250 150 C 196 64, 76 64, 76 150 C 76 236, 196 236, 250 150 Z"
                stroke="url(#infinityRibbonGrad1)"
                strokeWidth="4"
                fill="none"
                opacity="0.9"
              />
              {/* Strand 2 (Mid-High) */}
              <path
                d="M 250 147 C 301 67, 421 67, 421 147 C 421 233, 301 233, 250 147 C 199 67, 79 67, 79 147 C 79 233, 199 233, 250 147 Z"
                stroke="url(#infinityRibbonGrad2)"
                strokeWidth="3"
                fill="none"
                opacity="0.85"
              />
              {/* Strand 3 (Core Line) */}
              <path
                d="M 250 150 C 298 70, 418 70, 418 150 C 418 230, 298 230, 250 150 C 202 70, 82 70, 82 150 C 82 230, 202 230, 250 150 Z"
                stroke="#ffffff"
                strokeWidth="2.5"
                fill="none"
                opacity="0.95"
              />
              {/* Strand 4 (Mid-Low) */}
              <path
                d="M 250 153 C 295 73, 415 73, 415 153 C 415 227, 295 227, 250 153 C 205 73, 85 73, 85 153 C 85 227, 205 227, 250 153 Z"
                stroke="url(#infinityRibbonGrad1)"
                strokeWidth="3"
                fill="none"
                opacity="0.85"
              />
              {/* Strand 5 (Outer Bottom) */}
              <path
                d="M 250 150 C 292 76, 412 76, 412 150 C 412 224, 292 224, 250 150 C 208 76, 88 76, 88 150 C 88 224, 208 224, 250 150 Z"
                stroke="url(#infinityRibbonGrad2)"
                strokeWidth="4"
                fill="none"
                opacity="0.9"
              />

              {/* FLOWING LIGHT TRACERS (Continuous Particle Waves racing along the loops) */}
              <motion.path
                d="M 250 150 C 300 70, 420 70, 420 150 C 420 230, 300 230, 250 150 C 200 70, 80 70, 80 150 C 80 230, 200 230, 250 150 Z"
                stroke="#ffffff"
                strokeWidth="4"
                strokeDasharray="40 160"
                fill="none"
                animate={{ strokeDashoffset: [0, -400] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                strokeLinecap="round"
              />
              <motion.path
                d="M 250 150 C 300 70, 420 70, 420 150 C 420 230, 300 230, 250 150 C 200 70, 80 70, 80 150 C 80 230, 200 230, 250 150 Z"
                stroke="#00f3ff"
                strokeWidth="5"
                strokeDasharray="25 175"
                fill="none"
                animate={{ strokeDashoffset: [-200, -600] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                strokeLinecap="round"
              />
              <motion.path
                d="M 250 150 C 300 70, 420 70, 420 150 C 420 230, 300 230, 250 150 C 200 70, 80 70, 80 150 C 80 230, 200 230, 250 150 Z"
                stroke="#ff007f"
                strokeWidth="5"
                strokeDasharray="30 170"
                fill="none"
                animate={{ strokeDashoffset: [-100, -500] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                strokeLinecap="round"
              />
            </motion.g>

            {/* CENTRAL ANAMORPHIC STARBURST FLARE */}
            <g className="filter drop-shadow-[0_0_20px_#ffffff]">
              {/* Horizontal Lens Flare Beam */}
              <line x1="160" y1="150" x2="340" y2="150" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
              <line x1="180" y1="150" x2="320" y2="150" stroke="#80f7ff" strokeWidth="5" strokeLinecap="round" opacity="0.8" />

              {/* Vertical Star Ray */}
              <line x1="250" y1="80" x2="250" y2="220" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
              <line x1="250" y1="100" x2="250" y2="200" stroke="#ff80df" strokeWidth="4" strokeLinecap="round" opacity="0.8" />

              {/* Diagonal Cross Rays */}
              <line x1="210" y1="110" x2="290" y2="190" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
              <line x1="210" y1="190" x2="290" y2="110" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />

              {/* Concentric Flare Orbs */}
              <circle cx="250" cy="150" r="22" fill="#ffffff" opacity="0.95" />
              <circle cx="250" cy="150" r="12" fill="#00f3ff" opacity="0.85" />
              <circle cx="250" cy="150" r="6" fill="#ffffff" />
            </g>
          </svg>
        </motion.div>
      </div>
    </div>
  );
};
