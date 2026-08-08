import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Brain,
  Activity,
  ShieldAlert,
  TrendingUp,
  Moon,
  Volume2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Play,
  Heart,
  ChevronRight,
  Compass,
  Zap,
} from 'lucide-react';
import { ConditionProfile, JournalEntry } from '../types';

interface AIToolsHubProps {
  selectedCondition?: ConditionProfile;
  journalEntries?: JournalEntry[];
  onOpenBreathing?: () => void;
}

type ToolType = 'CBT_REFRAME' | 'SOMATIC' | 'PANIC' | 'INSIGHTS' | 'MEDITATION' | 'SLEEP';

export const AIToolsHub: React.FC<AIToolsHubProps> = ({
  selectedCondition,
  journalEntries = [],
  onOpenBreathing,
}) => {
  const [activeTool, setActiveTool] = useState<ToolType>('CBT_REFRAME');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tool 1: CBT Reframe State
  const [negativeThought, setNegativeThought] = useState('');
  const [cbtResult, setCbtResult] = useState<any>(null);

  // Tool 2: Somatic Grounding State
  const [environment, setEnvironment] = useState('Desk/Work');
  const [distressLevel, setDistressLevel] = useState(7);
  const [somaticResult, setSomaticResult] = useState<any>(null);

  // Tool 3: Panic De-escalation State
  const [panicMsg, setPanicMsg] = useState('My chest feels tight and my heart is racing. I feel like losing control.');
  const [panicResult, setPanicResult] = useState<any>(null);

  // Tool 4: Mood Insights State
  const [insightsResult, setInsightsResult] = useState<any>(null);

  // Tool 5: Guided Meditation State
  const [meditationTheme, setMeditationTheme] = useState('Cosmic Crystal Sanctuary');
  const [meditationMinutes, setMeditationMinutes] = useState(5);
  const [meditationResult, setMeditationResult] = useState<any>(null);

  // Tool 6: Sleep Story State
  const [sleepTopic, setSleepTopic] = useState('Drifting gently through soft glowing nebulae');
  const [sleepResult, setSleepResult] = useState<any>(null);

  // Audio playing state for TTS
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Helper to play TTS voice
  const handlePlayVoice = async (text: string) => {
    try {
      setIsPlayingAudio(true);
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.audio) {
        const audioBuffer = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0));
        const blob = new Blob([audioBuffer], { type: 'audio/pcm' });
        const audioUrl = URL.createObjectURL(blob);

        // Simple Audio playback using Web Audio API or HTML5 Audio
        const audio = new Audio(audioUrl);
        audio.play().catch(() => {});
        audio.onended = () => setIsPlayingAudio(false);
      } else {
        setIsPlayingAudio(false);
      }
    } catch {
      setIsPlayingAudio(false);
    }
  };

  // Execution Handler for active tool
  const handleRunTool = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTool === 'CBT_REFRAME') {
        const res = await fetch('/api/gemini/cbt-reframe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ negativeThought, condition: selectedCondition || 'ALL' }),
        });
        const data = await res.json();
        if (data.success) setCbtResult(data);
        else setError(data.error || 'Failed to generate reframes');
      } else if (activeTool === 'SOMATIC') {
        const res = await fetch('/api/gemini/somatic-grounding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ environment, distressLevel, condition: selectedCondition || 'ALL' }),
        });
        const data = await res.json();
        if (data.success) setSomaticResult(data);
        else setError(data.error || 'Failed to generate grounding exercise');
      } else if (activeTool === 'PANIC') {
        const res = await fetch('/api/gemini/panic-deescalate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: panicMsg, condition: selectedCondition || 'ALL' }),
        });
        const data = await res.json();
        if (data.success) setPanicResult(data);
        else setError(data.error || 'Failed to process panic response');
      } else if (activeTool === 'INSIGHTS') {
        const res = await fetch('/api/gemini/mood-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ journalEntries, condition: selectedCondition || 'ALL' }),
        });
        const data = await res.json();
        if (data.success) setInsightsResult(data);
        else setError(data.error || 'Failed to analyze mood patterns');
      } else if (activeTool === 'MEDITATION') {
        const res = await fetch('/api/gemini/guided-meditation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            theme: meditationTheme,
            targetState: 'Deep Relaxation',
            durationMinutes: meditationMinutes,
          }),
        });
        const data = await res.json();
        if (data.success) setMeditationResult(data);
        else setError(data.error || 'Failed to generate meditation');
      } else if (activeTool === 'SLEEP') {
        const res = await fetch('/api/gemini/sleep-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: sleepTopic, lengthMinutes: 5 }),
        });
        const data = await res.json();
        if (data.success) setSleepResult(data);
        else setError(data.error || 'Failed to generate sleep story');
      }
    } catch (err: any) {
      setError(err?.message || 'Server connection issue');
    } finally {
      setLoading(false);
    }
  };

  const TOOLS = [
    {
      id: 'CBT_REFRAME' as ToolType,
      title: 'Cognitive Reframer',
      badge: 'CBT Tool',
      icon: Brain,
      color: 'from-pink-500 to-purple-600 text-pink-300 border-pink-500/40',
      desc: 'Transform negative or catastrophizing thoughts into 3 balanced, realistic perspectives.',
    },
    {
      id: 'SOMATIC' as ToolType,
      title: 'Somatic Grounding',
      badge: 'Sensory Scan',
      icon: Activity,
      color: 'from-cyan-500 to-blue-600 text-cyan-300 border-cyan-500/40',
      desc: 'Custom 5-4-3-2-1 physical sensory grounding exercise tailored to your exact setting.',
    },
    {
      id: 'PANIC' as ToolType,
      title: 'Panic Crisis Companion',
      badge: 'DBT TIPP',
      icon: ShieldAlert,
      color: 'from-rose-500 to-pink-600 text-rose-300 border-rose-500/40',
      desc: 'Instant breath-by-breath crisis de-escalation & cold-water TIPP skills for acute anxiety.',
    },
    {
      id: 'INSIGHTS' as ToolType,
      title: 'Mood & Trigger Insights',
      badge: 'Analytics',
      icon: TrendingUp,
      color: 'from-purple-500 to-indigo-600 text-purple-300 border-purple-500/40',
      desc: 'Analyze recent journal themes and mood logs to spot hidden stress triggers.',
    },
    {
      id: 'MEDITATION' as ToolType,
      title: 'Guided Visualization',
      badge: 'Mindfulness',
      icon: Compass,
      color: 'from-teal-500 to-emerald-600 text-teal-300 border-teal-500/40',
      desc: 'Bespoke multi-sensory guided imagery scripts with AI voice guidance options.',
    },
    {
      id: 'SLEEP' as ToolType,
      title: 'Sleep Wind-Down Story',
      badge: 'Sleep Aide',
      icon: Moon,
      color: 'from-indigo-500 to-cyan-600 text-indigo-300 border-indigo-500/40',
      desc: 'Hypnotic, slow-tempo bedtime stories designed to slow racing thoughts before sleep.',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-4 space-y-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>6 Gemini AI Mental Health Tools Active</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Cosmic AI Therapeutic Suite
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
          Evidence-based CBT, DBT TIPP skills, somatic grounding, and personalized AI wind-downs tailored for neurodivergent mind support.
        </p>
      </div>

      {/* Grid Selector for 6 Tools */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const isSelected = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              className={`p-3 sm:p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900/90 border-cyan-400 shadow-[0_0_20px_rgba(0,243,255,0.25)] scale-[1.02]'
                  : 'bg-black/60 border-white/10 hover:border-white/30 text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${t.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${t.color}`}>
                  {t.badge}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white">{t.title}</h3>
                <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-snug">
                  {t.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Tool Workstation Card */}
      <div className="rounded-2xl bg-black/80 border border-cyan-500/30 backdrop-blur-xl p-4 sm:p-6 shadow-[0_0_30px_rgba(0,243,255,0.1)] space-y-6">
        {/* TOOL 1: CBT REFRAME */}
        {activeTool === 'CBT_REFRAME' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Brain className="w-5 h-5 text-pink-400" />
              <div>
                <h3 className="font-bold text-base text-white">AI Cognitive Reframing Assistant</h3>
                <p className="text-xs text-gray-400">Identify cognitive distortions and generate 3 balanced perspectives.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-cyan-300">Enter Automatic Negative Thought:</label>
              <textarea
                value={negativeThought}
                onChange={(e) => setNegativeThought(e.target.value)}
                placeholder="e.g., 'I made a small mistake at work, now everyone thinks I'm incompetent and I'm going to get fired.'"
                className="w-full h-24 p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              onClick={handleRunTool}
              disabled={loading || !negativeThought.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,0,127,0.3)] hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{loading ? 'Reframing Thought with CBT...' : 'Transform Thought with CBT'}</span>
            </button>

            {cbtResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
                <div className="p-3 rounded-xl bg-pink-950/30 border border-pink-500/30 space-y-1">
                  <span className="text-[11px] font-mono text-pink-300 uppercase">Identified Distortions:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {cbtResult.identifiedDistortions?.map((d: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-200 border border-pink-500/40 font-mono">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono text-cyan-300 uppercase">Balanced Cognitive Reframes:</span>
                  {cbtResult.reframes?.map((rf: string, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs sm:text-sm text-gray-200 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{rf}</span>
                    </div>
                  ))}
                </div>

                {cbtResult.groundingStatement && (
                  <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs text-purple-200 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <span className="font-mono text-[10px] text-purple-300 uppercase block">Daily Anchor Statement:</span>
                      <p className="font-medium italic">"{cbtResult.groundingStatement}"</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* TOOL 2: SOMATIC GROUNDING */}
        {activeTool === 'SOMATIC' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Activity className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="font-bold text-base text-white">AI Somatic Grounding Exercise Generator</h3>
                <p className="text-xs text-gray-400">Custom 5-4-3-2-1 sensory scan tailored to your setting.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono text-cyan-300">Current Setting / Environment:</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-xs"
                >
                  <option value="Desk/Work">At Work / Desk</option>
                  <option value="Bed/Late Night">In Bed / Late Night</option>
                  <option value="Public Place">Public Space / Crowded</option>
                  <option value="Commute/Car">Commute / In Vehicle</option>
                  <option value="Home Living Room">Home Sanctuary</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-cyan-300">Distress Level (1-10): {distressLevel}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={distressLevel}
                  onChange={(e) => setDistressLevel(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            <button
              onClick={handleRunTool}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:opacity-90 transition"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span>{loading ? 'Generating Somatic Exercise...' : 'Generate Somatic Grounding'}</span>
            </button>

            {somaticResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 space-y-1">
                  <h4 className="font-bold text-sm text-cyan-300">{somaticResult.title}</h4>
                  <p className="text-xs text-gray-300"><strong>Posture:</strong> {somaticResult.physicalPosture}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-black/60 border border-white/10 space-y-1">
                    <span className="font-mono text-cyan-300 font-bold">👀 5 Things to See:</span>
                    <ul className="list-disc list-inside text-gray-300 space-y-0.5">
                      {somaticResult.sensorySteps?.see?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/60 border border-white/10 space-y-1">
                    <span className="font-mono text-pink-300 font-bold">✋ 4 Things to Touch:</span>
                    <ul className="list-disc list-inside text-gray-300 space-y-0.5">
                      {somaticResult.sensorySteps?.touch?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>

                {somaticResult.tactileFocusGuide && (
                  <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs text-blue-200">
                    <span className="font-mono text-blue-300 font-bold block mb-1">1-Minute Tactile Anchor:</span>
                    <p>{somaticResult.tactileFocusGuide}</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* TOOL 3: PANIC DE-ESCALATION */}
        {activeTool === 'PANIC' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
              <div>
                <h3 className="font-bold text-base text-white">AI Acute Panic & Crisis Companion</h3>
                <p className="text-xs text-gray-400">Immediate DBT TIPP skills & slow breath pacing for intense anxiety.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-rose-300">Describe What You Feel Right Now:</label>
              <textarea
                value={panicMsg}
                onChange={(e) => setPanicMsg(e.target.value)}
                className="w-full h-20 p-3 rounded-xl bg-slate-900/90 border border-rose-500/30 text-white text-xs sm:text-sm focus:outline-none focus:border-rose-400"
              />
            </div>

            <button
              onClick={handleRunTool}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:opacity-90 transition"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              <span>{loading ? 'Connecting Soothing Guide...' : 'Start Crisis De-escalation'}</span>
            </button>

            {panicResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 space-y-2">
                  <p className="text-sm font-medium text-rose-100 italic leading-relaxed">
                    "{panicResult.reassurance}"
                  </p>
                  <button
                    onClick={() => handlePlayVoice(panicResult.reassurance)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 text-rose-200 border border-rose-500/40 text-xs font-mono hover:bg-rose-500/30 transition"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isPlayingAudio ? 'Speaking Voice...' : 'Listen to Voice'}</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/30 space-y-1">
                  <span className="text-xs font-mono text-cyan-300 font-bold block">💧 DBT TIPP Physical Skill:</span>
                  <p className="text-xs text-gray-200">{panicResult.tippSkill}</p>
                </div>

                <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-1">
                  <span className="text-xs font-mono text-purple-300 font-bold block">🫁 Breath Pacing Guide:</span>
                  <p className="text-xs text-gray-200">{panicResult.breathPacingGuide}</p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* TOOL 4: MOOD INSIGHTS */}
        {activeTool === 'INSIGHTS' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-bold text-base text-white">AI Mood Pattern & Trigger Analyzer</h3>
                <p className="text-xs text-gray-400">Discover hidden stress triggers and emotional cycles from your entries.</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 bg-purple-950/30 p-3 rounded-xl border border-purple-500/30">
              Analyzes your {journalEntries.length} saved journal logs to identify subtle stress patterns, burnout cycles, and neurodivergent-friendly coping adjustments.
            </p>

            <button
              onClick={handleRunTool}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:opacity-90 transition"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              <span>{loading ? 'Analyzing Mood Logs...' : 'Run Mood Pattern Analysis'}</span>
            </button>

            {insightsResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/40 border border-purple-500/40">
                  <span className="text-xs font-mono text-purple-300">Emotional Stability Score:</span>
                  <span className="text-lg font-bold text-pink-300 font-mono">{insightsResult.wellnessScoreEstimate || 80}/100</span>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
                  <span className="text-xs font-mono text-cyan-300 font-bold block">🎯 Detected Triggers:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {insightsResult.detectedTriggers?.map((tr: string, i: number) => (
                      <span key={i} className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 font-mono">
                        {tr}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
                  <span className="text-xs font-mono text-pink-300 font-bold block">🧠 Neurodivergent Pattern Insight:</span>
                  <p className="text-xs text-gray-300">{insightsResult.neurodivergentInsight}</p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* TOOL 5: GUIDED MEDITATION */}
        {activeTool === 'MEDITATION' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Compass className="w-5 h-5 text-teal-400" />
              <div>
                <h3 className="font-bold text-base text-white">AI Guided Visualization Sculptor</h3>
                <p className="text-xs text-gray-400">Bespoke multi-sensory guided meditation scripts with optional voice guidance.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono text-teal-300">Visualization Theme:</label>
                <input
                  type="text"
                  value={meditationTheme}
                  onChange={(e) => setMeditationTheme(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-teal-500/30 text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-teal-300">Duration: {meditationMinutes} Minutes</label>
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={meditationMinutes}
                  onChange={(e) => setMeditationMinutes(Number(e.target.value))}
                  className="w-full accent-teal-400"
                />
              </div>
            </div>

            <button
              onClick={handleRunTool}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:opacity-90 transition"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
              <span>{loading ? 'Sculpting Visualization...' : 'Sculpt Guided Meditation'}</span>
            </button>

            {meditationResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
                <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-teal-300">{meditationResult.title}</h4>
                    <button
                      onClick={() => handlePlayVoice(meditationResult.fullSpokenScript || meditationResult.title)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-200 border border-teal-500/40 text-xs font-mono hover:bg-teal-500/30"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isPlayingAudio ? 'Reading...' : 'Listen AI Voice'}</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-xs text-gray-300 mt-2">
                    {meditationResult.visualizationScenes?.map((sc: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-lg bg-black/50 border border-white/10 space-y-1">
                        <span className="font-mono text-teal-300 font-bold">{sc.phase}:</span>
                        <p>{sc.guidanceText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* TOOL 6: SLEEP STORY */}
        {activeTool === 'SLEEP' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Moon className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-bold text-base text-white">AI Bedtime Wind-Down Storyteller</h3>
                <p className="text-xs text-gray-400">Hypnotic, slow-tempo bedtime stories to quiet late-night racing thoughts.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-indigo-300">Story Topic or Setting:</label>
              <input
                type="text"
                value={sleepTopic}
                onChange={(e) => setSleepTopic(e.target.value)}
                placeholder="e.g. Floating quietly through a starlight crystal ocean"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-indigo-500/30 text-white text-xs sm:text-sm"
              />
            </div>

            <button
              onClick={handleRunTool}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:opacity-90 transition"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Moon className="w-4 h-4" />}
              <span>{loading ? 'Crafting Bedtime Story...' : 'Generate Wind-Down Story'}</span>
            </button>

            {sleepResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
                <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-indigo-200">{sleepResult.title}</h4>
                    <button
                      onClick={() => handlePlayVoice(sleepResult.storyParagraphs?.join(' '))}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 text-xs font-mono hover:bg-indigo-500/30"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isPlayingAudio ? 'Reading Bedtime Voice...' : 'Listen Voice'}</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-xs text-indigo-100/90 leading-relaxed font-sans">
                    {sleepResult.storyParagraphs?.map((p: string, i: number) => (
                      <p key={i} className="p-2 rounded-lg bg-black/40 border border-white/5">{p}</p>
                    ))}
                  </div>

                  {sleepResult.driftOffAffirmation && (
                    <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-center text-xs text-cyan-200 italic">
                      "{sleepResult.driftOffAffirmation}"
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Display Error Message if any */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
