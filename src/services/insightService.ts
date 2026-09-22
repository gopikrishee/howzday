import { MoodEntry, GamificationStats, MonthlyInsight, MoodLevel } from '../types';

const INSIGHT_CACHE_PREFIX = 'howzday_insight_v1_';

export interface GenerateInsightParams {
  userId?: string;
  monthKey: string; // e.g. "2026-09"
  monthName: string; // e.g. "September 2026"
  entries: MoodEntry[];
  stats: GamificationStats;
  forceRefresh?: boolean;
}

/**
 * Formats a month key (YYYY-MM) into a readable string like "September 2026"
 */
export function formatMonthName(monthKey: string): string {
  try {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const date = new Date(year, month, 1);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  } catch {
    return monthKey;
  }
}

/**
 * Gets cached monthly insight from localStorage if available
 */
export function getCachedMonthlyInsight(userId: string | undefined, monthKey: string): MonthlyInsight | null {
  try {
    const key = `${INSIGHT_CACHE_PREFIX}${userId || 'local'}_${monthKey}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MonthlyInsight;
    if (!parsed) return null;

    // Normalize backward-compatibility for cached objects
    if (!parsed.emotionalSpectrum && parsed.topMoodDistribution) {
      parsed.emotionalSpectrum = {
        upliftedDaysPercent: parsed.topMoodDistribution.happyPercentage || 0,
        calmDaysPercent: parsed.topMoodDistribution.neutralPercentage || 0,
        challengingDaysPercent: parsed.topMoodDistribution.challengingPercentage || 0,
      };
    }
    if (!parsed.positiveCatalysts) {
      parsed.positiveCatalysts = parsed.catalystTags?.positiveTags || [];
    }
    if (!parsed.stressTriggers) {
      parsed.stressTriggers = parsed.catalystTags?.challengingTags || [];
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Saves generated monthly insight to localStorage
 */
export function saveCachedMonthlyInsight(userId: string | undefined, insight: MonthlyInsight): void {
  try {
    const key = `${INSIGHT_CACHE_PREFIX}${userId || 'local'}_${insight.monthKey}`;
    localStorage.setItem(key, JSON.stringify(insight));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Intelligent client-side heuristic synthesizer for offline / static hosting environments (e.g. GitHub Pages)
 */
export function synthesizeLocalInsight(params: GenerateInsightParams): MonthlyInsight {
  const { monthKey, monthName, entries, stats } = params;

  // Filter entries to this month
  const monthEntries = entries.filter((e) => e.date.startsWith(monthKey));
  const total = monthEntries.length;

  const moodCounts: Record<MoodLevel, number> = {
    happy: 0,
    neutral: 0,
    sad: 0,
    angry: 0,
    tired: 0,
    relax: 0,
    sleepy: 0,
    romantic: 0,
    sick: 0,
  };

  const tagMoodScores: Record<string, { positive: number; challenging: number }> = {};

  monthEntries.forEach((e) => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    const isPos = e.mood === 'happy' || e.mood === 'relax' || e.mood === 'romantic';
    const isNeg = e.mood === 'sad' || e.mood === 'angry' || e.mood === 'tired' || e.mood === 'sick';

    if (e.tags && Array.isArray(e.tags)) {
      e.tags.forEach((t) => {
        if (!tagMoodScores[t]) {
          tagMoodScores[t] = { positive: 0, challenging: 0 };
        }
        if (isPos) tagMoodScores[t].positive += 1;
        if (isNeg) tagMoodScores[t].challenging += 1;
      });
    }
  });

  const happyTotal = moodCounts.happy + moodCounts.relax + moodCounts.romantic;
  const neutralTotal = moodCounts.neutral + moodCounts.sleepy;
  const challengeTotal = moodCounts.sad + moodCounts.angry + moodCounts.tired + moodCounts.sick;

  const happyPct = total > 0 ? Math.round((happyTotal / total) * 100) : 0;
  const neutralPct = total > 0 ? Math.round((neutralTotal / total) * 100) : 0;
  const challengePct = total > 0 ? Math.round((challengeTotal / total) * 100) : 0;

  // Determine dominant mood
  let dominantMood: MoodLevel = 'happy';
  let dominantCount = 0;
  (Object.keys(moodCounts) as MoodLevel[]).forEach((m) => {
    if (moodCounts[m] > dominantCount) {
      dominantCount = moodCounts[m];
      dominantMood = m;
    }
  });
  const dominantPercentage = total > 0 ? Math.round((dominantCount / total) * 100) : 0;

  // Derive top catalyst tags
  const sortedTags = Object.entries(tagMoodScores);
  const positiveTags = sortedTags
    .filter(([, s]) => s.positive > s.challenging)
    .sort((a, b) => b[1].positive - a[1].positive)
    .slice(0, 3)
    .map(([t]) => t);

  const challengingTags = sortedTags
    .filter(([, s]) => s.challenging > s.positive)
    .sort((a, b) => b[1].challenging - a[1].challenging)
    .slice(0, 2)
    .map(([t]) => t);

  // Emotional Weather Archetype Determination
  let archetype = 'Steady Anchor';
  let emoji = '⚓';
  let headline = `A grounded month anchored by mindful self-awareness across ${total} check-ins.`;
  let reflectiveSummary = `${monthName} highlighted a reliable baseline of inner calm. You engaged thoughtfully with daily check-ins, recognizing your emotions as they flowed without judgment.`;
  const keyStrengths: string[] = [];
  let mindfulExperiment =
    'Take two slow, deliberate deep breaths before stepping into your morning routine.';

  if (happyPct >= 60) {
    archetype = 'Golden Horizon';
    emoji = '🌅';
    headline = `An uplifting month with vibrant momentum and positive resonance (${happyPct}% high-vitality days).`;
    reflectiveSummary = `Your emotional landscape this month leaned strongly toward joy and relaxation. You consistently cultivated moments of fulfillment, creating a radiant foundation for your daily activities.`;
    keyStrengths.push(`High emotional vitality with ${happyPct}% uplifted days`);
    keyStrengths.push(`Built an inspiring ${stats.currentStreak}-day mindful check-in streak`);
    mindfulExperiment =
      'Notice the subtle habits or people that boosted your energy this month and intentionally schedule more of them.';
  } else if (challengePct >= 40) {
    archetype = 'Gentle Rain & Growth';
    emoji = '🌿';
    headline = `A resilient month navigating emotional weather with honest vulnerability and courage.`;
    reflectiveSummary = `This month brought its share of heavier emotional weather, yet you chose to honor your feelings rather than suppress them. Your continuous logging demonstrates meaningful emotional courage and resilience.`;
    keyStrengths.push('Demonstrated deep emotional honesty by documenting difficult days');
    keyStrengths.push('Bounced back consistently, showing active resilience and inner grit');
    mindfulExperiment =
      'On days when energy feels drained, allow yourself a non-negotiable 15-minute restorative pause without digital screens.';
  } else if (moodCounts.relax >= moodCounts.happy && moodCounts.relax > 0) {
    archetype = 'Breezy Harmony';
    emoji = '🍃';
    headline = `A peaceful rhythm centered on restoration, unwinding, and spacious pauses.`;
    reflectiveSummary = `Rest and steady presence were central to your experience during ${monthName}. You allowed yourself space to decompress, which serves as a powerful protective barrier against burnout.`;
    keyStrengths.push('Prioritized restorative equilibrium and self-care');
    keyStrengths.push(`Maintained mindfulness across ${total} recorded days`);
    mindfulExperiment =
      'Try integrating a 5-minute evening gratitude journal before sleeping to seal each peaceful day.';
  } else {
    archetype = 'Breezy Clarity';
    emoji = '🌤️';
    headline = `A balanced and reflective period with clear perspective across life’s shifting tides.`;
    reflectiveSummary = `You moved through ${monthName} with equilibrium, embracing both moments of brightness and quiet neutrality. This balanced perspective is the hallmark of enduring emotional maturity.`;
    keyStrengths.push(`Balanced emotional stability across ${total} recorded check-ins`);
    keyStrengths.push('Consistent mindfulness tracking supporting steady XP progression');
    mindfulExperiment =
      'Experiment with naming your mood in a single word each midday to stay connected to your inner flow.';
  }

  if (positiveTags.length > 0) {
    keyStrengths.push(`Positive energy consistently sparked by #${positiveTags.join(', #')}`);
  }

  return {
    monthKey,
    monthName,
    totalEntries: total,
    emotionalWeather: {
      archetype,
      emoji,
      headline,
    },
    reflectiveSummary,
    keyStrengths: keyStrengths.slice(0, 3),
    mindfulExperiment,
    topMoodDistribution: {
      dominantMood,
      dominantPercentage,
      happyPercentage: happyPct,
      neutralPercentage: neutralPct,
      challengingPercentage: challengePct,
    },
    emotionalSpectrum: {
      upliftedDaysPercent: happyPct,
      calmDaysPercent: neutralPct,
      challengingDaysPercent: challengePct,
    },
    catalystTags: {
      positiveTags,
      challengingTags,
    },
    positiveCatalysts: positiveTags,
    stressTriggers: challengingTags,
    generatedAt: Date.now(),
    isAiGenerated: false,
  };
}

/**
 * Fetches or generates a monthly insight.
 * First checks cache. If cache misses or forceRefresh is true, tries server AI endpoint.
 * Gracefully falls back to local synthesis if offline or on static GitHub Pages.
 */
export async function getMonthlyInsight(params: GenerateInsightParams): Promise<MonthlyInsight> {
  const { userId, monthKey, monthName, entries, stats, forceRefresh } = params;

  // 1. Check local cache unless forceRefresh
  if (!forceRefresh) {
    const cached = getCachedMonthlyInsight(userId, monthKey);
    if (cached) {
      return cached;
    }
  }

  const monthEntries = entries.filter((e) => e.date.startsWith(monthKey));
  if (monthEntries.length === 0) {
    return synthesizeLocalInsight(params);
  }

  // 2. Try server-side Gemini AI generation
  try {
    const moodCounts: Record<string, number> = {};
    monthEntries.forEach((e) => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });

    const response = await fetch('/api/monthly-insight', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        month: monthKey,
        monthName,
        stats: {
          totalEntries: monthEntries.length,
          currentStreak: stats.currentStreak,
          level: stats.level,
          moodCounts,
        },
        entries: monthEntries.map((e) => ({
          date: e.date,
          mood: e.mood,
          reason: e.reason,
          isPrivateReason: e.isPrivateReason,
          tags: e.tags,
        })),
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        const aiData = result.data;
        const localStats = synthesizeLocalInsight(params);

        const aiInsight: MonthlyInsight = {
          monthKey,
          monthName,
          totalEntries: monthEntries.length,
          emotionalWeather: {
            archetype: aiData.archetype || localStats.emotionalWeather.archetype,
            emoji: aiData.emoji || localStats.emotionalWeather.emoji,
            headline: aiData.headline || localStats.emotionalWeather.headline,
          },
          reflectiveSummary: aiData.reflectiveSummary || localStats.reflectiveSummary,
          keyStrengths:
            Array.isArray(aiData.keyStrengths) && aiData.keyStrengths.length > 0
              ? aiData.keyStrengths
              : localStats.keyStrengths,
          mindfulExperiment: aiData.mindfulExperiment || localStats.mindfulExperiment,
          topMoodDistribution: localStats.topMoodDistribution,
          emotionalSpectrum: localStats.emotionalSpectrum,
          positiveCatalysts: aiData.positiveCatalysts || localStats.positiveCatalysts || [],
          stressTriggers: aiData.stressTriggers || localStats.stressTriggers || [],
          catalystTags: {
            positiveTags: aiData.positiveCatalysts || localStats.catalystTags?.positiveTags || [],
            challengingTags: aiData.stressTriggers || localStats.catalystTags?.challengingTags || [],
          },
          generatedAt: Date.now(),
          isAiGenerated: true,
        };

        saveCachedMonthlyInsight(userId, aiInsight);
        return aiInsight;
      }
    }
  } catch (err) {
    console.info('Server AI generation not available (using offline synthesis):', err);
  }

  // 3. Fallback to local heuristic synthesis
  const localInsight = synthesizeLocalInsight(params);
  saveCachedMonthlyInsight(userId, localInsight);
  return localInsight;
}
