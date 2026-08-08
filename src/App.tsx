import React, { useState, useEffect } from 'react';
import { CosmicBackground } from './components/CosmicBackground';
import { BreathingScreen } from './components/BreathingScreen';
import { DisorderProfileSelector } from './components/DisorderProfileSelector';
import { GeminiJournal } from './components/GeminiJournal';
import { MedicalCalendar } from './components/MedicalCalendar';
import { OrganizerChecklist } from './components/OrganizerChecklist';
import { ConditionProfile, JournalEntry, MedicalAppointment, MedicalPortalStatus, MedicalPortalProvider, ChecklistItem } from './types';
import { DISORDER_PROFILES } from './data/disorders';
import { Wind, BookOpen, ShieldCheck, Sparkles, Calendar as CalendarIcon, CheckSquare } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'BREATHING' | 'CALENDAR' | 'ORGANIZER' | 'JOURNAL' | 'SKILLS'>('BREATHING');
  const [selectedCondition, setSelectedCondition] = useState<ConditionProfile>('BPD');

  // Journal entries state with localStorage persistence
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('auracosmos_journal');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Medical appointments state with localStorage persistence
  const [appointments, setAppointments] = useState<MedicalAppointment[]>(() => {
    try {
      const saved = localStorage.getItem('auracosmos_appointments');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback default appointments
    }
    const today = new Date();
    const d1 = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const d2 = new Date(today.getTime() + 19 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return [
      {
        id: 'init-app-1',
        title: 'Medication & Mood Review',
        doctorName: 'Dr. Elena Rostova, MD',
        specialty: 'Psychiatry & Behavioral Health',
        portalProvider: 'MYCHART_EPIC',
        date: d1,
        time: '10:30',
        location: 'Outpatient Behavioral Clinic - Suite 402',
        status: 'UPCOMING',
        prepInstructions: 'Fast 2 hours before appointment if blood draw is ordered.',
        syncedToCalendar: true,
      },
      {
        id: 'init-app-2',
        title: 'Fasting Metabolic & TSH Labwork',
        doctorName: 'Quest Diagnostics',
        specialty: 'Laboratory & Pathology',
        portalProvider: 'QUEST_LABCORP',
        date: d2,
        time: '08:15',
        location: 'Quest Diagnostics Patient Center',
        status: 'UPCOMING',
        prepInstructions: 'Fasting required: Water only for 8 hours prior.',
        syncedToCalendar: false,
      },
    ];
  });

  // Connected medical portal statuses
  const [portalStatuses, setPortalStatuses] = useState<MedicalPortalStatus[]>(() => {
    try {
      const saved = localStorage.getItem('auracosmos_portal_statuses');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        provider: 'MYCHART_EPIC',
        name: 'MyChart Epic Portal',
        connected: true,
        lastSynced: new Date().toISOString(),
        patientName: 'Synced Health Record',
      },
      {
        provider: 'QUEST_LABCORP',
        name: 'Quest Diagnostics',
        connected: true,
        lastSynced: new Date().toISOString(),
      },
    ];
  });

  // Checklist and activities state
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem('auracosmos_checklist');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'c1',
        title: 'Morning medication & hydration check',
        category: 'DAILY_ROUTINE',
        completed: true,
      },
      {
        id: 'c2',
        title: '10-minute recovery box breathing session',
        category: 'DAILY_ROUTINE',
        completed: false,
      },
      {
        id: 'c3',
        title: 'Schedule upcoming endocrinology checkup',
        category: 'SHORT_TERM_GOAL',
        completed: false,
        aiSuggested: true,
      },
      {
        id: 'c4',
        title: 'Maintain mood stability & daily journal logs for 30 consecutive days',
        category: 'LONG_TERM_GOAL',
        completed: false,
      },
      {
        id: 'c5',
        title: 'Fast 8 hours before Quest bloodwork visit',
        category: 'MEDICAL_PREP',
        completed: false,
      },
    ];
  });

  // Save persistent state
  useEffect(() => {
    localStorage.setItem('auracosmos_journal', JSON.stringify(journalEntries));
  }, [journalEntries]);

  useEffect(() => {
    localStorage.setItem('auracosmos_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('auracosmos_portal_statuses', JSON.stringify(portalStatuses));
  }, [portalStatuses]);

  useEffect(() => {
    localStorage.setItem('auracosmos_checklist', JSON.stringify(checklistItems));
  }, [checklistItems]);

  const handleAddJournalEntry = (newEntry: JournalEntry) => {
    setJournalEntries((prev) => [newEntry, ...prev]);
  };

  const handleAddAppointment = (app: MedicalAppointment) => {
    setAppointments((prev) => [app, ...prev]);
  };

  const handleSyncPortalComplete = (provider: MedicalPortalProvider, newApps: MedicalAppointment[], statusInfo: MedicalPortalStatus) => {
    setAppointments((prev) => {
      // Merge unique appointments
      const existingIds = new Set(prev.map((a) => a.id));
      const filteredNew = newApps.filter((a) => !existingIds.has(a.id));
      return [...filteredNew, ...prev];
    });

    setPortalStatuses((prev) => {
      const filtered = prev.filter((s) => s.provider !== provider);
      return [...filtered, statusInfo];
    });
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleAddChecklistItem = (item: ChecklistItem) => {
    setChecklistItems((prev) => [item, ...prev]);
  };

  const handleDeleteChecklistItem = (id: string) => {
    setChecklistItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="relative min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* Dynamic Cosmic Swirling Galaxy Starfield Background */}
      <CosmicBackground />

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col min-h-screen max-w-4xl mx-auto pb-24">
        {/* Top Header / App Branding */}
        <header className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-cyan-500/20 backdrop-blur-md bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-pink-500 shadow-[0_0_15px_rgba(0,243,255,0.6)]">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-300 via-purple-200 to-pink-400 bg-clip-text text-transparent">
                AURA COSMOS
              </h1>
              <p className="text-[10px] text-cyan-200/80 font-mono">
                Galaxy Mental Health & Medical Portal Sync
              </p>
            </div>
          </div>
        </header>

        {/* Neuro-Divergent Profile Selector (BPD, Bipolar, MDD, ADHD) */}
        <DisorderProfileSelector
          selected={selectedCondition}
          onSelect={(cond) => setSelectedCondition(cond)}
        />

        {/* Tab View Switcher */}
        <main className="flex-1 px-2 pt-2">
          {activeTab === 'BREATHING' && (
            <BreathingScreen
              selectedCondition={selectedCondition}
            />
          )}

          {activeTab === 'CALENDAR' && (
            <MedicalCalendar
              appointments={appointments}
              portalStatuses={portalStatuses}
              onAddAppointment={handleAddAppointment}
              onSyncPortalComplete={handleSyncPortalComplete}
            />
          )}

          {activeTab === 'ORGANIZER' && (
            <OrganizerChecklist
              selectedCondition={selectedCondition}
              checklistItems={checklistItems}
              onToggleItem={handleToggleChecklistItem}
              onAddItem={handleAddChecklistItem}
              onDeleteItem={handleDeleteChecklistItem}
              onAddAppointmentFromAI={(app) => {
                handleAddAppointment(app);
                setActiveTab('CALENDAR');
              }}
            />
          )}

          {activeTab === 'JOURNAL' && (
            <GeminiJournal
              selectedCondition={selectedCondition}
              entries={journalEntries}
              onAddEntry={handleAddJournalEntry}
              onSelectBreathingFromJournal={() => setActiveTab('BREATHING')}
            />
          )}

          {activeTab === 'SKILLS' && (
            <div className="max-w-2xl mx-auto p-4 space-y-4 text-white z-10 relative">
              <h2 className="text-xl font-bold text-cyan-300 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-pink-400" />
                Condition Coping Skills & DBT
              </h2>

              {DISORDER_PROFILES.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-black/60 border border-cyan-500/30 backdrop-blur-md space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-base text-cyan-300">{p.name}</h3>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      {p.dbtSkill}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Bottom Mobile Navigation Dock */}
        <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-30 p-2 rounded-2xl bg-black/85 border border-cyan-500/40 backdrop-blur-xl shadow-[0_0_30px_rgba(0,243,255,0.4)] flex justify-around items-center">
          <button
            onClick={() => setActiveTab('BREATHING')}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'BREATHING' ? 'text-cyan-300 bg-cyan-950/60 font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Wind className="w-5 h-5" />
            <span className="text-[9px] uppercase font-mono tracking-wider">Breathing</span>
          </button>

          <button
            onClick={() => setActiveTab('CALENDAR')}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'CALENDAR' ? 'text-cyan-300 bg-cyan-950/60 font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="text-[9px] uppercase font-mono tracking-wider">Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('ORGANIZER')}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'ORGANIZER' ? 'text-pink-300 bg-pink-950/60 font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-[9px] uppercase font-mono tracking-wider">Checklist</span>
          </button>

          <button
            onClick={() => setActiveTab('JOURNAL')}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'JOURNAL' ? 'text-pink-300 bg-pink-950/60 font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[9px] uppercase font-mono tracking-wider">AI Journal</span>
          </button>

          <button
            onClick={() => setActiveTab('SKILLS')}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'SKILLS' ? 'text-purple-300 bg-purple-950/60 font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[9px] uppercase font-mono tracking-wider">DBT</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

