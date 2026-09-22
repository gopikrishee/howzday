import React from 'react';
import { motion } from 'motion/react';
import { MoodRecommendationItem } from '../data/moodRecommendations';
import {
  Film,
  Music,
  Tv,
  Radio,
  ShoppingBag,
  ExternalLink,
  Sparkles,
  Play,
  ShoppingCart,
  Star,
} from 'lucide-react';

interface MoodRecommendationCardProps {
  item: MoodRecommendationItem;
  moodEmoji: string;
  themeColor: string;
}

export const MoodRecommendationCard: React.FC<MoodRecommendationCardProps> = ({
  item,
  moodEmoji,
  themeColor,
}) => {
  const getCategoryIcon = () => {
    switch (item.category) {
      case 'movie':
        return <Film className="w-3.5 h-3.5" />;
      case 'song':
        return <Music className="w-3.5 h-3.5" />;
      case 'video':
        return <Tv className="w-3.5 h-3.5" />;
      case 'podcast':
        return <Radio className="w-3.5 h-3.5" />;
      case 'shopping':
        return <ShoppingBag className="w-3.5 h-3.5" />;
    }
  };

  const getPlatformBadge = () => {
    switch (item.platform) {
      case 'netflix':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/95 text-white font-black text-[10px] tracking-wide shadow-xs border border-red-400/40">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Netflix Only
          </span>
        );
      case 'youtube':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/95 text-white font-black text-[10px] tracking-wide shadow-xs border border-red-300/40">
            <Play className="w-2.5 h-2.5 fill-white text-white" />
            YouTube Only
          </span>
        );
      case 'amazon':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-600/95 text-white font-black text-[10px] tracking-wide shadow-xs border border-amber-300/40">
            <ShoppingCart className="w-2.5 h-2.5 text-white" />
            Amazon India
          </span>
        );
    }
  };

  const getActionLabel = () => {
    switch (item.platform) {
      case 'netflix':
        return 'Watch on Netflix';
      case 'youtube':
        if (item.category === 'song') return 'Listen on YouTube';
        if (item.category === 'podcast') return 'Listen on YouTube';
        return 'Watch on YouTube';
      case 'amazon':
        return 'Shop on Amazon.in';
    }
  };

  const getActionThemeStyle = () => {
    switch (item.platform) {
      case 'netflix':
        return 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20';
      case 'youtube':
        return 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20';
      case 'amazon':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className="group flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all overflow-hidden relative"
    >
      {/* Visual Media Header with Image Banner */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-900">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        {/* Soft Dark Vignette Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/20" />

        {/* Top Badges (Category + Exclusive Platform Badge) */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-[11px] capitalize border border-white/20">
            {getCategoryIcon()}
            {item.category}
          </span>
          {getPlatformBadge()}
        </div>

        {/* Bottom Banner Title & Subtitle */}
        <div className="absolute bottom-3 inset-x-3 z-10">
          {item.durationOrMeta && (
            <span className="inline-block text-[10px] font-bold text-slate-300 tracking-wider uppercase mb-1">
              {item.durationOrMeta}
            </span>
          )}
          <h4 className="text-base sm:text-lg font-black text-white leading-snug line-clamp-1 drop-shadow-xs">
            {item.title}
          </h4>
          <p className="text-xs text-slate-300 font-medium line-clamp-1">
            {item.subtitle}
          </p>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
        <div className="space-y-3">
          {/* Tagline / Synopsis */}
          <p className="text-xs text-slate-600 font-normal leading-relaxed">
            {item.tagline}
          </p>

          {/* Mood Synergy Callout Pill */}
          <div
            className="p-2.5 rounded-2xl border text-xs font-semibold flex items-start gap-2"
            style={{
              backgroundColor: `${themeColor}0C`,
              borderColor: `${themeColor}30`,
              color: '#1E293B',
            }}
          >
            <span className="text-base shrink-0 select-none mt-0.5">{moodEmoji}</span>
            <div className="text-[11px] leading-relaxed">
              <span className="font-black text-slate-800 block mb-0.5">
                Why this fits your mood:
              </span>
              <span className="text-slate-600">{item.moodSynergy}</span>
            </div>
          </div>
        </div>

        {/* Bottom Meta & Action Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
          {item.ratingOrPrice ? (
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span>{item.ratingOrPrice}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Curated Selection</span>
            </div>
          )}

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer ${getActionThemeStyle()}`}
          >
            <span>{getActionLabel()}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
};
