import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoodEntry, GamificationStats } from '../types';
import { getMoodConfig } from '../data/moodConfigs';
import { X, Calendar, Lock, Flame, Award, Tag, Sparkles, Cloud, CloudOff } from 'lucide-react';
import { User } from 'firebase/auth';
import { firebaseConfig } from '../services/firebase';

interface MoodHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: MoodEntry[];
  stats: GamificationStats;
  user: User | null;
}

export const MoodHistoryModal: React.FC<MoodHistoryModalProps> = ({
  isOpen,
  onClose,
  entries,
  stats,
  user,
}) => {
  if (!isOpen) return null;

  // Calculate mood counts
  const counts = entries.reduce(
    (acc, curr) => {
      acc[curr.mood] = (acc[curr.mood] || 0) + 1;
      return acc;
    },
    { happy: 0, neutral: 0, sad: 0 } as Record<string, number>
  );

  const formatDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md max-h-[88vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-b from-slate-50/70 to-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Mood Journal & Streaks
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  {entries.length} recorded {entries.length === 1 ? 'entry' : 'entries'}
                </p>
              </div>
            </div>
            <button
              type="button"
              id="close-history-modal-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-700 cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Gamified Summary Stats */}
          <div className="p-4 bg-slate-50/90 border-b border-slate-200/80 grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="flex items-center justify-center gap-1 text-xs font-black text-orange-700">
                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                {stats.currentStreak}d
              </span>
              <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">Streak</span>
            </div>

            <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="flex items-center justify-center gap-1 text-xs font-black text-indigo-700">
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                Lvl {stats.level}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">Rank</span>
            </div>

            <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="flex items-center justify-center gap-1 text-xs font-black text-amber-700">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {stats.currentXp}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">Total XP</span>
            </div>
          </div>

          {/* Mood Distribution Bar */}
          <div className="px-4 py-3 border-b border-slate-200/80 bg-white">
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Overall Distribution</span>
              <span className="text-xs font-bold text-slate-600">
                ☀️ {counts.happy} • 🌱 {counts.neutral} • 🌧️ {counts.sad}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full flex overflow-hidden border border-slate-200/60">
              <div
                style={{
                  width: `${(counts.happy / (entries.length || 1)) * 100}%`,
                  backgroundColor: '#F59E0B',
                }}
                title={`Happy: ${counts.happy}`}
              />
              <div
                style={{
                  width: `${(counts.neutral / (entries.length || 1)) * 100}%`,
                  backgroundColor: '#0D9488',
                }}
                title={`Neutral: ${counts.neutral}`}
              />
              <div
                style={{
                  width: `${(counts.sad / (entries.length || 1)) * 100}%`,
                  backgroundColor: '#6366F1',
                }}
                title={`Sad: ${counts.sad}`}
              />
            </div>
          </div>

          {/* Entry List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
            {entries.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm font-bold text-slate-700">No recorded entries yet.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Tap any mood card to make your first log!
                </p>
              </div>
            ) : (
              entries.map((item) => {
                const config = getMoodConfig(item.mood);
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all"
                    style={{
                      borderLeft: `4px solid ${config.primaryColor}`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{config.emoji}</span>
                        <span
                          className="text-xs font-black px-2.5 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: `${config.primaryColor}20`,
                            color: config.primaryColor,
                            borderColor: `${config.primaryColor}40`,
                          }}
                        >
                          {config.label}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {formatDate(item.date)}
                      </span>
                    </div>

                    {item.isPrivateReason ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 italic mt-1 font-medium">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Reason kept private by user</span>
                      </div>
                    ) : item.reason ? (
                      <p className="text-xs text-slate-800 mt-1 leading-relaxed whitespace-pre-wrap font-medium">
                        {item.reason}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-1">
                        No reflection note provided
                      </p>
                    )}

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                        {item.tags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200/60"
                          >
                            <Tag className="w-2.5 h-2.5 text-slate-500" />
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note about Firebase Status */}
          <div className="p-3 bg-white border-t border-slate-200 text-center text-xs text-slate-600 font-medium">
            <span>Database: </span>
            {user ? (
              <span
                className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300"
                title={`Database ID: ${firebaseConfig.firestoreDatabaseId}`}
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                Firestore Active ({firebaseConfig.projectId})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                <CloudOff className="w-3.5 h-3.5 text-slate-500" />
                Local Persistence • Sign in to sync
              </span>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
