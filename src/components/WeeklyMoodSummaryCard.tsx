import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoodEntry, MoodLevel } from '../types';
import { getMoodConfig } from '../data/moodConfigs';
import { getTodayDateString } from '../services/storageService';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Smile,
  CheckCircle2,
} from 'lucide-react';

interface WeeklyMoodSummaryCardProps {
  entries: MoodEntry[];
  onNavigateToMoods?: () => void;
}

interface DaySummary {
  dateStr: string;
  dayLabel: string;
  dateNum: number;
  isToday: boolean;
  entries: MoodEntry[];
  primaryMood: MoodLevel | null;
}

export const WeeklyMoodSummaryCard: React.FC<WeeklyMoodSummaryCardProps> = ({
  entries,
  onNavigateToMoods,
}) => {
  const [hoveredMood, setHoveredMood] = useState<MoodLevel | null>(null);
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  // Compute past 7 days date strings (from 6 days ago up to today)
  const past7DaysData = useMemo(() => {
    const today = new Date();
    const days: DaySummary[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getTodayDateString(d);
      const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short' });
      const dateNum = d.getDate();
      const isToday = i === 0;

      // Filter entries matching this date
      const dayEntries = entries.filter((e) => e.date === dateStr);

      // Sort by timestamp descending (newest first)
      const sortedDayEntries = [...dayEntries].sort(
        (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
      );

      const primaryMood = sortedDayEntries.length > 0 ? sortedDayEntries[0].mood : null;

      days.push({
        dateStr,
        dayLabel,
        dateNum,
        isToday,
        entries: sortedDayEntries,
        primaryMood,
      });
    }

    return days;
  }, [entries]);

  // All entries that fall within the past 7 days
  const past7DateSet = useMemo(
    () => new Set(past7DaysData.map((d) => d.dateStr)),
    [past7DaysData]
  );

  const weeklyEntries = useMemo(
    () => entries.filter((e) => past7DateSet.has(e.date)),
    [entries, past7DateSet]
  );

  // Calculate mood counts and distribution percentage
  const distribution = useMemo(() => {
    const counts: Partial<Record<MoodLevel, number>> = {};
    weeklyEntries.forEach((entry) => {
      counts[entry.mood] = (counts[entry.mood] || 0) + 1;
    });

    const total = weeklyEntries.length;
    const items: Array<{
      mood: MoodLevel;
      count: number;
      percentage: number;
      config: ReturnType<typeof getMoodConfig>;
    }> = [];

    (Object.keys(counts) as MoodLevel[]).forEach((mood) => {
      const count = counts[mood] || 0;
      if (count > 0) {
        items.push({
          mood,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          config: getMoodConfig(mood),
        });
      }
    });

    // Sort by count descending
    items.sort((a, b) => b.count - a.count);

    return { total, items };
  }, [weeklyEntries]);

  // Days with at least one check-in
  const activeDaysCount = useMemo(
    () => past7DaysData.filter((d) => d.entries.length > 0).length,
    [past7DaysData]
  );

  // Dominant mood
  const dominantMoodItem = distribution.items.length > 0 ? distribution.items[0] : null;

  // Date range formatted string
  const dateRangeLabel = useMemo(() => {
    if (past7DaysData.length === 0) return '';
    const firstDate = new Date(past7DaysData[0].dateStr);
    const lastDate = new Date(past7DaysData[past7DaysData.length - 1].dateStr);

    const firstStr = firstDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    const lastStr = lastDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    return `${firstStr} – ${lastStr}`;
  }, [past7DaysData]);

  // Selected day details for interactive drill-down
  const selectedDay = useMemo(() => {
    if (!selectedDayDate) return null;
    return past7DaysData.find((d) => d.dateStr === selectedDayDate) || null;
  }, [selectedDayDate, past7DaysData]);

  return (
    <div
      id="weekly-mood-summary-card"
      className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4 relative overflow-hidden transition-all duration-300"
    >
      {/* Decorative ambient background blur */}
      {dominantMoodItem && (
        <div
          className="absolute -right-16 -top-16 w-48 h-48 rounded-full pointer-events-none opacity-20 blur-3xl transition-colors duration-700"
          style={{ backgroundColor: dominantMoodItem.config.primaryColor }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-50 border border-indigo-100/90 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
            <BarChart3 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Weekly Mood Summary
            </h3>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              Past 7 Days &bull; {dateRangeLabel}
            </p>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-bold whitespace-nowrap">
            {activeDaysCount} of 7 days active
          </span>
        </div>
      </div>

      {/* Main Visual: If no check-ins yet */}
      {distribution.total === 0 ? (
        <div className="py-8 px-4 text-center rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <Smile className="w-6 h-6" />
          </div>
          <div className="max-w-xs">
            <h4 className="text-xs font-bold text-slate-800">
              No Mood Logs in the Past 7 Days
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
              Start checking in on the Moods screen to view your weekly emotional distribution and trends here.
            </p>
          </div>
          {onNavigateToMoods && (
            <button
              type="button"
              onClick={onNavigateToMoods}
              className="mt-1 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              Log Today&apos;s Mood
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Dominant Emotional Climate Card */}
          {dominantMoodItem && (
            <div
              className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all"
              style={{
                backgroundColor: `${dominantMoodItem.config.primaryColor}0C`,
                borderColor: `${dominantMoodItem.config.primaryColor}28`,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-2xs border select-none"
                  style={{
                    backgroundColor: `${dominantMoodItem.config.primaryColor}18`,
                    borderColor: `${dominantMoodItem.config.primaryColor}30`,
                  }}
                >
                  <span>{dominantMoodItem.config.emoji}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Dominant Mood
                    </span>
                    <span
                      className="text-[10px] font-black px-1.5 py-0.5 rounded-md"
                      style={{
                        backgroundColor: `${dominantMoodItem.config.primaryColor}20`,
                        color: dominantMoodItem.config.primaryColor,
                      }}
                    >
                      {dominantMoodItem.percentage}%
                    </span>
                  </div>
                  <h4
                    className="text-sm font-black mt-0.5 leading-tight"
                    style={{ color: dominantMoodItem.config.primaryColor }}
                  >
                    {dominantMoodItem.config.label}
                    <span className="text-slate-500 font-semibold text-xs ml-1.5">
                      &bull; {dominantMoodItem.config.tagline}
                    </span>
                  </h4>
                </div>
              </div>

              <div className="text-right shrink-0 pl-3 border-l border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                  Total
                </span>
                <span className="text-xs font-black text-slate-800 whitespace-nowrap">
                  {distribution.total} {distribution.total === 1 ? 'log' : 'logs'}
                </span>
              </div>
            </div>
          )}

          {/* Segmented Distribution Progress Bar */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                Mood Distribution
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {distribution.items.length} distinct {distribution.items.length === 1 ? 'mood' : 'moods'}
              </span>
            </div>

            {/* The Multi-Segment Bar */}
            <div
              className="h-3.5 w-full bg-slate-100 rounded-full flex overflow-hidden p-0.5 border border-slate-200/80 shadow-2xs gap-0.5"
              role="progressbar"
              aria-label="7-day mood distribution"
            >
              {distribution.items.map((item) => {
                const isHovered = hoveredMood === item.mood;
                return (
                  <div
                    key={item.mood}
                    onMouseEnter={() => setHoveredMood(item.mood)}
                    onMouseLeave={() => setHoveredMood(null)}
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.config.primaryColor,
                    }}
                    className={`h-full rounded-full transition-all duration-300 relative group cursor-pointer ${
                      isHovered ? 'scale-y-125 z-10 brightness-110 shadow-xs' : 'opacity-95'
                    }`}
                    title={`${item.config.label}: ${item.count} (${item.percentage}%)`}
                  />
                );
              })}
            </div>

            {/* Interactive Mood Legend Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {distribution.items.map((item) => {
                const isHovered = hoveredMood === item.mood;
                return (
                  <button
                    key={item.mood}
                    type="button"
                    onMouseEnter={() => setHoveredMood(item.mood)}
                    onMouseLeave={() => setHoveredMood(null)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      isHovered
                        ? 'scale-105 shadow-xs bg-white'
                        : 'bg-slate-50/80 hover:bg-white text-slate-700 border-slate-200/80'
                    }`}
                    style={
                      isHovered
                        ? {
                            borderColor: item.config.primaryColor,
                            color: item.config.primaryColor,
                          }
                        : undefined
                    }
                  >
                    <span className="text-xs">{item.config.emoji}</span>
                    <span className="font-extrabold">{item.config.label}</span>
                    <span className="opacity-75 font-semibold text-[10px]">
                      {item.percentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({item.count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7-Day Mini Calendar Strip */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                7-Day Timeline
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                Tap day for details
              </span>
            </div>

            {/* Grid of 7 days */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {past7DaysData.map((day) => {
                const isSelected = selectedDayDate === day.dateStr;
                const hasEntries = day.entries.length > 0;
                const moodConfig = day.primaryMood ? getMoodConfig(day.primaryMood) : null;

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() =>
                      setSelectedDayDate(isSelected ? null : day.dateStr)
                    }
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl border transition-all cursor-pointer text-center relative min-h-[66px] ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-400 shadow-xs ring-2 ring-indigo-200 scale-102'
                        : day.isToday
                        ? 'bg-amber-50/90 border-amber-300 shadow-2xs'
                        : hasEntries
                        ? 'bg-slate-50/90 hover:bg-white border-slate-200 shadow-2xs'
                        : 'bg-slate-50/40 border-slate-200/60 opacity-60'
                    }`}
                  >
                    {/* Day label (e.g. "Mon" or "Today") */}
                    <span
                      className={`text-[9px] sm:text-[10px] font-black uppercase tracking-tight leading-none ${
                        day.isToday ? 'text-amber-800 font-extrabold' : 'text-slate-500'
                      }`}
                    >
                      {day.isToday ? 'Today' : day.dayLabel}
                    </span>

                    {/* Date Number (e.g. "22") */}
                    <span className="text-xs font-black text-slate-800 my-1 leading-none">
                      {day.dateNum}
                    </span>

                    {/* Emoji or Empty State */}
                    <div className="h-5 flex items-center justify-center">
                      {moodConfig ? (
                        <span className="text-base select-none leading-none">
                          {moodConfig.emoji}
                        </span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Day Drilldown Details Modal / Card */}
            <AnimatePresence>
              {selectedDay && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                        Details for {selectedDay.dayLabel}, {selectedDay.dateStr}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedDayDate(null)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        Close
                      </button>
                    </div>

                    {selectedDay.entries.length === 0 ? (
                      <p className="text-slate-500 italic text-[11px]">
                        No mood check-ins recorded for this day.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedDay.entries.map((item) => {
                          const config = getMoodConfig(item.mood);
                          const slotLabel =
                            item.timeSlot === 'slot_12am_8am'
                              ? '12AM – 8AM (Morning)'
                              : item.timeSlot === 'slot_8am_4pm'
                              ? '8AM – 4PM (Afternoon)'
                              : '4PM – 12AM (Evening)';

                          return (
                            <div
                              key={item.id}
                              className="p-2 rounded-xl bg-white border border-indigo-100 flex items-center justify-between gap-2 shadow-2xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base select-none">{config.emoji}</span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="font-bold text-xs"
                                      style={{ color: config.primaryColor }}
                                    >
                                      {config.label}
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-500">
                                      &bull; {slotLabel}
                                    </span>
                                  </div>
                                  {item.reason && !item.isPrivateReason && (
                                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                                      &ldquo;{item.reason}&rdquo;
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
};
