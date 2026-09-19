import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { MoodLevel, MoodEntry, GamificationStats } from '../types';
import { getMoodConfig } from '../data/moodConfigs';
import { getMoodTheme } from '../data/moodThemes';
import { MoodCard } from './MoodCard';
import { MoodLogInput } from './MoodLogInput';
import {
  CalendarDays,
  ShieldAlert,
  Pencil,
} from 'lucide-react';

interface MoodsViewProps {
  todayFormatted: string;
  todayEntry: MoodEntry | null;
  selectedMood: MoodLevel | null;
  onSelectMood: (mood: MoodLevel) => void;
  onCancelMoodSelection: () => void;
  onResetToday: () => void;
  onSaveFullEntry: (data: { reason: string; tags: string[] }) => Promise<void>;
  onSaveWithoutReason: () => Promise<void>;
  isSaving: boolean;
  stats?: GamificationStats;
  onOpenDomainModal?: () => void;
  authError: string | null;
  isUnauthorizedDomain: boolean;
}

const EMPTY_TAGS: string[] = [];

export const MoodsView: React.FC<MoodsViewProps> = ({
  todayFormatted,
  todayEntry,
  selectedMood,
  onSelectMood,
  onCancelMoodSelection,
  onSaveFullEntry,
  onSaveWithoutReason,
  isSaving,
  onOpenDomainModal,
  authError,
  isUnauthorizedDomain,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Automatically reset unlock state when today's entry changes
  useEffect(() => {
    setIsUnlocked(false);
  }, [todayEntry?.date, todayEntry?.mood]);

  // Is locked if an entry exists for today and user hasn't explicitly unlocked it
  const isLockedForToday = Boolean(todayEntry && !isUnlocked);

  const handleUnlockAndChange = () => {
    setIsUnlocked(true);
  };

  const handleLockAgain = () => {
    setIsUnlocked(false);
    onCancelMoodSelection();
  };

  const activeMoodConfig = todayEntry ? getMoodConfig(todayEntry.mood) : null;
  const activeTheme = getMoodTheme(selectedMood || todayEntry?.mood);

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Greeting & Date Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
          <span className="flex items-center gap-1.5 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200/80">
            <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
            {todayFormatted}
          </span>

          {todayEntry && (
            <div className="flex items-center gap-2">
              {isLockedForToday ? (
                <button
                  type="button"
                  id="change-todays-mood-btn"
                  onClick={handleUnlockAndChange}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100/80 px-3 py-1 rounded-full border border-indigo-200 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Change today's recorded mood"
                >
                  <Pencil className="w-3 h-3 stroke-[2.5]" />
                  <span>Change mood</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="cancel-unlock-btn"
                  onClick={handleLockAgain}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-full border border-slate-200 transition-all cursor-pointer shadow-2xs"
                  title="Keep current mood"
                >
                  <span>Done</span>
                </button>
              )}
            </div>
          )}
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          {todayEntry ? 'Today’s check-in recorded!' : 'How was your day?'}
        </h2>
        <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed">
          {todayEntry
            ? isLockedForToday
              ? `Your mood is set to ${activeMoodConfig?.label.toLowerCase()} for today.`
              : 'Pick a new mood below or add reflection notes to update your entry.'
            : 'Tap any mood below to log your daily emotional pulse and grow your streak.'}
        </p>
      </div>

      {/* Dynamic Ambient Atmosphere Indicator Bar */}
      <div
        className={`p-2.5 rounded-2xl bg-white/70 backdrop-blur-xs border ${activeTheme.borderColor} shadow-2xs mb-4 flex items-center justify-between gap-2.5 transition-all duration-700`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0 leading-none">{activeTheme.emoji}</span>
          <div className="min-w-0">
            <span className="text-xs font-black text-slate-900 truncate block leading-tight">
              {activeTheme.name}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate block">
              {activeTheme.vibe}
            </span>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeTheme.pillColor} shrink-0 transition-colors shadow-2xs`}
        >
          {selectedMood ? 'Previewing' : todayEntry ? 'Today’s Aura' : 'Balanced'}
        </span>
      </div>

      {/* Auth Error Banner if applicable */}
      {authError && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start justify-between gap-2.5 shadow-xs">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold block text-sm text-amber-950">
                {isUnauthorizedDomain ? 'Firebase Domain Setup Required' : 'Authentication Notice'}
              </span>
              <p className="text-xs text-amber-900 mt-0.5">{authError}</p>
              {isUnauthorizedDomain && (
                <button
                  type="button"
                  onClick={onOpenDomainModal}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-200/90 hover:bg-amber-300 px-3 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  <span>Authorize Domain Setup Guide</span>
                  <span>→</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mood Selector Grid */}
      <section aria-label="Mood selection" className="mb-5">
        <div className="grid grid-cols-3 gap-3">
          {(['happy', 'neutral', 'sad', 'angry', 'tired', 'relax'] as MoodLevel[]).map((level) => {
            const isTodayCard = todayEntry?.mood === level;
            const isCardSelected = isLockedForToday
              ? isTodayCard
              : selectedMood === level || (selectedMood === null && isTodayCard);

            return (
              <MoodCard
                key={level}
                mood={level}
                isSelected={isCardSelected}
                disabled={false}
                isLocked={isLockedForToday}
                isTodayRecorded={isTodayCard}
                onSelect={onSelectMood}
              />
            );
          })}
        </div>
      </section>

      {/* Slide & Raise from Bottom Save Entry Sheet when a mood is selected */}
      <AnimatePresence>
        {selectedMood && (() => {
          // Display text and tags ONLY for the existing recorded mood, preserving it.
          // When changing to a different mood, provide a fresh empty text box and fresh unselected tags.
          const isExistingMood = Boolean(todayEntry && selectedMood === todayEntry.mood);
          const initialReason = isExistingMood ? (todayEntry?.reason || '') : '';
          const initialTags = isExistingMood ? (todayEntry?.tags || EMPTY_TAGS) : EMPTY_TAGS;

          return (
            <MoodLogInput
              key={`mood-entry-sheet-${selectedMood}`}
              selectedMood={selectedMood}
              isOpen={Boolean(selectedMood)}
              onSaveEntry={async (data) => {
                await onSaveFullEntry(data);
                setIsUnlocked(false);
              }}
              onSkipReason={async () => {
                await onSaveWithoutReason();
                setIsUnlocked(false);
              }}
              onCancel={() => {
                onCancelMoodSelection();
                setIsUnlocked(false);
              }}
              isSaving={isSaving}
              initialReason={initialReason}
              initialTags={initialTags}
              existingDayXp={todayEntry?.xpEarned || 0}
            />
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
