import { MoodConfig, MoodLevel } from '../types';

export const MOOD_CONFIGS: Record<MoodLevel, MoodConfig> = {
  happy: {
    id: 'happy',
    label: 'Happy',
    tagline: 'Upbeat & Joyful',
    primaryColor: '#EAB308', // Sunny Gold
    bgLight: 'bg-amber-50/90',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-950',
    glowColor: 'rgba(234, 179, 8, 0.35)',
    emoji: '☀️',
    description: 'Feeling positive, grateful, energized, or fulfilled today.',
  },
  neutral: {
    id: 'neutral',
    label: 'Neutral',
    tagline: 'Calm & Steady',
    primaryColor: '#64748B', // Soft Gray
    bgLight: 'bg-slate-100/90',
    borderColor: 'border-slate-400',
    textColor: 'text-slate-900',
    glowColor: 'rgba(100, 116, 139, 0.35)',
    emoji: '☁️',
    description: 'Steady, balanced, ordinary, or resting between highs and lows.',
  },
  sad: {
    id: 'sad',
    label: 'Sad',
    tagline: 'Low or Reflective',
    primaryColor: '#3B82F6', // Muted Blue
    bgLight: 'bg-blue-50/90',
    borderColor: 'border-blue-400',
    textColor: 'text-blue-950',
    glowColor: 'rgba(59, 130, 246, 0.35)',
    emoji: '🌧️',
    description: 'Feeling overwhelmed, fatigued, tender, or going through a tough day.',
  },
  angry: {
    id: 'angry',
    label: 'Angry',
    tagline: 'Frustrated or Mad',
    primaryColor: '#E11D48', // Soft Crimson
    bgLight: 'bg-rose-50/90',
    borderColor: 'border-rose-400',
    textColor: 'text-rose-950',
    glowColor: 'rgba(225, 29, 72, 0.35)',
    emoji: '🔥',
    description: 'Feeling frustrated, annoyed, irritable, or tense today.',
  },
  tired: {
    id: 'tired',
    label: 'Tired',
    tagline: 'Drained & Sleepy',
    primaryColor: '#7C3AED', // Deep Lavender
    bgLight: 'bg-purple-50/90',
    borderColor: 'border-purple-400',
    textColor: 'text-purple-950',
    glowColor: 'rgba(124, 58, 237, 0.35)',
    emoji: '🥱',
    description: 'Feeling exhausted, physically drained, low energy, or needing rest.',
  },
  relax: {
    id: 'relax',
    label: 'Relax',
    tagline: 'Peaceful & At Ease',
    primaryColor: '#059669', // Sage Green
    bgLight: 'bg-emerald-50/90',
    borderColor: 'border-emerald-400',
    textColor: 'text-emerald-950',
    glowColor: 'rgba(5, 150, 105, 0.35)',
    emoji: '🌿',
    description: 'Feeling peaceful, tranquil, decompressed, and unburdened.',
  },
};

export const DEFAULT_MOOD_CONFIG: MoodConfig = MOOD_CONFIGS.neutral;

export function getMoodConfig(mood?: string | null): MoodConfig {
  if (!mood) return DEFAULT_MOOD_CONFIG;
  const key = mood.toLowerCase().trim() as MoodLevel;
  if (key in MOOD_CONFIGS) {
    return MOOD_CONFIGS[key];
  }
  return DEFAULT_MOOD_CONFIG;
}

export const QUICK_TAGS = [
  'Work & Career',
  'Family & Friends',
  'Health & Energy',
  'Sleep Quality',
  'Personal Growth',
  'Weather & Nature',
  'Hobbies & Leisure',
];
