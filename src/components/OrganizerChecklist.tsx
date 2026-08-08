import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Square, Plus, Sparkles, FileText, CalendarPlus, Trash2, ArrowRight, Zap, Target, CheckCircle2, AlertCircle, RefreshCw, Layers, Brain, Award } from 'lucide-react';
import { ChecklistItem, ChecklistCategory, ExtractedAppointmentSuggestion, MedicalAppointment, ConditionProfile } from '../types';

interface OrganizerChecklistProps {
  selectedCondition: ConditionProfile;
  checklistItems: ChecklistItem[];
  onToggleItem: (id: string) => void;
  onAddItem: (item: ChecklistItem) => void;
  onDeleteItem: (id: string) => void;
  onAddAppointmentFromAI: (app: MedicalAppointment) => void;
}

export const OrganizerChecklist: React.FC<OrganizerChecklistProps> = ({
  selectedCondition,
  checklistItems,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onAddAppointmentFromAI,
}) => {
  const [activeCategoryTab, setActiveCategoryTab] = useState<ChecklistCategory | 'ALL'>('ALL');

  // Medical Notes AI Extraction State
  const [medicalNotesText, setMedicalNotesText] = useState('');
  const [isExtractingNotes, setIsExtractingNotes] = useState(false);
  const [noteExtractionSummary, setNoteExtractionSummary] = useState<string | null>(null);
  const [extractedSuggestions, setExtractedSuggestions] = useState<ExtractedAppointmentSuggestion[]>([]);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Goal Breakdown Assistant State
  const [goalInput, setGoalInput] = useState('');
  const [goalCategory, setGoalCategory] = useState<ChecklistCategory>('SHORT_TERM_GOAL');
  const [isBreakingDownGoal, setIsBreakingDownGoal] = useState(false);

  // Manual Checklist Item State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ChecklistCategory>('DAILY_ROUTINE');

  // Category Filter
  const filteredItems = checklistItems.filter((item) => {
    if (activeCategoryTab === 'ALL') return true;
    return item.category === activeCategoryTab;
  });

  const completedCount = checklistItems.filter((i) => i.completed).length;
  const progressPercent = checklistItems.length > 0 ? Math.round((completedCount / checklistItems.length) * 100) : 0;

  // Handle AI Medical Note Scan
  const handleScanMedicalNotes = async () => {
    if (!medicalNotesText.trim()) return;

    setIsExtractingNotes(true);
    setExtractionError(null);

    try {
      const response = await fetch('/api/gemini/extract-medical-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicalNotes: medicalNotesText }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract appointments from medical notes');
      }

      setNoteExtractionSummary(data.summary || 'Extracted medical recommendations from visit notes.');
      setExtractedSuggestions(data.suggestedAppointments || []);
      setIsExtractingNotes(false);
    } catch (err: any) {
      console.error('Error scanning notes:', err);
      setExtractionError(err?.message || 'Error processing notes with AI');
      setIsExtractingNotes(false);
    }
  };

  // Convert Extracted AI Suggestion into an actual Medical Calendar Appointment
  const handleAcceptSuggestion = (sug: ExtractedAppointmentSuggestion) => {
    // Generate an estimated date 2 weeks from now
    const estDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const app: MedicalAppointment = {
      id: `ai-ext-${Date.now()}`,
      title: sug.title,
      doctorName: sug.recommendedDoctor || 'Primary Care / Specialist',
      specialty: sug.specialty,
      portalProvider: 'AI_NOTE_EXTRACTED',
      date: estDate,
      time: '11:00',
      location: 'To Be Confirmed / Clinic',
      status: 'NEEDS_SCHEDULING',
      prepInstructions: sug.prepNotes || `Suggested Timeframe: ${sug.suggestedTimeframe}. Reason: ${sug.reason}`,
      syncedToCalendar: false,
    };

    onAddAppointmentFromAI(app);

    // Remove from suggestions list
    setExtractedSuggestions((prev) => prev.filter((i) => i.id !== sug.id));
  };

  // Handle AI Goal Micro-Step Breakdown
  const handleBreakdownGoalWithAI = async () => {
    if (!goalInput.trim()) return;

    setIsBreakingDownGoal(true);

    try {
      const response = await fetch('/api/gemini/breakdown-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalTitle: goalInput, condition: selectedCondition }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.microSteps) {
        data.microSteps.forEach((step: any) => {
          const item: ChecklistItem = {
            id: `goal-ai-${Date.now()}-${Math.random()}`,
            title: step.title,
            category: step.category || goalCategory,
            completed: false,
            aiSuggested: true,
          };
          onAddItem(item);
        });
        setGoalInput('');
      }
      setIsBreakingDownGoal(false);
    } catch (err) {
      console.error('Goal breakdown error:', err);
      setIsBreakingDownGoal(false);
    }
  };

  // Manual Item Submit
  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const item: ChecklistItem = {
      id: `chk-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      completed: false,
    };

    onAddItem(item);
    setNewTitle('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-3 space-y-5 text-white z-10 relative text-left">
      {/* Header & Overall Goal Progress */}
      <div className="p-5 rounded-3xl bg-black/70 border border-cyan-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_30px_rgba(0,243,255,0.15)]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-[0_0_20px_rgba(255,0,127,0.4)]">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-wide bg-gradient-to-r from-pink-300 via-purple-200 to-cyan-300 bg-clip-text text-transparent">
              Organizing & Goal Checklist
            </h2>
            <p className="text-xs text-cyan-200/80 font-mono">
              AI-assisted medical note scanning & executive function micro-stepping
            </p>
          </div>
        </div>

        {/* Executive Function Progress Gauge */}
        <div className="w-full sm:w-48 p-3 rounded-2xl bg-black/80 border border-gray-800 flex flex-col gap-1">
          <div className="flex justify-between text-[11px] font-mono text-gray-300">
            <span>Daily Progress</span>
            <span className="text-pink-300 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-900 overflow-hidden border border-gray-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 font-mono text-right">
            {completedCount} / {checklistItems.length} completed
          </span>
        </div>
      </div>

      {/* SECTION 1: AI MEDICAL NOTES SCANNER FOR UNFORGOTTEN APPOINTMENTS */}
      <div className="p-5 rounded-3xl bg-black/70 border border-purple-500/30 backdrop-blur-md space-y-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
          <Brain className="w-5 h-5 text-pink-400" />
          <div>
            <h3 className="font-bold text-sm text-purple-200">
              AI Medical Notes Appointment Extractor
            </h3>
            <p className="text-xs text-gray-400">
              Paste medical notes, discharge summaries, or doctor instructions. Gemini will parse recommended follow-ups so you never forget necessary appointments.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <textarea
            value={medicalNotesText}
            onChange={(e) => setMedicalNotesText(e.target.value)}
            rows={3}
            placeholder='Paste doctor notes or visit summaries (e.g., "Follow up with Dr. Smith in 6 weeks for Bipolar medication review. Order routine CBC & TSH bloodwork before appointment. Continue biweekly therapy.")'
            className="w-full p-3 rounded-2xl bg-gray-950/80 border border-gray-800 text-xs text-white focus:outline-none focus:border-purple-400 placeholder:text-gray-600 font-sans"
          />

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-mono">
              Parses follow-ups, specialist referrals & lab orders
            </span>
            <button
              onClick={handleScanMedicalNotes}
              disabled={isExtractingNotes || !medicalNotesText.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-black font-extrabold text-xs flex items-center gap-2 transition shadow-[0_0_15px_rgba(236,72,153,0.3)] disabled:opacity-50"
            >
              {isExtractingNotes ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Scanning Notes with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Extract Suggested Appointments</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Extraction Error */}
        {extractionError && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{extractionError}</span>
          </div>
        )}

        {/* Extracted Suggestions Cards */}
        {extractedSuggestions.length > 0 && (
          <div className="pt-2 border-t border-gray-800 space-y-3">
            {noteExtractionSummary && (
              <p className="text-xs text-purple-300 italic font-medium">
                "{noteExtractionSummary}"
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {extractedSuggestions.map((sug) => (
                <div
                  key={sug.id}
                  className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex flex-col justify-between gap-2 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{sug.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-mono border border-pink-500/30">
                        {sug.priority} PRIORITY
                      </span>
                    </div>
                    <span className="text-[11px] text-cyan-300 block font-mono">
                      Specialty: {sug.specialty} | {sug.suggestedTimeframe}
                    </span>
                    <p className="text-[11px] text-gray-300 leading-snug">{sug.reason}</p>
                  </div>

                  <button
                    onClick={() => handleAcceptSuggestion(sug)}
                    className="mt-2 py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition shadow-[0_0_10px_rgba(0,243,255,0.3)]"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-black" />
                    <span>Add to Medical Calendar</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: AI GOAL BREAKDOWN ASSISTANT */}
      <div className="p-5 rounded-3xl bg-black/70 border border-cyan-500/30 backdrop-blur-md space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-bold text-sm text-cyan-200">
              Executive Dysfunction Goal Break-Down
            </h3>
            <p className="text-xs text-gray-400">
              Type a short or long-term goal. AI will break it down into 2-minute actionable daily checklist items.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            placeholder='e.g. "Schedule my bloodwork and establish a consistent morning medication routine"'
            className="flex-1 px-3.5 py-2.5 rounded-2xl bg-gray-950 border border-gray-800 text-xs text-white focus:outline-none focus:border-cyan-400"
          />
          <button
            onClick={handleBreakdownGoalWithAI}
            disabled={isBreakingDownGoal || !goalInput.trim()}
            className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shrink-0"
          >
            {isBreakingDownGoal ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                <span>Breaking Down...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-black" />
                <span>AI Breakdown Goal</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 3: CHECKLIST ITEMS & DAILY ACTIVITIES */}
      <div className="p-5 rounded-3xl bg-black/70 border border-cyan-500/30 backdrop-blur-md space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(['ALL', 'DAILY_ROUTINE', 'SHORT_TERM_GOAL', 'LONG_TERM_GOAL', 'MEDICAL_PREP'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryTab(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  activeCategoryTab === cat
                    ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-[0_0_12px_rgba(255,0,127,0.2)]'
                    : 'bg-black/60 text-gray-400 border-gray-800 hover:text-gray-200'
                }`}
              >
                {cat === 'ALL'
                  ? 'All Tasks'
                  : cat === 'DAILY_ROUTINE'
                  ? 'Daily Routine'
                  : cat === 'SHORT_TERM_GOAL'
                  ? 'Short-Term'
                  : cat === 'LONG_TERM_GOAL'
                  ? 'Long-Term Goals'
                  : 'Medical Prep'}
              </button>
            ))}
          </div>

          {/* Manual Add Quick Item Form */}
          <form onSubmit={handleManualAddSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add quick daily task..."
              className="px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-pink-400 w-full sm:w-48"
            />
            <button
              type="submit"
              className="p-1.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-black font-bold transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Checklist List */}
        <div className="space-y-2">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-xs">
              No checklist items in this view. Add a daily task or use AI Breakdown Goal above.
            </div>
          ) : (
            filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  item.completed
                    ? 'bg-black/40 border-gray-800 text-gray-500 line-through'
                    : 'bg-black/70 border-cyan-500/20 text-white hover:border-cyan-400'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => onToggleItem(item.id)}
                    className="p-1 text-cyan-400 hover:text-pink-400 transition shrink-0"
                  >
                    {item.completed ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5 text-cyan-400" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium block truncate">{item.title}</span>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 mt-0.5">
                      <span className="uppercase text-purple-300">
                        {item.category.replace(/_/g, ' ')}
                      </span>
                      {item.aiSuggested && (
                        <span className="text-pink-400 flex items-center gap-0.5">
                          <Sparkles className="w-3 h-3" /> AI Micro-Step
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="p-1 text-gray-600 hover:text-red-400 transition"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
