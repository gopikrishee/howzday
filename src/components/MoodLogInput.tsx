import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MoodLevel } from '../types';
import { QUICK_TAGS, getMoodConfig } from '../data/moodConfigs';
import { MoodAvatar } from './MoodAvatar';
import { Send, Sparkles, Tag, Check, X, Undo2, Zap } from 'lucide-react';

interface MoodLogInputProps {
  selectedMood: MoodLevel;
  isOpen: boolean;
  onSaveEntry: (params: { reason: string; tags: string[] }) => void;
  onSkipReason: () => void;
  onCancel: () => void;
  isSaving: boolean;
  initialReason?: string;
  initialTags?: string[];
  existingDayXp?: number;
}

const EMPTY_TAGS: string[] = [];

export const MoodLogInput: React.FC<MoodLogInputProps> = ({
  selectedMood,
  isOpen,
  onSaveEntry,
  onSkipReason,
  onCancel,
  isSaving,
  initialReason = '',
  initialTags = EMPTY_TAGS,
  existingDayXp = 0,
}) => {
  const [reason, setReason] = useState(initialReason);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const config = getMoodConfig(selectedMood);

  const hasContent = Boolean(reason.trim().length > 0 || selectedTags.length > 0);

  // Determine potential XP earned:
  // - 0 XP today: +35 with notes, +20 quick mood
  // - 20 XP today (logged quick mood earlier): +15 bonus when adding notes, +0 quick mood
  // - 35 XP today (already maxed): +0 XP for any update
  const potentialNotesXp = existingDayXp === 0 ? 35 : existingDayXp < 35 ? 15 : 0;
  const potentialQuickXp = existingDayXp === 0 ? 20 : 0;

  // Reset internal fields when mood changes
  useEffect(() => {
    setReason(initialReason);
    setSelectedTags(initialTags);
  }, [selectedMood, initialReason, initialTags]);

  // Handle ESC key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onCancel]);

  if (!isOpen) return null;

  const getPlaceholder = () => {
    switch (selectedMood) {
      case 'happy':
        return 'What sparked joy or lifted your spirits today? Share your highlight...';
      case 'neutral':
        return 'What kept your day balanced and grounded today? Any quiet thoughts?';
      case 'sad':
        return 'What made today difficult or heavy? Writing it down can bring comfort...';
      case 'angry':
        return 'What caused frustration or tension today? Unpacking it can help release it...';
      case 'tired':
        return 'What drained your energy today? Take a breath and jot down how you feel...';
      case 'relax':
        return 'What helped you unwind and find peace today? Capture this serene moment...';
      default:
        return 'How was your day? Share your thoughts...';
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasContent) {
      // If no notes or tags provided, treat as Quick Mood
      onSkipReason();
    } else {
      onSaveEntry({
        reason: reason.trim(),
        tags: selectedTags,
      });
    }
  };

  return (
    <motion.div
      id="save-entry-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onCancel();
        }
      }}
    >
      <motion.div
        id="save-entry-popup-card"
        key={`save-entry-sheet-${selectedMood}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-entry-title"
        initial={{ y: '100%', opacity: 0.5, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: '100%', opacity: 0, scale: 0.94 }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 340,
          mass: 0.85,
        }}
        className="w-full max-w-md bg-white rounded-t-[2.25rem] sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden relative"
      >
        {/* Mobile Pull-Down Handle Indicator */}
        <div className="sm:hidden w-full pt-2.5 pb-1 flex justify-center items-center bg-gradient-to-b from-slate-50 to-slate-50/80 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 rounded-full bg-slate-300/90" />
        </div>

        {/* Top Mood Glow Accent Strip */}
        <div
          className="w-full h-2.5 shrink-0 transition-colors duration-300"
          style={{ backgroundColor: config.primaryColor }}
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-b from-slate-50/90 to-white shrink-0">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs"
              style={{
                backgroundColor: `${config.primaryColor}15`,
                borderColor: `${config.primaryColor}40`,
              }}
            >
              <MoodAvatar mood={selectedMood} isSelected size={40} />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="save-entry-title"
                  className="text-base font-black text-slate-900 tracking-tight leading-tight"
                >
                  Save {config.label} Entry
                </h3>
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: 'spring' }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-2xs"
                  style={{
                    backgroundColor: `${config.primaryColor}20`,
                    color: config.primaryColor,
                    borderColor: `${config.primaryColor}50`,
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  {potentialNotesXp > 0
                    ? `+${potentialNotesXp} XP`
                    : 'Max 35 XP Reached (+0 XP)'}
                </motion.span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                {config.tagline} • {existingDayXp > 0 ? 'Update today’s log' : 'Daily check-in'}
              </p>
            </div>
          </div>

          {/* Top Close / Dismiss Button */}
          <button
            type="button"
            id="close-save-entry-modal-btn"
            onClick={onCancel}
            disabled={isSaving}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer shrink-0"
            aria-label="Cancel and close dialog"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Quick Influences / Tags */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>What contributed to this feeling? (optional)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag, idx) => {
                const isTagSelected = selectedTags.includes(tag);
                return (
                  <motion.button
                    key={tag}
                    type="button"
                    id={`popup-tag-${tag.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    onClick={() => toggleTag(tag)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + idx * 0.02 }}
                    className={`text-xs px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer select-none ${
                      isTagSelected
                        ? 'bg-slate-900 text-white shadow-xs scale-[1.02]'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isTagSelected && <Check className="w-3 h-3 inline mr-1 stroke-[3]" />}
                    {tag}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Reason Text Area */}
          <div>
            <label
              htmlFor="popup-mood-reason-textarea"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Why are you feeling this way?
            </label>
            <div className="relative">
              <textarea
                id="popup-mood-reason-textarea"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={getPlaceholder()}
                autoFocus
                className="w-full p-3.5 text-sm text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-200 focus:border-slate-800 rounded-2xl outline-none transition-all placeholder:text-slate-400 resize-none shadow-2xs leading-relaxed font-medium"
              />
            </div>
            <div className="flex justify-between items-center px-1 mt-1 text-[11px] text-slate-400 font-semibold">
              <span className="text-slate-500">
                Encrypted in your private journal
              </span>
              <span>{reason.length} chars</span>
            </div>
          </div>

          {/* Reassurance Notice */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-2 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              {existingDayXp === 0 ? (
                <span>
                  Log a <strong>Quick mood</strong> to earn <strong className="font-extrabold text-amber-900">+20 XP</strong>, or add reflection notes for <strong className="font-extrabold text-amber-900">+35 XP</strong>! (Max 35 XP / day)
                </span>
              ) : existingDayXp < 35 ? (
                <span>
                  You logged a quick mood today (+20 XP). Add your notes or influences to unlock the <strong className="font-extrabold text-amber-900">+15 XP reflection bonus</strong>! (Max 35 XP / day)
                </span>
              ) : (
                <span>
                  You already claimed the maximum <strong className="font-extrabold text-amber-900">35 XP</strong> for today! Updating your mood or notes is saved with <strong className="font-extrabold text-amber-900">+0 XP</strong>.
                </span>
              )}
            </div>
          </motion.div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-4 sm:p-5 pt-3 border-t border-slate-100 bg-slate-50/90 shrink-0 flex flex-col gap-2">
          {/* Top row: Save Notes / Save Entry & Quick mood */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            {/* Primary Save Button */}
            <motion.button
              type="button"
              id="popup-save-daily-entry-btn"
              disabled={isSaving}
              onClick={handleSave}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-black text-sm shadow-md transition-all disabled:opacity-60 cursor-pointer"
              style={{
                backgroundColor: config.primaryColor,
              }}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {potentialNotesXp > 0
                      ? `Save notes (+${potentialNotesXp} XP)`
                      : 'Save notes (+0 XP)'}
                  </span>
                </>
              )}
            </motion.button>

            {/* Quick Mood Button */}
            <motion.button
              type="button"
              id="popup-quick-mood-btn"
              disabled={isSaving}
              onClick={onSkipReason}
              whileTap={{ scale: 0.97 }}
              title="Log your mood instantly without notes"
              className="flex items-center justify-center gap-1.5 py-3 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all disabled:opacity-60 cursor-pointer shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>
                {potentialQuickXp > 0
                  ? 'Quick mood (+20 XP)'
                  : 'Quick mood (+0 XP)'}
              </span>
            </motion.button>
          </div>

          {/* Cancel Button - goes back to previous state */}
          <button
            type="button"
            id="popup-cancel-btn"
            disabled={isSaving}
            onClick={onCancel}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-transparent hover:bg-slate-200/60 text-slate-600 hover:text-slate-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Cancel</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
