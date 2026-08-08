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

        {/* Crystalline Diamond Lattice Wireframe SVG (Matching User's Uploaded Photo) */}
        <motion.div
          animate={{ scale: scaleTarget }}
          transition={{ duration: transitionDuration, ease: 'easeInOut' }}
          className="relative z-10 w-full h-full flex items-center justify-center filter drop-shadow-[0_0_22px_rgba(0,243,255,0.7)]"
        >
          <svg
            viewBox="0 0 500 300"
            className="w-full h-auto overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Cyan to White Gradient (Left Node) */}
              <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f3ff" stopOpacity="1" />
                <stop offset="100%" stopColor="#80f7ff" stopOpacity="0.8" />
              </linearGradient>

              {/* White/Violet Central Core */}
              <linearGradient id="centerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="100%" stopColor="#d2b4ff" stopOpacity="0.9" />
              </linearGradient>

              {/* Magenta/Pink Gradient (Right Node) */}
              <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff40a0" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ff007f" stopOpacity="1" />
              </linearGradient>

              {/* Glowing Junction Dot */}
              <radialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="100%" stopColor="#00f3ff" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* BACKGROUND CONNECTING GRID LINES */}
            <path
              d="M 50 150 L 250 50 L 450 150 L 250 250 Z"
              stroke="url(#cyanGrad)"
              strokeWidth="1.2"
              strokeOpacity="0.5"
              strokeDasharray="4 2"
            />
            <path
              d="M 50 150 L 450 150 M 250 50 L 250 250"
              stroke="#00f3ff"
              strokeWidth="1"
              strokeOpacity="0.4"
            />

            {/* LEFT DIAMOND CLUSTER (CYAN NEON) */}
            <g className="filter drop-shadow-[0_0_8px_#00f3ff]">
              {/* Outer Diamond */}
              <polygon
                points="130,150 180,80 230,150 180,220"
                stroke="url(#cyanGrad)"
                strokeWidth="2.2"
                fill="rgba(0, 243, 255, 0.08)"
              />
              {/* Inner Diamond Lattice */}
              <polygon points="155,150 180,115 205,150 180,185" stroke="#00f3ff" strokeWidth="1.5" />
              <line x1="130" y1="150" x2="230" y2="150" stroke="#00f3ff" strokeWidth="1.2" />
              <line x1="180" y1="80" x2="180" y2="220" stroke="#00f3ff" strokeWidth="1.2" />
              {/* Diagonals */}
              <line x1="130" y1="150" x2="180" y2="115" stroke="#00f3ff" strokeWidth="1" />
              <line x1="230" y1="150" x2="180" y2="115" stroke="#00f3ff" strokeWidth="1" />
              <line x1="130" y1="150" x2="180" y2="185" stroke="#00f3ff" strokeWidth="1" />
              <line x1="230" y1="150" x2="180" y2="185" stroke="#00f3ff" strokeWidth="1" />
            </g>

            {/* CENTER SACRED CORE (BRIGHT WHITE / VIOLET SACRED OCTAHEDRON) */}
            <g className="filter drop-shadow-[0_0_12px_#ffffff]">
              {/* Primary Central Diamond */}
              <polygon
                points="250,30 320,150 250,270 180,150"
                stroke="url(#centerGrad)"
                strokeWidth="2.8"
                fill="rgba(255, 255, 255, 0.1)"
              />
              {/* Nested Sacred Geometry Lines */}
              <polygon points="250,80 290,150 250,220 210,150" stroke="#ffffff" strokeWidth="1.8" />
              <line x1="180" y1="150" x2="320" y2="150" stroke="#ffffff" strokeWidth="2" />
              <line x1="250" y1="30" x2="250" y2="270" stroke="#ffffff" strokeWidth="2" />
              {/* Cross Pyramids */}
              <line x1="250" y1="30" x2="210" y2="150" stroke="#ffffff" strokeWidth="1.2" />
              <line x1="250" y1="30" x2="290" y2="150" stroke="#ffffff" strokeWidth="1.2" />
              <line x1="250" y1="270" x2="210" y2="150" stroke="#ffffff" strokeWidth="1.2" />
              <line x1="250" y1="270" x2="290" y2="150" stroke="#ffffff" strokeWidth="1.2" />
            </g>

            {/* RIGHT DIAMOND CLUSTER (NEON PINK / MAGENTA) */}
            <g className="filter drop-shadow-[0_0_8px_#ff007f]">
              {/* Outer Diamond */}
              <polygon
                points="270,150 320,80 370,150 320,220"
                stroke="url(#pinkGrad)"
                strokeWidth="2.2"
                fill="rgba(255, 0, 127, 0.08)"
              />
              {/* Inner Diamond Lattice */}
              <polygon points="295,150 320,115 345,150 320,185" stroke="#ff007f" strokeWidth="1.5" />
              <line x1="270" y1="150" x2="370" y2="150" stroke="#ff007f" strokeWidth="1.2" />
              <line x1="320" y1="80" x2="320" y2="220" stroke="#ff007f" strokeWidth="1.2" />
              {/* Diagonals */}
              <line x1="270" y1="150" x2="320" y2="115" stroke="#ff007f" strokeWidth="1" />
              <line x1="370" y1="150" x2="320" y2="115" stroke="#ff007f" strokeWidth="1" />
              <line x1="270" y1="150" x2="320" y2="185" stroke="#ff007f" strokeWidth="1" />
              <line x1="370" y1="150" x2="320" y2="185" stroke="#ff007f" strokeWidth="1" />
            </g>

            {/* FAR OUTER WING DIAMONDS */}
            <polygon
              points="90,150 130,110 170,150 130,190"
              stroke="#00f3ff"
              strokeWidth="1.5"
              strokeOpacity="0.75"
            />
            <polygon
              points="330,150 370,110 410,150 370,190"
              stroke="#ff007f"
              strokeWidth="1.5"
              strokeOpacity="0.75"
            />

            {/* GLOWING VERTEX JUNCTION NODES */}
            <circle cx="250" cy="30" r="4.5" fill="#ffffff" />
            <circle cx="250" cy="270" r="4.5" fill="#ffffff" />
            <circle cx="180" cy="80" r="3.5" fill="#00f3ff" />
            <circle cx="180" cy="220" r="3.5" fill="#00f3ff" />
            <circle cx="320" cy="80" r="3.5" fill="#ff007f" />
            <circle cx="320" cy="220" r="3.5" fill="#ff007f" />
            <circle cx="250" cy="150" r="5" fill="#ffffff" />
            <circle cx="130" cy="150" r="3" fill="#00f3ff" />
            <circle cx="370" cy="150" r="3" fill="#ff007f" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
};
