import React from 'react';
import { ConditionProfile } from '../types';
import { DISORDER_PROFILES } from '../data/disorders';
import { Sparkles, HeartHandshake, Activity, SunMedium, Zap } from 'lucide-react';

interface ProfileSelectorProps {
  selected: ConditionProfile;
  onSelect: (condition: ConditionProfile) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-4 h-4" />,
  HeartHandshake: <HeartHandshake className="w-4 h-4" />,
  Activity: <Activity className="w-4 h-4" />,
  SunMedium: <SunMedium className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
};

export const DisorderProfileSelector: React.FC<ProfileSelectorProps> = ({ selected, onSelect }) => {
  return (
    <div className="w-full max-w-2xl mx-auto px-3 my-2 z-10">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400/80">
          Neuro-Divergent Profile Mode:
        </span>
        <span className="text-[10px] text-gray-400">
          Tailors Gemini AI & Coping Skills
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {DISORDER_PROFILES.map((profile) => {
          const isSelected = selected === profile.id;
          return (
            <button
              key={profile.id}
              onClick={() => onSelect(profile.id)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-950/90 to-pink-950/90 text-white border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.5)] scale-105'
                  : 'bg-black/50 hover:bg-black/80 text-gray-400 border-gray-800 hover:border-gray-700'
              }`}
            >
              <span className={isSelected ? 'text-cyan-300' : 'text-gray-500'}>
                {ICON_MAP[profile.icon]}
              </span>
              <span>{profile.id === 'ALL' ? 'ALL' : profile.id}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
