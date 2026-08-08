import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX, Play, Pause, Sparkles, CheckCircle2, CloudRain, Radio, Music, Activity } from 'lucide-react';
import { BreathingTechnique, BreathingPhase, ConditionProfile } from '../types';
import { CrystalLatticeVisualizer } from './CrystalLatticeVisualizer';
import {
  speakAIVoice,
  playPhaseChime,
  startAmbientSound,
  stopAmbientSound,
  AmbientSoundType,
  setGuidanceVoiceVolume,
  getGuidanceVoiceVolume,
  setAmbientVolume,
  getAmbientVolume,
} from '../utils/audio';

interface BreathingScreenProps {
  selectedCondition: ConditionProfile;
  onSessionComplete: (technique: BreathingTechnique, durationMinutes: number) => void;
}

export const BreathingScreen: React.FC<BreathingScreenProps> = ({
  selectedCondition,
  onSessionComplete,
}) => {
  const [activeTechnique, setActiveTechnique] = useState<BreathingTechnique>('RECOVERY');
  const [isActive, setIsActive] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(4);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceVolume, setVoiceVolumeState] = useState(getGuidanceVoiceVolume());
  const [ambientVolume, setAmbientVolumeState] = useState(getAmbientVolume());
  const [ambientType, setAmbientType] = useState<AmbientSoundType>('rain');
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [showCalmCelebration, setShowCalmCelebration] = useState(false);

  const handleVoiceVolumeChange = (newVol: number) => {
    setVoiceVolumeState(newVol);
    setGuidanceVoiceVolume(newVol);
  };

  const handleAmbientVolumeChange = (newVol: number) => {
    setAmbientVolumeState(newVol);
    setAmbientVolume(newVol);
  };

  // Helper for navigator.vibrate() haptic pulses
  const triggerHapticPulse = (pattern: number | number[]) => {
    if (hapticsEnabled && typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Safe fallback if unsupported or blocked in iframe
      }
    }
  };

  // Define phase timings for the 3 techniques
  const getPhaseSequence = (tech: BreathingTechnique) => {
    switch (tech) {
      case 'RECOVERY':
        return [
          { phase: 'IN' as BreathingPhase, label: 'Breathe In...', durationSeconds: 4, voice: 'Breathe in slowly through your nose...' },
          { phase: 'IN_EXTRA' as BreathingPhase, label: 'Deepen Inhale...', durationSeconds: 2, voice: 'Take a second quick sip of air...' },
          { phase: 'OUT' as BreathingPhase, label: 'Breathe Out...', durationSeconds: 6, voice: 'Long, slow exhale through your mouth...' },
        ];
      case 'BOX':
        return [
          { phase: 'IN' as BreathingPhase, label: 'Breathe In...', durationSeconds: 4, voice: 'Breathe in deeply...' },
          { phase: 'HOLD_IN' as BreathingPhase, label: 'Hold...', durationSeconds: 4, voice: 'Hold your breath softly...' },
          { phase: 'OUT' as BreathingPhase, label: 'Breathe Out...', durationSeconds: 4, voice: 'Exhale slowly...' },
          { phase: 'HOLD_OUT' as BreathingPhase, label: 'Hold...', durationSeconds: 4, voice: 'Hold peacefully...' },
        ];
      case 'FOUR_SEVEN_EIGHT':
        return [
          { phase: 'IN' as BreathingPhase, label: 'Breathe In...', durationSeconds: 4, voice: 'Breathe in for four seconds...' },
          { phase: 'HOLD_IN' as BreathingPhase, label: 'Hold...', durationSeconds: 7, voice: 'Hold gently for seven seconds...' },
          { phase: 'OUT' as BreathingPhase, label: 'Breathe Out...', durationSeconds: 8, voice: 'Release slowly for eight seconds...' },
        ];
    }
  };

  const phases = getPhaseSequence(activeTechnique);
  const currentPhaseConfig = phases[currentPhaseIndex] || phases[0];

  // Manage ambient sound state (Rain, White Noise, Cosmic Drone, Mute)
  useEffect(() => {
    if (isActive && ambientType !== 'off') {
      startAmbientSound(ambientType, ambientVolume);
    } else {
      stopAmbientSound();
    }
    return () => stopAmbientSound();
  }, [isActive, ambientType, ambientVolume]);

  // Handle technique change
  const handleSelectTechnique = (tech: BreathingTechnique) => {
    setActiveTechnique(tech);
    setCurrentPhaseIndex(0);
    const newPhases = getPhaseSequence(tech);
    setSecondsRemaining(newPhases[0].durationSeconds);
  };

  // Trigger phase transition voice guidance & haptic pulse
  const triggerPhaseVoice = (instructionText: string, phaseType?: BreathingPhase) => {
    const isHold = phaseType === 'HOLD_IN' || phaseType === 'HOLD_OUT';
    playPhaseChime(currentPhaseConfig.phase === 'IN' ? 528 : 432);

    // Haptic pulse on phase change
    if (isHold) {
      triggerHapticPulse([40, 60, 40]);
    } else {
      triggerHapticPulse(35);
    }

    if (voiceEnabled) {
      speakAIVoice(instructionText);
    }
  };

  // Start / Pause breathing session
  const toggleSession = () => {
    if (!isActive) {
      setIsActive(true);
      triggerPhaseVoice(currentPhaseConfig.voice, currentPhaseConfig.phase);
    } else {
      setIsActive(false);
    }
  };

  // Timer loop for breathing session
  useEffect(() => {
    let timer: any = null;

    if (isActive) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (currentPhaseConfig.phase === 'HOLD_IN' || currentPhaseConfig.phase === 'HOLD_OUT') {
            triggerHapticPulse(25);
          }

          if (prev <= 1) {
            const nextIdx = (currentPhaseIndex + 1) % phases.length;
            if (nextIdx === 0) {
              setCompletedCycles((c) => c + 1);
            }
            setCurrentPhaseIndex(nextIdx);
            const nextPhase = phases[nextIdx];
            triggerPhaseVoice(nextPhase.voice, nextPhase.phase);
            return nextPhase.durationSeconds;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isActive, currentPhaseIndex, activeTechnique, voiceEnabled, hapticsEnabled]);

  // Handle "I FEEL CALM" button click
  const handleIFeelCalm = () => {
    setIsActive(false);
    setShowCalmCelebration(true);
    speakAIVoice("Wonderful job re-centering yourself. You are grounded and calm.");
    onSessionComplete(activeTechnique, Math.max(1, Math.round((completedCycles * 15) / 60)));

    setTimeout(() => {
      setShowCalmCelebration(false);
    }, 4500);
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-between min-h-[580px] p-4 text-white relative z-10">
      {/* Top Audio & Voice Controls */}
      <div className="w-full flex items-center justify-between px-2 text-xs text-cyan-300 font-mono bg-black/40 p-2.5 rounded-2xl border border-cyan-500/20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
              voiceEnabled ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'bg-gray-800 text-gray-500'
            }`}
            title="Voice Guidance On/Off"
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            <span>{voiceEnabled ? 'Voice ON' : 'Voice OFF'}</span>
          </button>

          <button
            onClick={() => speakAIVoice("Breathe in slowly and feel the calm.")}
            className="px-2 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-900/70 border border-purple-500/30 text-[10px] text-purple-300 transition"
          >
            Test
          </button>

          <button
            onClick={() => {
              const nextState = !hapticsEnabled;
              setHapticsEnabled(nextState);
              if (nextState) triggerHapticPulse([40, 60, 40]);
            }}
            className={`px-2 py-1.5 rounded-xl flex items-center gap-1 transition ${
              hapticsEnabled ? 'bg-pink-500/20 text-pink-300 border border-pink-500/50' : 'bg-gray-800 text-gray-500'
            }`}
            title="Haptic Vibration Pulses On/Off"
          >
            <Activity className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-[10px]">{hapticsEnabled ? 'Haptics ON' : 'Haptics OFF'}</span>
          </button>
        </div>

        <button
          onClick={toggleSession}
          className={`px-4 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
            isActive
              ? 'bg-pink-600 hover:bg-pink-700 text-white shadow-[0_0_15px_rgba(255,0,127,0.6)]'
              : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_15px_rgba(0,243,255,0.6)]'
          }`}
        >
          {isActive ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-black" />}
          <span>{isActive ? 'PAUSE' : 'START'}</span>
        </button>
      </div>

      {/* Central Expanding Sacred Geometry Crystal Lattice Visualizer */}
      <CrystalLatticeVisualizer
        phase={currentPhaseConfig.phase}
        phaseText={currentPhaseConfig.label}
        secondsRemaining={secondsRemaining}
        totalPhaseSeconds={currentPhaseConfig.durationSeconds}
      />

      {/* Completed Cycles Counter */}
      {completedCycles > 0 && (
        <div className="text-xs font-mono text-cyan-300/80 mb-2 flex items-center gap-1 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-500/30">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>{completedCycles} Cycles Completed</span>
        </div>
      )}

      {/* Calm Celebration Overlay */}
      {showCalmCelebration && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 rounded-3xl bg-black/90 border-2 border-cyan-400 backdrop-blur-xl text-center shadow-[0_0_50px_rgba(0,243,255,0.8)]"
        >
          <div className="p-4 rounded-full bg-cyan-500/20 text-cyan-300 mb-3 border border-cyan-400 animate-pulse">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-bold text-cyan-300 mb-1">Peace Restored</h3>
          <p className="text-sm text-gray-300 max-w-xs mb-4">
            Your nervous system is grounded. Your Wear OS heart rate is stabilizing.
          </p>
          <button
            onClick={() => setShowCalmCelebration(false)}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 text-black font-bold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(0,243,255,0.6)]"
          >
            Continue
          </button>
        </motion.div>
      )}

      {/* BOTTOM BUTTON CONTROLS */}
      <div className="w-full flex flex-col items-center gap-3 mt-2">
        {/* Three Rectangular Grey Technique Buttons Side-by-Side */}
        <div className="grid grid-cols-3 gap-2.5 w-full">
          <button
            onClick={() => handleSelectTechnique('RECOVERY')}
            className={`py-3.5 px-2 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all border ${
              activeTechnique === 'RECOVERY'
                ? 'bg-gray-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.4)] scale-102'
                : 'bg-gray-800/90 text-gray-300 border-gray-700 hover:bg-gray-700'
            }`}
          >
            RECOVERY
          </button>

          <button
            onClick={() => handleSelectTechnique('BOX')}
            className={`py-3.5 px-2 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all border ${
              activeTechnique === 'BOX'
                ? 'bg-gray-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.4)] scale-102'
                : 'bg-gray-800/90 text-gray-300 border-gray-700 hover:bg-gray-700'
            }`}
          >
            BOX
          </button>

          <button
            onClick={() => handleSelectTechnique('FOUR_SEVEN_EIGHT')}
            className={`py-3.5 px-2 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all border ${
              activeTechnique === 'FOUR_SEVEN_EIGHT'
                ? 'bg-gray-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.4)] scale-102'
                : 'bg-gray-800/90 text-gray-300 border-gray-700 hover:bg-gray-700'
            }`}
          >
            4-7-8
          </button>
        </div>

        {/* Wide Pill Outlined Cyan Button "I FEEL CALM" */}
        <button
          onClick={handleIFeelCalm}
          className="w-full py-3.5 rounded-full bg-black/60 border-2 border-cyan-400 text-cyan-300 font-bold text-sm md:text-base uppercase tracking-widest hover:bg-cyan-950/50 hover:shadow-[0_0_25px_rgba(0,243,255,0.8)] transition-all duration-300 shadow-[0_0_15px_rgba(0,243,255,0.4)]"
        >
          I FEEL CALM
        </button>

        {/* AUDIO MIX & VOLUME CONTROLS PANEL */}
        <div className="w-full mt-2 p-3.5 rounded-2xl bg-black/70 border border-cyan-500/30 backdrop-blur-md flex flex-col gap-3 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Session Audio Mix
            </span>
            <span className="text-[10px] font-mono text-cyan-300 uppercase">
              {ambientType === 'rain' ? 'Rain' : ambientType === 'whitenoise' ? 'White Noise' : ambientType === 'drone' ? 'Cosmic Drone' : 'Ambient Off'}
            </span>
          </div>

          {/* Guidance Voice Volume Slider */}
          <div className="flex flex-col gap-1.5 border-t border-gray-800 pt-2.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-gray-300">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                Guidance Voice Volume
              </span>
              <span className="text-[10px] font-mono text-cyan-300 font-bold">
                {Math.round(voiceVolume * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <VolumeX className="w-3 h-3 text-gray-500" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={voiceVolume}
                onChange={(e) => handleVoiceVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            </div>
          </div>

          {/* Ambient Soundscape Volume Slider */}
          <div className="flex flex-col gap-1.5 border-t border-gray-800 pt-2.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-gray-300">
              <span className="flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-pink-400" />
                Ambient Soundscape Volume
              </span>
              <span className="text-[10px] font-mono text-pink-300 font-bold">
                {Math.round(ambientVolume * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <VolumeX className="w-3 h-3 text-gray-500" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambientVolume}
                onChange={(e) => handleAmbientVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-pink-400 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
              <CloudRain className="w-3.5 h-3.5 text-pink-400" />
            </div>

            {/* Background Soundscape Type Buttons */}
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              <button
                onClick={() => {
                  setAmbientType('rain');
                  if (isActive) startAmbientSound('rain', ambientVolume);
                }}
                className={`py-2 px-1 rounded-xl text-[10px] font-semibold transition flex flex-col items-center justify-center gap-0.5 border ${
                  ambientType === 'rain'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,243,255,0.3)]'
                    : 'bg-gray-800/80 border-gray-700 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5 text-cyan-300" />
                <span>Rain</span>
              </button>

              <button
                onClick={() => {
                  setAmbientType('whitenoise');
                  if (isActive) startAmbientSound('whitenoise', ambientVolume);
                }}
                className={`py-2 px-1 rounded-xl text-[10px] font-semibold transition flex flex-col items-center justify-center gap-0.5 border ${
                  ambientType === 'whitenoise'
                    ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                    : 'bg-gray-800/80 border-gray-700 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-purple-300" />
                <span>White Noise</span>
              </button>

              <button
                onClick={() => {
                  setAmbientType('drone');
                  if (isActive) startAmbientSound('drone', ambientVolume);
                }}
                className={`py-2 px-1 rounded-xl text-[10px] font-semibold transition flex flex-col items-center justify-center gap-0.5 border ${
                  ambientType === 'drone'
                    ? 'bg-pink-500/20 border-pink-400 text-pink-200 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                    : 'bg-gray-800/80 border-gray-700 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Music className="w-3.5 h-3.5 text-pink-300" />
                <span>Drone</span>
              </button>

              <button
                onClick={() => {
                  setAmbientType('off');
                  stopAmbientSound();
                }}
                className={`py-2 px-1 rounded-xl text-[10px] font-semibold transition flex flex-col items-center justify-center gap-0.5 border ${
                  ambientType === 'off'
                    ? 'bg-gray-700 border-gray-500 text-gray-200'
                    : 'bg-gray-800/80 border-gray-700 text-gray-500 hover:bg-gray-700'
                }`}
              >
                <VolumeX className="w-3.5 h-3.5 text-gray-400" />
                <span>Off</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
