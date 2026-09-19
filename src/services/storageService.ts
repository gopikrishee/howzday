import { MoodEntry, GamificationStats, MoodLevel } from '../types';

const STORAGE_KEYS = {
  ENTRIES: 'daily_mood_entries_v1',
  STATS: 'daily_mood_stats_v1',
};

export const getTodayDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getYesterdayDateString = (d: Date = new Date()): string => {
  const prev = new Date(d);
  prev.setDate(prev.getDate() - 1);
  return getTodayDateString(prev);
};

export const getPrevDateString = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0);
  date.setDate(date.getDate() - 1);
  return getTodayDateString(date);
};

export const getNextDateString = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0);
  date.setDate(date.getDate() + 1);
  return getTodayDateString(date);
};

/**
 * Calculates the exact daily streak and check-in stats directly from user mood entries.
 * Rule:
 * 1. A day is checked in if there is an entry with date === that day.
 * 2. If the user checks in any mood for that day, the streak is increased by 1 (from previous consecutive days).
 * 3. Editing or saving another mood on the same day does NOT increase the streak again.
 * 4. If the user has not checked in yet today, the streak remains at yesterday's achieved streak (awaiting today's check-in).
 * 5. If yesterday was not checked in and today is not checked in, the streak is broken (0).
 */
export const calculateStreakStats = (
  entries: MoodEntry[],
  todayStr: string = getTodayDateString()
): {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  todayCompleted: boolean;
} => {
  const uniqueDates = Array.from(new Set(entries.map((e) => e.date).filter(Boolean))).sort();
  const dateSet = new Set(uniqueDates);
  const totalCheckIns = uniqueDates.length;
  const todayCompleted = dateSet.has(todayStr);

  if (uniqueDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCheckIns: 0,
      todayCompleted: false,
    };
  }

  const yesterdayStr = getPrevDateString(todayStr);
  let currentStreak = 0;

  if (todayCompleted) {
    // User checked in today: active streak is 1 (today) + consecutive days prior
    currentStreak = 1;
    let checkDate = yesterdayStr;
    while (dateSet.has(checkDate)) {
      currentStreak += 1;
      checkDate = getPrevDateString(checkDate);
    }
  } else if (dateSet.has(yesterdayStr)) {
    // User checked in yesterday but not yet today:
    // Display streak achieved up to yesterday (awaiting today's check-in to increase by 1)
    currentStreak = 1;
    let checkDate = getPrevDateString(yesterdayStr);
    while (dateSet.has(checkDate)) {
      currentStreak += 1;
      checkDate = getPrevDateString(checkDate);
    }
  } else {
    // Neither today nor yesterday was checked in: streak is broken
    currentStreak = 0;
  }

  // Calculate longest historical streak across all check-ins
  let longestStreak = 0;
  let runningStreak = 0;
  let expectedNext = '';

  for (const d of uniqueDates) {
    if (expectedNext && d === expectedNext) {
      runningStreak += 1;
    } else {
      runningStreak = 1;
    }
    expectedNext = getNextDateString(d);
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalCheckIns,
    todayCompleted,
  };
};

const DEFAULT_STATS: GamificationStats = {
  currentStreak: 0,
  longestStreak: 0,
  totalCheckIns: 0,
  currentXp: 0,
  level: 1,
  todayCompleted: false,
  unlockedBadges: ['first_step'],
};

// Seed sample past entries for demonstration if storage is completely empty (strictly past days)
const createSeedEntries = (): MoodEntry[] => {
  const today = new Date();
  const d3 = new Date(today);
  d3.setDate(d3.getDate() - 3);
  const d2 = new Date(today);
  d2.setDate(d2.getDate() - 2);
  const d1 = new Date(today);
  d1.setDate(d1.getDate() - 1);

  return [
    {
      id: 'seed-3',
      date: getTodayDateString(d3),
      timestamp: d3.getTime(),
      mood: 'happy',
      reason: 'Went for a morning run and grabbed iced coffee with friends!',
      tags: ['Exercise', 'Friends'],
      xpEarned: 35,
    },
    {
      id: 'seed-2',
      date: getTodayDateString(d2),
      timestamp: d2.getTime(),
      mood: 'neutral',
      reason: 'Quiet workday, kept steady pacing throughout meetings.',
      tags: ['Work'],
      xpEarned: 35,
    },
    {
      id: 'seed-1',
      date: getTodayDateString(d1),
      timestamp: d1.getTime(),
      mood: 'happy',
      isPrivateReason: true,
      xpEarned: 20,
    },
  ];
};

export const storageService = {
  getTodayDateString,
  getYesterdayDateString,

  getUserEntriesKey(userId?: string): string {
    return userId ? `daily_mood_entries_${userId}` : STORAGE_KEYS.ENTRIES;
  },

  getUserStatsKey(userId?: string): string {
    return userId ? `daily_mood_stats_${userId}` : STORAGE_KEYS.STATS;
  },

  getEntries(userId?: string): MoodEntry[] {
    try {
      const key = this.getUserEntriesKey(userId);
      const stored = localStorage.getItem(key);
      if (!stored) {
        if (userId) {
          return [];
        }
        const seeds = createSeedEntries();
        localStorage.setItem(key, JSON.stringify(seeds));
        return seeds;
      }
      return JSON.parse(stored);
    } catch {
      return userId ? [] : createSeedEntries();
    }
  },

  getTodayEntry(userId?: string): MoodEntry | null {
    const today = getTodayDateString();
    const entries = this.getEntries(userId);
    return entries.find((e) => e.date === today) || null;
  },

  getStats(userId?: string): GamificationStats {
    try {
      const key = this.getUserStatsKey(userId);
      const stored = localStorage.getItem(key);
      const today = getTodayDateString();
      const entries = this.getEntries(userId);
      const todayEntry = entries.find((e) => e.date === today);
      const streakStats = calculateStreakStats(entries, today);

      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.todayCompleted = streakStats.todayCompleted;
        parsed.currentStreak = streakStats.currentStreak;
        parsed.longestStreak = Math.max(parsed.longestStreak || 0, streakStats.longestStreak);
        parsed.totalCheckIns = streakStats.totalCheckIns;
        if (todayEntry) {
          parsed.lastCheckInDate = today;
        }
        return parsed;
      }

      if (userId) {
        return {
          ...DEFAULT_STATS,
          userId,
          currentStreak: streakStats.currentStreak,
          longestStreak: streakStats.longestStreak,
          totalCheckIns: streakStats.totalCheckIns,
          todayCompleted: streakStats.todayCompleted,
          lastCheckInDate: todayEntry ? today : undefined,
        };
      }

      const totalXp = entries.reduce((acc, curr) => acc + (curr.xpEarned || 20), 0);
      const defaultStats: GamificationStats = {
        ...DEFAULT_STATS,
        currentStreak: streakStats.currentStreak,
        longestStreak: streakStats.longestStreak,
        totalCheckIns: streakStats.totalCheckIns,
        currentXp: totalXp,
        level: Math.floor(totalXp / 100) + 1,
        todayCompleted: streakStats.todayCompleted,
        lastCheckInDate: todayEntry ? today : (entries.length > 0 ? entries[0].date : undefined),
      };
      return defaultStats;
    } catch {
      return DEFAULT_STATS;
    }
  },

  cacheCloudData(userId: string, cloudEntries: MoodEntry[], cloudStats?: GamificationStats | null): void {
    try {
      if (userId) {
        const entriesKey = this.getUserEntriesKey(userId);
        localStorage.setItem(entriesKey, JSON.stringify(cloudEntries));

        const today = getTodayDateString();
        const streakStats = calculateStreakStats(cloudEntries, today);

        const statsKey = this.getUserStatsKey(userId);
        const statsToSave: GamificationStats = {
          userId,
          currentStreak: streakStats.currentStreak,
          longestStreak: Math.max(cloudStats?.longestStreak || 0, streakStats.longestStreak),
          totalCheckIns: streakStats.totalCheckIns,
          currentXp: cloudStats?.currentXp ?? cloudEntries.reduce((acc, curr) => acc + (curr.xpEarned || 20), 0),
          level: cloudStats?.level ?? (Math.floor((cloudStats?.currentXp ?? 0) / 100) + 1),
          todayCompleted: streakStats.todayCompleted,
          lastCheckInDate: streakStats.todayCompleted ? today : (cloudEntries.length > 0 ? cloudEntries[0].date : undefined),
          unlockedBadges: cloudStats?.unlockedBadges || ['first_step'],
        };
        localStorage.setItem(statsKey, JSON.stringify(statsToSave));
      }
    } catch (e) {
      console.warn('Failed to cache cloud data in local storage:', e);
    }
  },

  async saveMoodEntry(params: {
    mood: MoodLevel;
    reason?: string;
    isPrivateReason?: boolean;
    tags?: string[];
    userId?: string;
  }): Promise<{
    entry: MoodEntry;
    stats: GamificationStats;
    deltaXp: number;
    newLevelUnlocked: boolean;
    alreadyExhaustedMaxDailyXp: boolean;
    shouldCelebrate: boolean;
  }> {
    const today = getTodayDateString();
    const entries = this.getEntries(params.userId);
    const existingIndex = entries.findIndex((e) => e.date === today);
    const existingEntry = existingIndex >= 0 ? entries[existingIndex] : null;

    // Determine if notes/reason or tags are provided
    const hasNotes =
      !params.isPrivateReason &&
      Boolean(
        (params.reason && params.reason.trim().length > 0) ||
        (params.tags && params.tags.length > 0)
      );

    const isQuickMood = params.isPrivateReason || !hasNotes;

    // XP Logic:
    // 1. Quick mood only - award 20 XP (day total: 20)
    // 2. Added notes - award 35 XP (day total: 35)
    // 3. Quick mood first and added notes later on that day - award 15 XP (day total: 35)
    // - Any subsequent mood or note changes once capped or if no notes added: +0 XP
    // - Max XP per day never exceeds 35
    const previousDayXp = existingEntry
      ? (existingEntry.xpEarned ?? (existingEntry.isPrivateReason ? 20 : 35))
      : 0;

    let targetDayXp = previousDayXp;
    if (previousDayXp === 0) {
      targetDayXp = hasNotes ? 35 : 20;
    } else if (previousDayXp < 35 && hasNotes) {
      targetDayXp = 35;
    }

    targetDayXp = Math.min(35, targetDayXp);
    const deltaXp = Math.max(0, targetDayXp - previousDayXp);

    // If user already exhausted 35 XP for today, any upcoming mood change or notes save
    // must NOT trigger the celebration modal.
    const alreadyExhaustedMaxDailyXp = previousDayXp >= 35;
    const shouldCelebrate = !alreadyExhaustedMaxDailyXp && deltaXp > 0;

    const newEntry: MoodEntry = {
      id: existingEntry ? existingEntry.id : `entry-${Date.now()}`,
      userId: params.userId,
      date: today,
      timestamp: Date.now(),
      mood: params.mood,
      reason: isQuickMood ? undefined : (params.reason?.trim() || undefined),
      isPrivateReason: isQuickMood,
      tags: !isQuickMood && params.tags && params.tags.length > 0 ? params.tags : undefined,
      xpEarned: targetDayXp,
    };

    if (existingIndex >= 0) {
      entries[existingIndex] = newEntry;
    } else {
      entries.unshift(newEntry);
    }

    const entriesKey = this.getUserEntriesKey(params.userId);
    localStorage.setItem(entriesKey, JSON.stringify(entries));

    // Calculate streak stats dynamically from the updated entries:
    // If the user checks in any mood for that day, the streak is increased by 1.
    // Re-saving or editing the mood on the same day maintains the streak without increasing it again.
    const streakStats = calculateStreakStats(entries, today);
    const currentStats = this.getStats(params.userId);

    const newTotalXp = currentStats.currentXp + deltaXp;
    const newLevel = Math.floor(newTotalXp / 100) + 1;
    const newLevelUnlocked = newLevel > currentStats.level;

    const updatedStats: GamificationStats = {
      ...currentStats,
      userId: params.userId,
      currentStreak: streakStats.currentStreak,
      longestStreak: Math.max(currentStats.longestStreak || 0, streakStats.longestStreak),
      totalCheckIns: streakStats.totalCheckIns,
      currentXp: newTotalXp,
      level: newLevel,
      lastCheckInDate: today,
      todayCompleted: true,
    };

    const statsKey = this.getUserStatsKey(params.userId);
    localStorage.setItem(statsKey, JSON.stringify(updatedStats));

    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      entry: newEntry,
      stats: updatedStats,
      deltaXp,
      newLevelUnlocked,
      alreadyExhaustedMaxDailyXp,
      shouldCelebrate,
    };
  },

  resetTodayEntry(userId?: string): GamificationStats {
    const today = getTodayDateString();
    let entries = this.getEntries(userId);
    entries = entries.filter((e) => e.date !== today);
    localStorage.setItem(this.getUserEntriesKey(userId), JSON.stringify(entries));

    const streakStats = calculateStreakStats(entries, today);
    const stats = this.getStats(userId);
    stats.currentStreak = streakStats.currentStreak;
    stats.longestStreak = Math.max(stats.longestStreak || 0, streakStats.longestStreak);
    stats.totalCheckIns = streakStats.totalCheckIns;
    stats.todayCompleted = false;
    localStorage.setItem(this.getUserStatsKey(userId), JSON.stringify(stats));
    return stats;
  },
};
