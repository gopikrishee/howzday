import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { User } from 'firebase/auth';
import {
  MoodLevel,
  MoodEntry,
  GamificationStats,
  StatusReaction,
  UserProfile,
  DailyPlanner,
} from '../types';
import { getMoodConfig } from '../data/moodConfigs';
import { getMoodTheme } from '../data/moodThemes';
import { MoodCard } from './MoodCard';
import { MoodLogInput } from './MoodLogInput';
import { CroodsReactionsCard } from './CroodsReactionsCard';
import { CollaborateView } from './CollaborateView';
import {
  CalendarDays,
  ShieldAlert,
  Pencil,
  Sparkles,
  Users,
  ChevronRight,
  Smile,
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
  statusReactions?: StatusReaction[];
  onAcknowledgeReactions?: () => void;
  user?: User | null;
  croodFriends?: UserProfile[];
  planners?: DailyPlanner[];
  onSavePlanner?: (planner: DailyPlanner) => Promise<void>;
  onDeletePlanner?: (plannerId: string) => Promise<void>;
  onSignIn?: () => void;
  onGoToCroods?: () => void;
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
  statusReactions = [],
  onAcknowledgeReactions,
  user = null,
  croodFriends = [],
  planners = [],
  onSavePlanner = async () => {},
  onDeletePlanner = async () => {},
  onSignIn = () => {},
  onGoToCroods,
}) => {
  const [subTab, setSubTab] = useState<'moods' | 'collaborate'>('moods');
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Swipe gesture tracking refs
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

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

  // Touch handlers for swipe gesture between Moods and Collaborate
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartXRef.current;
    const deltaY = touchEndY - touchStartYRef.current;

    // Check if horizontal swipe is predominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (subTab === 'moods' && deltaX > 40) {
        // Swiped right from moods panel -> Open Collaborate
        setSubTab('collaborate');
      } else if (subTab === 'collaborate' && deltaX < -40) {
        // Swiped left from collaborate panel -> Return to Moods
        setSubTab('moods');
      }
    }
  };

  return (
    <div
      className="flex-1 flex flex-col relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Segmented Switcher Pill Bar between Mood Pulse & Collaborate */}
      <div className="mb-3.5 flex items-center justify-between gap-2">
        <div className="p-1 bg-white/80 backdrop-blur-xs rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-1 w-full max-w-xs">
          <button
            type="button"
            id="tab-mood-pulse"
            onClick={() => setSubTab('moods')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[34px] ${
              subTab === 'moods'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Mood Pulse</span>
          </button>

          <button
            type="button"
            id="tab-collaborate"
            onClick={() => setSubTab('collaborate')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[34px] ${
              subTab === 'collaborate'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/70'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Collaborate</span>
          </button>
        </div>

        {/* Quick Swipe Indicator Pill */}
        {subTab === 'moods' ? (
          <button
            type="button"
            onClick={() => setSubTab('collaborate')}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1.5 rounded-full border border-indigo-200/70 shadow-2xs transition-all cursor-pointer"
            title="Swipe right or tap to open Collaborate"
          >
            <span>Collaborate</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSubTab('moods')}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-full border border-slate-200 shadow-2xs transition-all cursor-pointer"
            title="Return to Mood Pulse"
          >
            <span>← Moods</span>
          </button>
        )}
      </div>

      {/* Dynamic Animated Panel Switcher */}
      <AnimatePresence mode="wait">
        {subTab === 'collaborate' ? (
          <motion.div
            key="panel-collaborate"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex-1 flex flex-col"
          >
            <CollaborateView
              user={user}
              croodFriends={croodFriends}
              todayMoodEntry={todayEntry}
              planners={planners}
              onSavePlanner={onSavePlanner}
              onDeletePlanner={onDeletePlanner}
              onBackToMoods={() => setSubTab('moods')}
              onSignIn={onSignIn}
              onGoToCroods={onGoToCroods}
            />
          </motion.div>
        ) : (
          <motion.div
            key="panel-moods"
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 28 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex-1 flex flex-col"
          >
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
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100/80 px-3.5 py-1.5 rounded-full border border-indigo-200 transition-all cursor-pointer shadow-2xs active:scale-95 min-h-[34px]"
                        title="Change today's recorded mood"
                      >
                        <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Change mood</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        id="cancel-unlock-btn"
                        onClick={handleLockAgain}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-1.5 rounded-full border border-slate-200 transition-all cursor-pointer shadow-2xs min-h-[34px]"
                        title="Keep current mood"
                      >
                        <span>Done</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
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

            {/* Ambient Atmosphere Indicator Bar */}
            <div
              className={`p-2.5 sm:p-3 rounded-2xl bg-white/70 backdrop-blur-xs border ${activeTheme.borderColor} shadow-2xs mb-3.5 flex items-center justify-between gap-2.5 transition-all duration-700`}
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

            {/* Gesture Helper Banner (Swipe Right to Collaborate) */}
            <div
              onClick={() => setSubTab('collaborate')}
              className="mb-4 p-2.5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-indigo-50/90 border border-indigo-100 flex items-center justify-between gap-2 text-xs text-indigo-900 cursor-pointer hover:bg-indigo-100/60 transition-all shadow-2xs active:scale-[0.99]"
              title="Swipe right on this panel or tap to open Collaborate"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">👉</span>
                <span className="font-bold text-[11px] sm:text-xs">
                  Swipe right for <strong className="text-indigo-700 font-extrabold">Collaborate</strong> task planner
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs shrink-0 flex items-center gap-0.5">
                <span>Open</span>
                <span>→</span>
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
            <section
              aria-label="Mood selection"
              id="moods-grid-panel"
              className="mb-5"
            >
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {(
                  [
                    'happy',
                    'romantic',
                    'relax',
                    'neutral',
                    'sleepy',
                    'tired',
                    'sad',
                    'angry',
                    'sick',
                  ] as MoodLevel[]
                ).map((level) => {
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

            {/* Crood Cheers & Reactions to Today's Status */}
            <CroodsReactionsCard
              reactions={statusReactions}
              onAcknowledgeReactions={onAcknowledgeReactions}
              hasTodayEntry={Boolean(todayEntry)}
            />

            {/* Slide & Raise from Bottom Save Entry Sheet when a mood is selected */}
            <AnimatePresence>
              {selectedMood && (() => {
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
