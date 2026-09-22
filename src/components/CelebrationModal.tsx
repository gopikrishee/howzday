import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { MoodEntry, GamificationStats, MoodLevel } from '../types';
import { getMoodConfig } from '../data/moodConfigs';
import { MoodAvatar } from './MoodAvatar';
import { Sparkles, Flame, Check, ArrowRight, Lock } from 'lucide-react';

interface CelebrationModalProps {
  isOpen: boolean;
  entry: MoodEntry | null;
  stats: GamificationStats;
  xpAwarded?: number;
  newLevelUnlocked?: boolean;
  onClose: () => void;
  onViewHistory: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  entry,
  stats,
  xpAwarded,
  newLevelUnlocked = false,
  onClose,
  onViewHistory,
}) => {
  useEffect(() => {
    if (isOpen && entry) {
      const getMoodColors = (mood: MoodLevel) => {
        switch (mood) {
          case 'happy':
            return ['#EAB308', '#FACC15', '#FDE047', '#FEF08A'];
          case 'neutral':
            return ['#64748B', '#94A3B8', '#CBD5E1', '#E2E8F0'];
          case 'angry':
            return ['#E11D48', '#FB7185', '#FDA4AF', '#FECDD3'];
          case 'tired':
            return ['#7C3AED', '#A78BFA', '#C4B5FD', '#DDD6FE'];
          case 'relax':
            return ['#059669', '#10B981', '#6EE7B7', '#A7F3D0'];
          case 'sleepy':
            return ['#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE'];
          case 'romantic':
            return ['#EC4899', '#F472B6', '#F9A8D4', '#FBCFE8'];
          case 'sick':
            return ['#14B8A6', '#2DD4BF', '#5EEAD4', '#99F6E4'];
          case 'sad':
          default:
            return ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];
        }
      };

      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.65 },
        colors: getMoodColors(entry.mood),
      });
    }
  }, [isOpen, entry?.id, entry?.mood]);

  if (!isOpen || !entry) return null;

  const config = getMoodConfig(entry.mood);

  // Compute actual XP earned in this turn
  const effectiveXp = xpAwarded !== undefined ? xpAwarded : entry.xpEarned;

  const getRewardLabel = () => {
    if (effectiveXp === 35) return 'Full Reward';
    if (effectiveXp === 20) return 'Quick Mood';
    if (effectiveXp === 15) return 'Reflection Bonus';
    if (effectiveXp === 0) return 'Max XP Reached';
    return 'Reward';
  };

  const getAffirmation = () => {
    if (entry.mood === 'happy') {
      return '“Joy shared or quietly felt expands your world. Treasure today’s light!”';
    }
    if (entry.mood === 'neutral') {
      return '“Equanimity is a superpower. In calm waters, mind and soul recharge.”';
    }
    if (entry.mood === 'angry') {
      return '“Strong emotions signal what matters to you. Taking a mindful breath is true strength.”';
    }
    if (entry.mood === 'tired') {
      return '“Rest is productive. Honor your energy and give yourself the comfort you deserve.”';
    }
    if (entry.mood === 'relax') {
      return '“Serenity in mind and heart. Cherish this peaceful rhythm throughout your day.”';
    }
    return '“Acknowledging heavy feelings takes genuine bravery. Be gentle with yourself today.”';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center relative overflow-hidden"
        >
          {/* Top Decorative Mood Hue */}
          <div
            className="absolute top-0 left-0 right-0 h-2.5"
            style={{ backgroundColor: config.primaryColor }}
          />

          {/* Avatar Icon */}
          <div className="flex justify-center mt-2 mb-3">
            <div
              className="p-3.5 rounded-3xl border shadow-xs"
              style={{
                backgroundColor: `${config.primaryColor}15`,
                borderColor: `${config.primaryColor}40`,
              }}
            >
              <MoodAvatar mood={entry.mood} isSelected size={64} />
            </div>
          </div>

          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {effectiveXp > 0 ? 'Daily Entry Recorded!' : 'Mood Entry Updated!'}
          </h2>

          <p className="text-xs text-slate-600 mt-1 font-medium">
            {entry.isPrivateReason ? (
              <span className="inline-flex items-center gap-1 text-slate-700 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-full">
                Logged as Quick Mood ({config.label})
              </span>
            ) : (
              `Reflected as ${config.label} today`
            )}
          </p>

          {/* Gamified Rewards Card */}
          <div className="mt-4 p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 flex items-center justify-around shadow-2xs">
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1 text-amber-700 font-black text-sm">
                <Sparkles className="w-4 h-4 text-amber-500" />
                +{effectiveXp} XP
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {getRewardLabel()}
              </span>
            </div>

            <div className="h-7 w-[1px] bg-slate-200" />

            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1 text-orange-700 font-black text-sm">
                <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
                {stats.currentStreak} Days
              </span>
              <span className="text-[11px] font-semibold text-slate-500">Active Streak</span>
            </div>
          </div>

          {newLevelUnlocked && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-3 py-2 px-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 shadow-2xs"
            >
              🎉 Leveled Up to Level {stats.level}!
            </motion.div>
          )}

          {/* Affirmation */}
          <p className="mt-4 text-xs italic text-slate-700 px-2 leading-relaxed font-medium">
            {getAffirmation()}
          </p>

          {/* Action Buttons */}
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              id="celebration-continue-btn"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              style={{ backgroundColor: config.primaryColor }}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Done</span>
            </button>

            <button
              type="button"
              id="celebration-view-history-btn"
              onClick={() => {
                onClose();
                onViewHistory();
              }}
              className="w-full py-2.5 px-4 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View Past Entries</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
