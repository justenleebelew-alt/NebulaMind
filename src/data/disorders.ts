import { DisorderInfo } from '../types';

export const DISORDER_PROFILES: DisorderInfo[] = [
  {
    id: 'ALL',
    name: 'Universal Cosmic Calm',
    subtitle: 'All Neuro-divergent & Emotional Regulation States',
    color: 'from-cyan-500 to-pink-500',
    icon: 'Sparkles',
    dbtSkill: 'TIPP & Grounding',
    description: 'Comprehensive distress tolerance, emotional re-centering, and mindfulness designed for deep neural regulation.',
    prompts: [
      'What emotion is currently occupying the most space in your body?',
      'Name 3 small things in your environment right now that bring you safety.',
      'What is one physical sensation you want to release during breathing?'
    ]
  },
  {
    id: 'BPD',
    name: 'BPD (Borderline Personality)',
    subtitle: 'Emotion Regulation & DBT Distress Tolerance',
    color: 'from-pink-500 to-purple-600',
    icon: 'HeartHandshake',
    dbtSkill: 'DBT TIPP & STOP Skill',
    description: 'Built for intense emotional waves, fear of abandonment, rejection sensitivity, splitting, and rapid mood spikes.',
    prompts: [
      'Are you experiencing splitting or an emotional wave? Validate your feelings without judgment.',
      'If you feel rejection sensitivity, what facts can counter the extreme thought?',
      'Describe what your emotional state feels like right now as if it were weather.'
    ]
  },
  {
    id: 'BIPOLAR',
    name: 'Bipolar Disorder',
    subtitle: 'Mood Stabilization & Circadian Rhythm Support',
    color: 'from-blue-500 to-indigo-600',
    icon: 'Activity',
    dbtSkill: 'Social Rhythm & Anchor Check',
    description: 'Designed to anchor energy fluctuations, manage racing thoughts during manic phases, and soothe depressive inertia.',
    prompts: [
      'On a scale of 1-10, where is your mental energy and impulse drive today?',
      'What key routine anchor (sleep, meal, air) can you keep steady today?',
      'Are thoughts racing? Brain-dump every single thought onto this page.'
    ]
  },
  {
    id: 'MDD',
    name: 'Major Depressive Disorder',
    subtitle: 'Combatting Inertia & Gentle Self-Compassion',
    color: 'from-teal-400 to-blue-600',
    icon: 'SunMedium',
    dbtSkill: 'Behavioral Activation & Micro-Steps',
    description: 'Gentle support for heaviness, low motivation, self-criticism, and cognitive fatigue. Prioritizes 1% micro-wins.',
    prompts: [
      'What is one tiny 2-minute action (e.g. glass of water, opening window) you can take?',
      'Write one compassionate sentence to yourself as if you were speaking to a dear friend.',
      'What is a heavy thought you can give yourself permission to set down for 10 minutes?'
    ]
  },
  {
    id: 'ADHD',
    name: 'ADD / ADHD',
    subtitle: 'Executive Function & Dopamine Balancing',
    color: 'from-amber-400 to-cyan-500',
    icon: 'Zap',
    dbtSkill: 'Brain-Dump & 5-Minute Micro Burst',
    description: 'For overstimulated minds, executive dysfunction, dopamine seeking, task paralysis, and hyperfocus burnout.',
    prompts: [
      'Unload every single task or open loop cluttering your working memory right now.',
      'What is the absolute smallest non-threatening first step for your task?',
      'Are you feeling overstimulated or understimulated right now?'
    ]
  }
];
