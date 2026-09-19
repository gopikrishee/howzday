import { MoodLevel } from '../types';

export interface MoodTheme {
  id: MoodLevel | 'default';
  name: string;
  emoji: string;
  vibe: string;
  pageBgGradient: string;
  containerBg: string;
  borderColor: string;
  headerBg: string;
  navBg: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  auraColor1: string;
  auraColor2: string;
  pillColor: string;
}

export const MOOD_THEMES: Record<MoodLevel, MoodTheme> = {
  happy: {
    id: 'happy',
    name: 'Sunny Amber Glow',
    emoji: '☀️',
    vibe: 'Warm golden morning light',
    pageBgGradient: 'from-amber-50/90 via-orange-50/40 to-yellow-50/60',
    containerBg: 'bg-[#FFFDF7]',
    borderColor: 'border-amber-200/70',
    headerBg: 'bg-[#FFFDF7]/92',
    navBg: 'bg-[#FFFDF7]/95',
    accentColor: '#D97706',
    accentBg: 'bg-amber-100/80',
    accentBorder: 'border-amber-300',
    accentText: 'text-amber-950',
    auraColor1: 'rgba(251, 191, 36, 0.22)',
    auraColor2: 'rgba(245, 158, 11, 0.14)',
    pillColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  relax: {
    id: 'relax',
    name: 'Tranquil Sage Dew',
    emoji: '🌿',
    vibe: 'Gentle soothing greenery',
    pageBgGradient: 'from-emerald-50/90 via-teal-50/40 to-green-50/60',
    containerBg: 'bg-[#F9FDFB]',
    borderColor: 'border-emerald-200/70',
    headerBg: 'bg-[#F9FDFB]/92',
    navBg: 'bg-[#F9FDFB]/95',
    accentColor: '#059669',
    accentBg: 'bg-emerald-100/80',
    accentBorder: 'border-emerald-300',
    accentText: 'text-emerald-950',
    auraColor1: 'rgba(16, 185, 129, 0.20)',
    auraColor2: 'rgba(20, 184, 166, 0.13)',
    pillColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  neutral: {
    id: 'neutral',
    name: 'Serene Cloud Horizon',
    emoji: '☁️',
    vibe: 'Clean, balanced atmospheric calm',
    pageBgGradient: 'from-slate-100/90 via-sky-50/30 to-indigo-50/30',
    containerBg: 'bg-[#FAFAFB]',
    borderColor: 'border-slate-200/80',
    headerBg: 'bg-[#FAFAFB]/92',
    navBg: 'bg-[#FAFAFB]/95',
    accentColor: '#64748B',
    accentBg: 'bg-slate-100',
    accentBorder: 'border-slate-300',
    accentText: 'text-slate-900',
    auraColor1: 'rgba(148, 163, 184, 0.18)',
    auraColor2: 'rgba(99, 102, 241, 0.10)',
    pillColor: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  sad: {
    id: 'sad',
    name: 'Misty Sky Solace',
    emoji: '🌧️',
    vibe: 'Soft rain-cooled dusk calm',
    pageBgGradient: 'from-blue-50/90 via-sky-50/40 to-indigo-50/50',
    containerBg: 'bg-[#F8FAFD]',
    borderColor: 'border-blue-200/70',
    headerBg: 'bg-[#F8FAFD]/92',
    navBg: 'bg-[#F8FAFD]/95',
    accentColor: '#2563EB',
    accentBg: 'bg-blue-100/80',
    accentBorder: 'border-blue-300',
    accentText: 'text-blue-950',
    auraColor1: 'rgba(59, 130, 246, 0.18)',
    auraColor2: 'rgba(14, 165, 233, 0.12)',
    pillColor: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  angry: {
    id: 'angry',
    name: 'Soothing Sunset Blush',
    emoji: '🔥',
    vibe: 'Gentle calming rose warmth',
    pageBgGradient: 'from-rose-50/90 via-pink-50/30 to-amber-50/40',
    containerBg: 'bg-[#FEF9F9]',
    borderColor: 'border-rose-200/70',
    headerBg: 'bg-[#FEF9F9]/92',
    navBg: 'bg-[#FEF9F9]/95',
    accentColor: '#E11D48',
    accentBg: 'bg-rose-100/80',
    accentBorder: 'border-rose-300',
    accentText: 'text-rose-950',
    auraColor1: 'rgba(244, 63, 94, 0.16)',
    auraColor2: 'rgba(251, 146, 60, 0.11)',
    pillColor: 'bg-rose-100 text-rose-900 border-rose-300',
  },
  tired: {
    id: 'tired',
    name: 'Lavender Twilight Rest',
    emoji: '🥱',
    vibe: 'Dreamy twilight for gentle wind-down',
    pageBgGradient: 'from-purple-50/90 via-violet-50/40 to-indigo-50/40',
    containerBg: 'bg-[#FAF8FD]',
    borderColor: 'border-purple-200/70',
    headerBg: 'bg-[#FAF8FD]/92',
    navBg: 'bg-[#FAF8FD]/95',
    accentColor: '#7C3AED',
    accentBg: 'bg-purple-100/80',
    accentBorder: 'border-purple-300',
    accentText: 'text-purple-950',
    auraColor1: 'rgba(147, 51, 234, 0.17)',
    auraColor2: 'rgba(99, 102, 241, 0.12)',
    pillColor: 'bg-purple-100 text-purple-900 border-purple-300',
  },
};

export const DEFAULT_MOOD_THEME: MoodTheme = MOOD_THEMES.neutral;

export function getMoodTheme(mood?: MoodLevel | string | null): MoodTheme {
  if (!mood) return DEFAULT_MOOD_THEME;
  const key = mood.toLowerCase().trim() as MoodLevel;
  if (key in MOOD_THEMES) {
    return MOOD_THEMES[key];
  }
  return DEFAULT_MOOD_THEME;
}
