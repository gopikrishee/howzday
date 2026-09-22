import React from 'react';
import { motion } from 'motion/react';
import { GamificationStats } from '../types';
import { MoodTheme } from '../data/moodThemes';
import { Flame, Award, History, CheckCircle2, LogIn, LogOut, Cloud, CloudOff, SunMedium } from 'lucide-react';
import { User } from 'firebase/auth';
import { PWAInstallButton } from './PWAInstallButton';

interface GamificationHeaderProps {
  stats: GamificationStats;
  user: User | null;
  isCloudSynced: boolean;
  unreadNudgesCount?: number;
  moodTheme?: MoodTheme;
  onOpenNudges?: () => void;
  onOpenHistory: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const GamificationHeader: React.FC<GamificationHeaderProps> = ({
  stats,
  user,
  isCloudSynced,
  unreadNudgesCount = 0,
  moodTheme,
  onOpenNudges,
  onOpenHistory,
  onSignIn,
  onSignOut,
}) => {
  const xpInCurrentLevel = stats.currentXp % 100;
  const xpNeeded = 100;
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpNeeded) * 100));

  const getLevelTitle = (lvl: number) => {
    switch (lvl) {
      case 1:
        return 'Mindful Starter';
      case 2:
        return 'Daily Seeker';
      case 3:
        return 'Zen Explorer';
      case 4:
        return 'Emotional Sage';
      default:
        return 'Master of Harmony';
    }
  };

  return (
    <header className={`w-full ${moodTheme?.headerBg || 'bg-white/95'} backdrop-blur-md border-b ${moodTheme?.borderColor || 'border-slate-200/90'} px-4 py-3 sticky top-0 z-20 shadow-2xs transition-colors duration-700`}>
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Left: App title / Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-xs shadow-orange-500/25">
            <SunMedium className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">
                HowZDay
              </h1>
              {stats.todayCompleted && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                  Done
                </span>
              )}
              {moodTheme && moodTheme.id !== 'neutral' && (
                <span
                  title={moodTheme.vibe}
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${moodTheme.pillColor} transition-colors`}
                >
                  <span>{moodTheme.emoji}</span>
                  <span className="hidden sm:inline">{moodTheme.name}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-0.5">
              {user ? (
                <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                  <Cloud className="w-3 h-3 text-emerald-600" />
                  Cloud Firestore
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-500 font-medium">
                  <CloudOff className="w-3 h-3 text-slate-400" />
                  Local draft
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Gamified Stats Chips, Install & Auth */}
        <div className="flex items-center gap-1.5">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Streak Chip */}
          <motion.div
            id="streak-indicator-chip"
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-950 text-xs font-black shadow-2xs"
          >
            <motion.div
              animate={{ scale: [1, 1.25, 1], rotate: [0, 6, -6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
            >
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-600" />
            </motion.div>
            <span>{stats.currentStreak}d</span>
          </motion.div>

          {/* Level Pill */}
          <div className="hidden xs:flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-300 text-indigo-950 text-xs font-black shadow-2xs">
            <Award className="w-3.5 h-3.5 text-indigo-600" />
            <span>L{stats.level}</span>
          </div>

          {/* History Button */}
          <button
            type="button"
            id="open-history-btn"
            onClick={onOpenHistory}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-700 transition-all cursor-pointer shadow-2xs border border-slate-200/80"
            aria-label="View Mood History"
            title="Past check-in log history"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Google Auth Status / Button */}
          {user ? (
            <button
              type="button"
              id="user-auth-btn"
              onClick={onSignOut}
              title={`Signed in as ${user.displayName || user.email || 'User'}. Click to sign out.`}
              className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-xs text-slate-800 font-semibold border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="w-5 h-5 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
            </button>
          ) : (
            <button
              type="button"
              id="google-signin-header-btn"
              onClick={onSignIn}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Sign in with Google to sync with Firestore"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* XP Progress Bar under header */}
      <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
        <span className="font-bold text-slate-900">
          Level {stats.level}: <span className="text-indigo-700">{getLevelTitle(stats.level)}</span>
        </span>
        <span className="text-xs font-bold text-slate-600 font-mono">{xpInCurrentLevel}/100 XP</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 border border-slate-200/50">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-rose-500 to-amber-500 rounded-full transition-all duration-500 shadow-xs"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};
