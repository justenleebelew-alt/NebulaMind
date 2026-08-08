import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Heart, Copy, Check, Quote, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { ConditionProfile } from '../types';

interface DailyAffirmationBannerProps {
  selectedCondition?: ConditionProfile;
}

export interface Affirmation {
  id: string;
  quote: string;
  author?: string;
  category: 'Grounding' | 'Self-Compassion' | 'Resilience' | 'Inner Peace' | 'Mindfulness' | 'Hope';
  themeColor: string;
}

const AFFIRMATIONS: Affirmation[] = [
  {
    id: 'aff-1',
    quote: 'I am allowed to take up space and express my feelings without fear of judgment.',
    category: 'Self-Compassion',
    themeColor: 'from-pink-500/20 to-purple-600/20 text-pink-300 border-pink-500/40',
  },
  {
    id: 'aff-2',
    quote: 'My emotions are intense waves, but I am the deep, calm ocean beneath them.',
    category: 'Grounding',
    themeColor: 'from-cyan-500/20 to-blue-600/20 text-cyan-300 border-cyan-500/40',
  },
  {
    id: 'aff-3',
    quote: 'I pause, take a deep breath, and return to the present moment where peace resides.',
    category: 'Mindfulness',
    themeColor: 'from-emerald-500/20 to-teal-600/20 text-emerald-300 border-emerald-500/40',
  },
  {
    id: 'aff-4',
    quote: 'I am strong enough to handle this moment, and gentle enough to forgive myself.',
    category: 'Resilience',
    themeColor: 'from-purple-500/20 to-indigo-600/20 text-purple-300 border-purple-500/40',
  },
  {
    id: 'aff-5',
    quote: 'Like stars shining in the dark nebula, my light cannot be dimmed by momentary storms.',
    category: 'Hope',
    themeColor: 'from-amber-500/20 to-orange-600/20 text-amber-300 border-amber-500/40',
  },
  {
    id: 'aff-6',
    quote: 'I honor my journey. Small steps forward every day lead to profound quiet strength.',
    category: 'Inner Peace',
    themeColor: 'from-blue-500/20 to-cyan-600/20 text-blue-300 border-blue-500/40',
  },
  {
    id: 'aff-7',
    quote: 'I release the need to control everything. I trust my resilience and inner rhythm.',
    category: 'Grounding',
    themeColor: 'from-fuchsia-500/20 to-pink-600/20 text-fuchsia-300 border-fuchsia-500/40',
  },
  {
    id: 'aff-8',
    quote: 'Today, I choose peace over perfection, kindness over criticism, and breath over anxiety.',
    category: 'Self-Compassion',
    themeColor: 'from-teal-500/20 to-emerald-600/20 text-teal-300 border-teal-500/40',
  },
  {
    id: 'aff-9',
    quote: 'I am safe in my body. Every deep inhale brings clarity, every exhale releases tension.',
    category: 'Mindfulness',
    themeColor: 'from-cyan-500/20 to-indigo-600/20 text-cyan-200 border-cyan-400/40',
  },
  {
    id: 'aff-10',
    quote: 'My mind is a vast cosmic sky; thoughts and fears are merely passing clouds.',
    category: 'Inner Peace',
    themeColor: 'from-indigo-500/20 to-purple-600/20 text-indigo-300 border-indigo-500/40',
  },
  {
    id: 'aff-11',
    quote: 'I am worthy of unconditional love, happiness, and peace, exactly as I am right now.',
    category: 'Self-Compassion',
    themeColor: 'from-rose-500/20 to-pink-600/20 text-rose-300 border-rose-500/40',
  },
  {
    id: 'aff-12',
    quote: 'I possess the innate ability to navigate chaos with steady grace and calm focus.',
    category: 'Resilience',
    themeColor: 'from-violet-500/20 to-fuchsia-600/20 text-violet-300 border-violet-500/40',
  },
];

export const DailyAffirmationBanner: React.FC<DailyAffirmationBannerProps> = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('auracosmos_liked_affirmations');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Calculate deterministic daily index based on date string
  useEffect(() => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const dailyIdx = Math.abs(hash) % AFFIRMATIONS.length;
    setCurrentIndex(dailyIdx);
  }, []);

  // Time of day greeting getter
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { text: 'Good Morning', Icon: Sunrise, color: 'text-amber-300' };
    } else if (hour >= 12 && hour < 17) {
      return { text: 'Good Afternoon', Icon: Sun, color: 'text-cyan-300' };
    } else if (hour >= 17 && hour < 22) {
      return { text: 'Good Evening', Icon: Sunset, color: 'text-pink-300' };
    } else {
      return { text: 'Peaceful Night', Icon: Moon, color: 'text-purple-300' };
    }
  };

  const greeting = getTimeGreeting();
  const currentAffirmation = AFFIRMATIONS[currentIndex];
  const isLiked = !!liked[currentAffirmation.id];

  const handleShuffle = () => {
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * AFFIRMATIONS.length);
    } while (nextIdx === currentIndex && AFFIRMATIONS.length > 1);
    setCurrentIndex(nextIdx);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${currentAffirmation.quote}" — Nebula Mind Daily Affirmation`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleLike = () => {
    const updated = { ...liked, [currentAffirmation.id]: !isLiked };
    setLiked(updated);
    try {
      localStorage.setItem('auracosmos_liked_affirmations', JSON.stringify(updated));
    } catch {
      // localStorage fallback
    }
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-3 py-2">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-black/80 via-slate-900/90 to-black/80 border border-cyan-500/30 backdrop-blur-xl p-4 sm:p-5 shadow-[0_0_25px_rgba(0,243,255,0.15)] group">
        {/* Subtle Ambient Cosmic Glow background accent */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Row: Time Greeting + Date + Action Toolbar */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <greeting.Icon className={`w-4 h-4 ${greeting.color} animate-pulse`} />
            <span className={`text-xs font-bold tracking-wider uppercase font-mono ${greeting.color}`}>
              {greeting.text}
            </span>
            <span className="text-gray-500 text-xs">•</span>
            <span className="text-[11px] text-gray-400 font-mono">{todayFormatted}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border bg-black/40 ${currentAffirmation.themeColor}`}>
              {currentAffirmation.category}
            </span>

            <button
              onClick={handleShuffle}
              title="Get another positive affirmation"
              className="p-1.5 rounded-lg bg-cyan-950/40 text-cyan-300 hover:bg-cyan-500/20 hover:text-white border border-cyan-500/30 transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Affirmation Quote Body with Smooth Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAffirmation.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-3 py-1"
          >
            <Quote className="w-6 h-6 text-cyan-400/60 shrink-0 mt-0.5 rotate-180" />
            <div className="flex-1 space-y-1">
              <p className="text-sm sm:text-base font-medium text-white leading-relaxed tracking-wide font-sans">
                {currentAffirmation.quote}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Bar Controls: Copy & Favorite */}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5">
          <div className="flex items-center gap-1 text-[11px] text-cyan-300/80 font-mono">
            <Sparkles className="w-3 h-3 text-pink-400" />
            <span>Daily Cosmic Affirmation</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white border border-white/10 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-mono text-[11px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px]">Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleToggleLike}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                isLiked
                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/50 shadow-[0_0_12px_rgba(255,0,127,0.3)]'
                  : 'bg-white/5 text-gray-400 hover:text-pink-300 border-white/10'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-pink-400 text-pink-400' : ''}`} />
              <span className="font-mono text-[11px]">{isLiked ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
