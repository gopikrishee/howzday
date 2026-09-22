import { MoodEntry, GamificationStats, MoodLevel, StatusReaction, MoodTimeSlot, DailyPlanner, DailyTaskItem } from '../types';

const STORAGE_KEYS = {
  ENTRIES: 'daily_mood_entries_v1',
  STATS: 'daily_mood_stats_v1',
  REACTIONS: 'daily_mood_reactions_v1',
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
 * Returns the 8-hour diurnal time slot for mood logging:
 * 1. 12AM - 8AM (Hours 00:00 to 07:59) -> 'slot_12am_8am'
 * 2. 8AM - 4PM (Hours 08:00 to 15:59) -> 'slot_8am_4pm'
 * 3. 4PM - 12AM (Hours 16:00 to 23:59) -> 'slot_4pm_12am'
 */
export const getMoodTimeSlot = (d: Date = new Date()): MoodTimeSlot => {
  const hour = d.getHours();
  if (hour >= 0 && hour < 8) {
    return 'slot_12am_8am';
  } else if (hour >= 8 && hour < 16) {
    return 'slot_8am_4pm';
  } else {
    return 'slot_4pm_12am';
  }
};

/**
 * Normalizes and deduplicates a list of mood entries to ensure:
 * - Each day has at most 3 entries (one per time slot: 12AM-8AM, 8AM-4PM, 4PM-12AM)
 * - The latest mood change within each time slot is preserved
 * - Entries are sorted by timestamp in descending order (newest first)
 */
export const normalizeMoodEntries = (entries: MoodEntry[]): MoodEntry[] => {
  if (!entries || entries.length === 0) return [];
  // Sort descending by timestamp
  const sorted = [...entries].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const slotMap = new Map<string, MoodEntry>();
  const normalized: MoodEntry[] = [];

  for (const item of sorted) {
    if (!item || !item.date) continue;
    const timeSlot = item.timeSlot || getMoodTimeSlot(new Date(item.timestamp || Date.now()));
    const key = `${item.date}_${timeSlot}`;
    if (!slotMap.has(key)) {
      const normalizedItem: MoodEntry = {
        ...item,
        timeSlot,
      };
      slotMap.set(key, normalizedItem);
      normalized.push(normalizedItem);
    }
  }

  return normalized;
};

/**
 * Calculates the exact daily streak and check-in stats directly from user mood entries.
 * Rule:
 * 1. A day is checked in if there is at least one entry with date === that day.
 * 2. If the user checks in any mood for that day, the streak is increased by 1 (from previous consecutive days).
 * 3. Multiple entries on the same day (up to 3 time slots) count towards that same single day.
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

export const storageService = {
  getTodayDateString,
  getYesterdayDateString,
  getMoodTimeSlot,
  normalizeMoodEntries,

  getUserEntriesKey(userId?: string): string {
    return userId ? `daily_mood_entries_${userId}` : STORAGE_KEYS.ENTRIES;
  },

  getUserStatsKey(userId?: string): string {
    return userId ? `daily_mood_stats_${userId}` : STORAGE_KEYS.STATS;
  },

  getUserReactionsKey(userId?: string): string {
    return userId ? `daily_mood_reactions_${userId}` : STORAGE_KEYS.REACTIONS;
  },

  getLocalReactions(userId?: string): StatusReaction[] {
    try {
      const key = this.getUserReactionsKey(userId);
      const stored = localStorage.getItem(key);
      if (!stored) return [];
      const parsed: StatusReaction[] = JSON.parse(stored);
      const filtered = parsed.filter(
        (r) => r.label?.toLowerCase() !== 'you got this' && r.emoji !== '💪'
      );
      if (filtered.length !== parsed.length) {
        localStorage.setItem(key, JSON.stringify(filtered));
      }
      return filtered;
    } catch {
      return [];
    }
  },

  saveLocalReaction(reaction: StatusReaction, userId?: string): StatusReaction[] {
    if (reaction.label?.toLowerCase() === 'you got this' || reaction.emoji === '💪') {
      return this.getLocalReactions(userId);
    }
    try {
      const key = this.getUserReactionsKey(userId);
      const list = this.getLocalReactions(userId);
      const idx = list.findIndex((r) => r.senderId === reaction.senderId);
      if (idx >= 0) {
        list[idx] = reaction;
      } else {
        list.push(reaction);
      }
      localStorage.setItem(key, JSON.stringify(list));
      return list;
    } catch {
      return [];
    }
  },

  markLocalReactionsAsRead(userId?: string): void {
    try {
      const key = this.getUserReactionsKey(userId);
      const list = this.getLocalReactions(userId);
      const updated = list.map((r) => ({ ...r, read: true }));
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to mark local reactions as read:', e);
    }
  },

  clearLocalReactions(userId?: string): void {
    try {
      const key = this.getUserReactionsKey(userId);
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Failed to clear local reactions:', e);
    }
  },

  getEntries(userId?: string): MoodEntry[] {
    try {
      const key = this.getUserEntriesKey(userId);
      const stored = localStorage.getItem(key);
      if (!stored) {
        return [];
      }
      const parsed: MoodEntry[] = JSON.parse(stored);
      return normalizeMoodEntries(parsed);
    } catch {
      return [];
    }
  },

  getTodayEntry(userId?: string): MoodEntry | null {
    const today = getTodayDateString();
    const entries = this.getEntries(userId);
    const todayEntries = entries.filter((e) => e.date === today);
    if (todayEntries.length === 0) return null;
    // Return the latest mood entry recorded today
    return todayEntries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
  },

  purgeHistoricalEntriesExceptToday(userId?: string): MoodEntry[] {
    try {
      const today = getTodayDateString();
      const entriesKey = this.getUserEntriesKey(userId);
      const currentEntries = this.getEntries(userId);
      const todayOnly = currentEntries.filter((e) => e.date === today);
      localStorage.setItem(entriesKey, JSON.stringify(todayOnly));

      // Refresh stats
      const streakStats = calculateStreakStats(todayOnly, today);
      const stats = this.getStats(userId);
      stats.currentStreak = streakStats.currentStreak;
      stats.longestStreak = Math.max(stats.longestStreak || 0, streakStats.longestStreak);
      stats.totalCheckIns = streakStats.totalCheckIns;
      stats.todayCompleted = streakStats.todayCompleted;
      localStorage.setItem(this.getUserStatsKey(userId), JSON.stringify(stats));

      return todayOnly;
    } catch {
      return [];
    }
  },

  getStats(userId?: string): GamificationStats {
    try {
      const key = this.getUserStatsKey(userId);
      const stored = localStorage.getItem(key);
      const today = getTodayDateString();
      const entries = this.getEntries(userId);
      const todayEntry = this.getTodayEntry(userId);
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
        const normalized = normalizeMoodEntries(cloudEntries);
        const entriesKey = this.getUserEntriesKey(userId);
        localStorage.setItem(entriesKey, JSON.stringify(normalized));

        const today = getTodayDateString();
        const streakStats = calculateStreakStats(normalized, today);

        const statsKey = this.getUserStatsKey(userId);
        const statsToSave: GamificationStats = {
          userId,
          currentStreak: streakStats.currentStreak,
          longestStreak: Math.max(cloudStats?.longestStreak || 0, streakStats.longestStreak),
          totalCheckIns: streakStats.totalCheckIns,
          currentXp: cloudStats?.currentXp ?? normalized.reduce((acc, curr) => acc + (curr.xpEarned || 20), 0),
          level: cloudStats?.level ?? (Math.floor((cloudStats?.currentXp ?? 0) / 100) + 1),
          todayCompleted: streakStats.todayCompleted,
          lastCheckInDate: streakStats.todayCompleted ? today : (normalized.length > 0 ? normalized[0].date : undefined),
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
    const now = new Date();
    const today = getTodayDateString(now);
    const timeSlot = getMoodTimeSlot(now);
    const slotEntryId = `entry_${today}_${timeSlot}`;

    const entries = this.getEntries(params.userId);
    const todayEntries = entries.filter((e) => e.date === today);

    const existingSlotIndex = entries.findIndex(
      (e) => e.id === slotEntryId || (e.date === today && e.timeSlot === timeSlot)
    );
    const existingSlotEntry = existingSlotIndex >= 0 ? entries[existingSlotIndex] : null;

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
    // - Max XP per day never exceeds 35
    const previousDayXp = todayEntries.reduce(
      (max, e) => Math.max(max, e.xpEarned ?? (e.isPrivateReason ? 20 : 35)),
      0
    );

    let targetDayXp = previousDayXp;
    if (previousDayXp === 0) {
      targetDayXp = hasNotes ? 35 : 20;
    } else if (previousDayXp < 35 && hasNotes) {
      targetDayXp = 35;
    }

    targetDayXp = Math.min(35, targetDayXp);
    const deltaXp = Math.max(0, targetDayXp - previousDayXp);

    const alreadyExhaustedMaxDailyXp = previousDayXp >= 35;
    const shouldCelebrate = !alreadyExhaustedMaxDailyXp && deltaXp > 0;

    const newEntry: MoodEntry = {
      id: slotEntryId,
      userId: params.userId,
      date: today,
      timeSlot,
      timestamp: Date.now(),
      mood: params.mood,
      reason: isQuickMood ? undefined : (params.reason?.trim() || undefined),
      isPrivateReason: isQuickMood,
      tags: !isQuickMood && params.tags && params.tags.length > 0 ? params.tags : undefined,
      xpEarned: targetDayXp,
      updatedAt: new Date().toISOString(),
    };

    if (existingSlotIndex >= 0) {
      // If mood has changed, clear previous reactions
      if (entries[existingSlotIndex].mood !== params.mood) {
        this.clearLocalReactions(params.userId);
      }
      entries[existingSlotIndex] = newEntry;
    } else {
      // New slot entry for today
      this.clearLocalReactions(params.userId);
      entries.unshift(newEntry);
    }

    const normalizedEntries = normalizeMoodEntries(entries);
    const entriesKey = this.getUserEntriesKey(params.userId);
    localStorage.setItem(entriesKey, JSON.stringify(normalizedEntries));

    // Calculate streak stats dynamically from the updated entries
    const streakStats = calculateStreakStats(normalizedEntries, today);
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
    this.clearLocalReactions(userId);
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

  getDailyPlanners(userId?: string): DailyPlanner[] {
    const key = `daily_planners_${userId || 'guest'}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveDailyPlanners(userId: string | undefined, planners: DailyPlanner[]): void {
    const key = `daily_planners_${userId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(planners));
  },
};

