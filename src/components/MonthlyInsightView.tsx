import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { MoodEntry, GamificationStats } from '../types';
import { getMoodConfig } from '../data/moodConfigs';
import {
  getRecommendationsForMood,
} from '../data/moodRecommendations';
import { MoodRecommendationCard } from './MoodRecommendationCard';
import { WeeklyMoodSummaryCard } from './WeeklyMoodSummaryCard';
import {
  Sparkles,
  Copy,
  Check,
  Film,
  Music,
  Tv,
  Radio,
  ShoppingBag,
  Quote,
  LayoutGrid,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface MonthlyInsightViewProps {
  entries: MoodEntry[];
  stats: GamificationStats;
  user: User | null;
  onNavigateToMoods: () => void;
}

type RecommendationFilter = 'all' | 'movie' | 'song' | 'video' | 'podcast' | 'shopping';

export const MonthlyInsightView: React.FC<MonthlyInsightViewProps> = ({
  entries,
  onNavigateToMoods,
}) => {
  const latestEntry = entries.length > 0 ? entries[0] : null;
  const currentMood = latestEntry ? latestEntry.mood : 'happy';

  const [selectedCategory, setSelectedCategory] = useState<RecommendationFilter>('all');
  const [isAffirmationCopied, setIsAffirmationCopied] = useState<boolean>(false);

  // Get curated recommendations for the current mood
  const recommendationSet = getRecommendationsForMood(currentMood);
  const currentMoodConfig = getMoodConfig(currentMood);

  const filteredRecommendations = recommendationSet.items.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const handleCopyAffirmation = () => {
    navigator.clipboard.writeText(`"${recommendationSet.affirmation}" - HowZDay Mood Affirmation`);
    setIsAffirmationCopied(true);
    setTimeout(() => setIsAffirmationCopied(false), 2000);
  };

  return (
    <div id="monthly-insight-screen" className="flex flex-col space-y-4 pb-6">
      {/* 1. Weekly Mood Summary Card */}
      <WeeklyMoodSummaryCard
        entries={entries}
        onNavigateToMoods={onNavigateToMoods}
      />

      {/* 2. Curated Media & Shopping Discovery (Netflix, YouTube, Amazon India) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Tailored Mood Discovery
            </span>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mt-0.5">
              <span>Recommendations for</span>
              <span
                className="px-2.5 py-0.5 rounded-xl border text-sm font-black flex items-center gap-1.5 transition-colors"
                style={{
                  backgroundColor: `${currentMoodConfig.primaryColor}15`,
                  color: currentMoodConfig.primaryColor,
                  borderColor: `${currentMoodConfig.primaryColor}30`,
                }}
              >
                <span>{currentMoodConfig.emoji}</span>
                <span>{currentMoodConfig.label}</span>
              </span>
            </h3>
          </div>
        </div>

        {/* Curator Note */}
        <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/80 p-3 rounded-2xl border border-slate-200/60">
          ✨ <strong className="text-slate-800">Curator Note:</strong> {recommendationSet.curatorNote}
        </p>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/70'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>All ({recommendationSet.items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('movie')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
              selectedCategory === 'movie'
                ? 'bg-red-600 text-white border-red-600 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/70'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Movies (Netflix)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('song')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
              selectedCategory === 'song'
                ? 'bg-red-500 text-white border-red-500 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/70'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Songs (Pop / Tamil / Telugu)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('video')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
              selectedCategory === 'video'
                ? 'bg-red-500 text-white border-red-500 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/70'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Videos (Tamil / Telugu)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('podcast')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
              selectedCategory === 'podcast'
                ? 'bg-red-500 text-white border-red-500 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/70'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Podcasts (Tamil / Telugu)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('shopping')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
              selectedCategory === 'shopping'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/70'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Shopping (Amazon India)</span>
          </button>
        </div>

        {/* Visual Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <AnimatePresence mode="popLayout">
            {filteredRecommendations.map((item) => (
              <MoodRecommendationCard
                key={item.id}
                item={item}
                moodEmoji={currentMoodConfig.emoji}
                themeColor={currentMoodConfig.primaryColor}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Visual Mood Affirmation Banner */}
        <div
          className="p-4 sm:p-5 rounded-3xl border shadow-xs relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4"
          style={{
            background: `linear-gradient(135deg, ${currentMoodConfig.bgLight} 0%, #FFFFFF 100%)`,
            borderColor: `${currentMoodConfig.primaryColor}30`,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs border mt-0.5"
              style={{
                backgroundColor: `${currentMoodConfig.primaryColor}20`,
                borderColor: `${currentMoodConfig.primaryColor}40`,
                color: currentMoodConfig.primaryColor,
              }}
            >
              <Quote className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Daily Mood Affirmation
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug italic mt-0.5">
                "{recommendationSet.affirmation}"
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyAffirmation}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shrink-0 shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 self-end sm:self-center"
          >
            {isAffirmationCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Quote</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
