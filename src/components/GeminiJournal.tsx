import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Brain, Send, BookOpen, Lightbulb, CheckCircle, ShieldAlert, Heart, RefreshCcw, Volume2, VolumeX } from 'lucide-react';
import { ConditionProfile, JournalEntry, JournalAnalysis } from '../types';
import { DISORDER_PROFILES } from '../data/disorders';
import { speakAIVoice } from '../utils/audio';

interface GeminiJournalProps {
  selectedCondition: ConditionProfile;
  entries: JournalEntry[];
  onAddEntry: (entry: JournalEntry) => void;
  onSelectBreathingFromJournal: (tech: 'RECOVERY' | 'BOX' | '4-7-8') => void;
}

export const GeminiJournal: React.FC<GeminiJournalProps> = ({
  selectedCondition,
  entries,
  onAddEntry,
  onSelectBreathingFromJournal,
}) => {
  const [content, setContent] = useState('');
  const [moodScore, setMoodScore] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<JournalAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');

  const profile = DISORDER_PROFILES.find((p) => p.id === selectedCondition) || DISORDER_PROFILES[0];

  const handleApplyPrompt = (promptText: string) => {
    setContent((prev) => (prev ? `${prev}\n${promptText}` : promptText));
  };

  const handleSubmitJournal = async () => {
    if (!content.trim()) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          condition: selectedCondition,
          moodScore,
        }),
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        setLatestAnalysis(data.analysis);
        const newEntry: JournalEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          content,
          moodScore,
          condition: selectedCondition,
          aiAnalysis: data.analysis,
        };
        onAddEntry(newEntry);
        setContent('');
      } else {
        // Fallback analysis if API responds with default
        const fallbackAnalysis: JournalAnalysis = {
          summary: 'Your feelings have been received and validated in this safe space.',
          emotionalState: 'Processing Emotional Energy',
          disorderInsights: 'DBT validation technique: You are allowed to feel intensely without acting immediately.',
          dbtOrCbtTechnique: 'TIPP Skill: Temperature change or slow deep breathing.',
          recommendedBreathing: 'RECOVERY',
          actionableMicroSteps: ['Drink a cool glass of water', 'Take 3 Recovery breaths', 'Unclench jaw'],
          encouragingAffirmation: 'You are worthy of space and compassion in this cosmic moment.',
        };
        setLatestAnalysis(fallbackAnalysis);
      }
    } catch (err) {
      console.error('Error submitting journal to Gemini:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 text-white z-10 relative">
      {/* Header Tabs */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-pink-400" />
          <h3 className="font-bold text-lg text-cyan-300">Gemini AI Neuro Journal</h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('NEW')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              activeTab === 'NEW'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Write Entry
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              activeTab === 'HISTORY'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            History ({entries.length})
          </button>
        </div>
      </div>

      {activeTab === 'NEW' ? (
        <div className="space-y-4">
          {/* Quick Condition Prompts */}
          <div className="p-3 rounded-2xl bg-black/50 border border-purple-500/30 backdrop-blur-md">
            <div className="text-xs text-purple-300 font-semibold mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>{profile.name} Prompts:</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {profile.prompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPrompt(p)}
                  className="text-left text-xs text-gray-300 hover:text-cyan-300 p-2 rounded-xl bg-gray-900/60 hover:bg-gray-800 transition border border-gray-800/80"
                >
                  "{p}"
                </button>
              ))}
            </div>
          </div>

          {/* Mood Slider */}
          <div className="p-3 rounded-2xl bg-black/50 border border-cyan-500/20 backdrop-blur-md flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300">Current Emotional State Score:</span>
              <span className="font-mono font-bold text-cyan-300">{moodScore} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={moodScore}
              onChange={(e) => setMoodScore(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-gray-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>1 - Intense Distress / Splitting</span>
              <span>5 - Neutral / Grounded</span>
              <span>10 - High Energy / Euphoria</span>
            </div>
          </div>

          {/* Journal Input Field */}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Unload your thoughts freely... Safe space for ${selectedCondition} feelings, brain dumps, or mood triggers.`}
              rows={5}
              className="w-full p-4 rounded-2xl bg-black/70 border border-cyan-500/40 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 backdrop-blur-md resize-none shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            />

            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] text-gray-400 font-mono">
                Gemini AI will analyze for DBT skills & micro-steps
              </span>

              <button
                onClick={handleSubmitJournal}
                disabled={isLoading || !content.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-pink-500 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:brightness-110 disabled:opacity-50 transition shadow-[0_0_15px_rgba(0,243,255,0.4)]"
              >
                {isLoading ? (
                  <>
                    <RefreshCcw className="w-4 h-4 animate-spin text-black" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Analyze with Gemini</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Gemini AI Analysis Results Card */}
          <AnimatePresence>
            {latestAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/80 via-purple-950/80 to-pink-950/80 border border-cyan-400 backdrop-blur-md space-y-3.5 shadow-[0_0_25px_rgba(0,243,255,0.3)]"
              >
                <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-300" />
                    <span className="font-bold text-sm text-cyan-300">Gemini Therapeutic Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        speakAIVoice(
                          `${latestAnalysis.summary}. Recommended coping tool: ${latestAnalysis.dbtOrCbtTechnique}. ${latestAnalysis.encouragingAffirmation}`
                        )
                      }
                      className="px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition"
                      title="Read aloud with selected Gemini AI voice"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Listen</span>
                    </button>
                    <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-xs font-mono border border-pink-500/30">
                      {latestAnalysis.emotionalState}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-200 leading-relaxed italic">
                  "{latestAnalysis.summary}"
                </p>

                {/* DBT / CBT Skill */}
                <div className="p-3 rounded-xl bg-purple-900/30 border border-purple-500/40 text-xs text-purple-200">
                  <span className="font-bold text-purple-300 flex items-center gap-1.5 mb-1">
                    <Lightbulb className="w-4 h-4 text-amber-300" /> Recommended Coping Tool:
                  </span>
                  <p>{latestAnalysis.dbtOrCbtTechnique}</p>
                </div>

                {/* Recommended Breathing Session Trigger */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/40">
                  <div>
                    <span className="text-xs text-gray-300 block">Suggested Breathing:</span>
                    <span className="text-sm font-bold text-cyan-300">{latestAnalysis.recommendedBreathing} Breathing</span>
                  </div>
                  <button
                    onClick={() => onSelectBreathingFromJournal(latestAnalysis.recommendedBreathing)}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-400 text-black font-bold text-xs uppercase hover:bg-cyan-300 shadow-[0_0_10px_#00f3ff]"
                  >
                    Start Now
                  </button>
                </div>

                {/* Actionable Micro-steps */}
                <div>
                  <span className="text-xs font-bold text-pink-300 block mb-1.5">Actionable Micro-Steps:</span>
                  <ul className="space-y-1">
                    {latestAnalysis.actionableMicroSteps.map((step, idx) => (
                      <li key={idx} className="text-xs text-gray-300 flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cosmic Affirmation */}
                <div className="text-center pt-2 border-t border-purple-500/30">
                  <span className="text-xs text-pink-300 font-mono italic">
                    ✨ "{latestAnalysis.encouragingAffirmation}"
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* HISTORY TAB */
        <div className="space-y-3">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No journal entries logged yet. Write your first reflection above.
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-2xl bg-black/60 border border-gray-800 space-y-2 backdrop-blur-md"
              >
                <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                  <span>{new Date(entry.timestamp).toLocaleString()}</span>
                  <span className="text-cyan-400 font-bold">Mood: {entry.moodScore}/10</span>
                </div>
                <p className="text-sm text-gray-200">{entry.content}</p>
                {entry.aiAnalysis && (
                  <div className="mt-2 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200">
                    <span className="font-bold text-cyan-400 block">Gemini Note:</span>
                    {entry.aiAnalysis.summary}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
