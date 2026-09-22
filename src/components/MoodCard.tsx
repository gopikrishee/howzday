import React from 'react';
import { motion } from 'motion/react';
import { MoodLevel } from '../types';
import { getMoodConfig } from '../data/moodConfigs';
import { MoodAvatar } from './MoodAvatar';
import { Check } from 'lucide-react';

interface MoodCardProps {
  mood: MoodLevel;
  isSelected: boolean;
  onSelect: (mood: MoodLevel) => void;
  disabled?: boolean;
  isLocked?: boolean;
  isTodayRecorded?: boolean;
}

export const MoodCard: React.FC<MoodCardProps> = ({
  mood,
  isSelected,
  onSelect,
  disabled = false,
  isLocked = false,
  isTodayRecorded = false,
}) => {
  const config = getMoodConfig(mood);

  const handleClick = () => {
    if (disabled) return;
    if (isLocked && !isTodayRecorded) {
      return;
    }
    onSelect(mood);
  };

  return (
    <motion.button
      type="button"
      id={`mood-card-${mood}`}
      disabled={disabled}
      onClick={handleClick}
      whileTap={{ scale: disabled ? 1 : isLocked && !isTodayRecorded ? 0.99 : 0.96 }}
      whileHover={{ y: disabled ? 0 : isLocked && !isTodayRecorded ? 0 : -3 }}
      animate={{
        scale: isSelected ? 1.03 : 1,
        y: isSelected ? -4 : 0,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`relative flex-1 min-w-0 p-2 sm:p-3.5 min-h-[105px] sm:min-h-[120px] rounded-2xl sm:rounded-3xl border-2 transition-all duration-200 text-left flex flex-col items-center justify-between text-center cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        isSelected
          ? `${config.bgLight} ${config.borderColor} shadow-lg ring-2 ring-offset-1`
          : isLocked && !isTodayRecorded
          ? 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-60 hover:opacity-80 shadow-2xs'
          : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 hover:shadow-md shadow-xs'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      style={{
        boxShadow: isSelected
          ? `0 12px 28px -6px ${config.glowColor}, 0 8px 12px -6px ${config.glowColor}`
          : undefined,
      }}
      aria-label={`Select mood: ${config.label}`}
      aria-pressed={isSelected}
    >
      {/* Indicator Badge: Shows "Today's mood" if recorded, or Check icon if selected */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-2.5 -right-1.5 sm:-right-2 px-2 sm:px-2.5 py-0.5 rounded-full flex items-center justify-center text-white shadow-md text-[10px] font-bold tracking-tight whitespace-nowrap z-10"
          style={{ backgroundColor: config.primaryColor }}
        >
          {isTodayRecorded ? (
            <span>Today&apos;s mood</span>
          ) : (
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          )}
        </motion.div>
      )}

      {/* Mood Emoji / Avatar */}
      <div className="my-0.5 sm:my-1 flex items-center justify-center">
        <MoodAvatar
          mood={mood}
          isSelected={isSelected}
          size={46}
        />
      </div>

      {/* Mood Name */}
      <div className="mt-1 w-full">
        <span
          className={`block text-xs sm:text-sm font-extrabold tracking-tight leading-tight ${
            isSelected
              ? config.textColor
              : isLocked && !isTodayRecorded
              ? 'text-slate-600'
              : 'text-slate-900'
          }`}
        >
          {config.label}
        </span>
        <span
          className={`block text-[10px] sm:text-xs font-semibold mt-0.5 truncate ${
            isSelected
              ? 'text-slate-800'
              : isLocked && !isTodayRecorded
              ? 'text-slate-400'
              : 'text-slate-600'
          }`}
        >
          {isTodayRecorded ? 'Recorded today' : config.tagline}
        </span>
      </div>

      {/* Gamified Pulse Ring on Select */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0.7, scale: 0.95 }}
          animate={{ opacity: 0, scale: 1.15 }}
          transition={{ duration: 1.3, repeat: Infinity }}
          className="absolute inset-0 rounded-3xl pointer-events-none border-2"
          style={{ borderColor: config.primaryColor }}
        />
      )}
    </motion.button>
  );
};
