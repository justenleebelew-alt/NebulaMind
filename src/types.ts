export type ConditionProfile = 'ALL' | 'BPD' | 'BIPOLAR' | 'MDD' | 'ADHD';

export type BreathingTechnique = 'RECOVERY' | 'BOX' | 'FOUR_SEVEN_EIGHT';

export type BreathingPhase = 'IN' | 'HOLD_IN' | 'OUT' | 'HOLD_OUT' | 'IN_EXTRA';

export interface BreathingPhaseConfig {
  phase: BreathingPhase;
  label: string;
  durationSeconds: number;
  instruction: string;
}

export interface JournalAnalysis {
  summary: string;
  emotionalState: string;
  disorderInsights: string;
  dbtOrCbtTechnique: string;
  recommendedBreathing: 'RECOVERY' | 'BOX' | '4-7-8';
  actionableMicroSteps: string[];
  encouragingAffirmation: string;
}

export interface JournalEntry {
  id: string;
  timestamp: string;
  content: string;
  moodScore: number; // 1 to 10
  condition: ConditionProfile;
  aiAnalysis?: JournalAnalysis;
}

export type MedicalPortalProvider = 'MYCHART_EPIC' | 'CERNER' | 'QUEST_LABCORP' | 'GOOGLE_HEALTH' | 'FHIR_GENERIC';

export interface MedicalPortalStatus {
  provider: MedicalPortalProvider;
  name: string;
  connected: boolean;
  lastSynced?: string;
  patientName?: string;
}

export interface MedicalAppointment {
  id: string;
  title: string;
  doctorName: string;
  specialty: string;
  portalProvider: MedicalPortalProvider | 'MANUAL' | 'AI_NOTE_EXTRACTED';
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'NEEDS_SCHEDULING';
  prepInstructions?: string;
  notes?: string;
  syncedToCalendar?: boolean;
}

export interface ExtractedAppointmentSuggestion {
  id: string;
  title: string;
  specialty: string;
  suggestedTimeframe: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedDoctor?: string;
  prepNotes?: string;
}

export type ChecklistCategory = 'DAILY_ROUTINE' | 'SHORT_TERM_GOAL' | 'LONG_TERM_GOAL' | 'MEDICAL_PREP';

export interface ChecklistItem {
  id: string;
  title: string;
  category: ChecklistCategory;
  completed: boolean;
  dueDate?: string;
  substeps?: string[];
  aiSuggested?: boolean;
  sourceNote?: string;
}

export interface DisorderInfo {
  id: ConditionProfile;
  name: string;
  subtitle: string;
  color: string;
  icon: string;
  dbtSkill: string;
  description: string;
  prompts: string[];
}
