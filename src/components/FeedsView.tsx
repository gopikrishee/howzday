import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { UserProfile, MoodLevel, NudgeNotification, StatusReaction } from '../types';
import { getMoodConfig } from '../data/moodConfigs';
import { getTodayDateString } from '../services/storageService';
import {
  Activity,
  Flame,
  Users,
  Clock,
  ArrowRight,
  LogIn,
  BellRing,
  Check,
  MessageSquareQuote,
} from 'lucide-react';

interface FeedsViewProps {
  user: User | null;
  friends: UserProfile[];
  sentNudges?: NudgeNotification[];
  onNudgeFriend?: (targetFriend: UserProfile) => Promise<void>;
  onGoToCroods: () => void;
  onSignIn: () => void;
  sentReactions?: StatusReaction[];
  onSendReaction?: (friend: UserProfile, emoji: string, label: string) => Promise<void>;
  hasUserLoggedMoodToday?: boolean;
}

const REACTION_OPTIONS = [
  { emoji: '✋', label: 'High Five' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '🤗', label: 'Hug' },
  { emoji: '💪', label: 'You Got This' },
];

export const FeedsView: React.FC<FeedsViewProps> = ({
  user,
  friends,
  sentNudges = [],
  onNudgeFriend,
  onGoToCroods,
  onSignIn,
  sentReactions = [],
  onSendReaction,
  hasUserLoggedMoodToday = false,
}) => {
  const [nudgedFriends, setNudgedFriends] = useState<Record<string, boolean>>({});
  const [localCheered, setLocalCheered] = useState<Record<string, { emoji: string; label: string }>>({});
  const [floatingAnimation, setFloatingAnimation] = useState<{ id: string; emoji: string } | null>(null);

  const todayStr = getTodayDateString();

  const handleNudge = async (friend: UserProfile) => {
    setNudgedFriends((prev) => ({ ...prev, [friend.userId]: true }));
    if (onNudgeFriend) {
      await onNudgeFriend(friend);
    }
    setTimeout(() => {
      setNudgedFriends((prev) => ({ ...prev, [friend.userId]: false }));
    }, 4000);
  };

  const handleTriggerReaction = async (friend: UserProfile, emoji: string, label: string) => {
    // Show floating particle animation
    setFloatingAnimation({ id: friend.userId, emoji });
    setLocalCheered((prev) => ({ ...prev, [friend.userId]: { emoji, label } }));

    if (onSendReaction) {
      await onSendReaction(friend, emoji, label);
    }

    setTimeout(() => {
      setFloatingAnimation((curr) => (curr?.id === friend.userId ? null : curr));
    }, 1500);
  };

  // If user is not signed in
  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center mb-4 shadow-sm">
          <Activity className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-1.5">
          Friend Mood Feeds
        </h3>
        <p className="text-xs font-medium text-slate-600 max-w-xs mb-5 leading-relaxed">
          Sign in to connect with your circle and see how your friends are feeling today in real time.
        </p>
        <button
          type="button"
          onClick={onSignIn}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In with Google</span>
        </button>
      </div>
    );
  }

  // If user has no friends in their Crood yet
  if (friends.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-300 text-amber-700 flex items-center justify-center mb-4 shadow-sm">
          <Users className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-1.5">
          Your Feed is Quiet
        </h3>
        <p className="text-xs font-medium text-slate-600 max-w-xs mb-5 leading-relaxed">
          You haven&apos;t added any friends to your Crood yet. Search for friends by name or email in the Croods tab to see their daily mood status and stay connected.
        </p>
        <button
          type="button"
          onClick={onGoToCroods}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Users className="w-4 h-4" />
          <span>Go to Croods & Add Friends</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    );
  }

  // Calculate Crood Climate / Pulse
  const loggedFriends = friends.filter((f) => f.latestMood);
  const moodCounts = (['happy', 'relax', 'neutral', 'tired', 'angry', 'sad'] as MoodLevel[]).map((level) => ({
    level,
    config: getMoodConfig(level),
    count: loggedFriends.filter((f) => f.latestMood === level).length,
  })).filter((item) => item.count > 0);

  return (
    <div className="flex-1 flex flex-col pb-6 space-y-4">
      {/* Crood Pulse Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-indigo-50/95 via-white to-amber-50/90 border border-indigo-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900">
              Crood Pulse
            </h4>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {loggedFriends.length} of {friends.length} checked in today
          </span>
        </div>

        {moodCounts.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-3">
            {moodCounts.map(({ level, config, count }) => (
              <span
                key={level}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${config.bgLight} ${config.textColor} ${config.borderColor}`}
              >
                <span>{config.emoji}</span>
                <span>{config.label}</span>
                <span className="opacity-80 font-black">({count})</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Waiting for your Crood members to check in today. Nudge them to log their mood!
          </p>
        )}
      </div>

      {/* Friends Feed Cards */}
      <div className="space-y-3">
        {friends.map((friend) => {
          const moodConfig = friend.latestMood ? getMoodConfig(friend.latestMood) : null;
          const isToday = friend.latestMoodDate === todayStr;
          const isNudged = nudgedFriends[friend.userId] || sentNudges.some((n) => n.receiverId === friend.userId);
          const remoteReaction = sentReactions.find((r) => r.targetUserId === friend.userId);
          const activeCheer = localCheered[friend.userId] || (remoteReaction ? { emoji: remoteReaction.emoji, label: remoteReaction.label } : null);

          return (
            <motion.div
              key={friend.userId}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col space-y-3 relative overflow-hidden"
            >
              {/* Top Row: Friend Profile Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-2xs flex items-center justify-center font-black text-slate-700 text-sm overflow-hidden">
                      {friend.photoURL ? (
                        <img
                          src={friend.photoURL}
                          alt={friend.displayName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        friend.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[10px] font-black px-1.5 rounded-full border-2 border-white shadow-2xs">
                      L{friend.level}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-sm font-extrabold text-slate-900 leading-tight">
                      {friend.displayName}
                    </h5>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-bold text-amber-800">
                        <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                        {friend.currentStreak} day streak
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mood Badge or Pending check-in */}
                {moodConfig ? (
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${moodConfig.bgLight} ${moodConfig.textColor} border ${moodConfig.borderColor} shadow-2xs`}
                  >
                    <span className="text-base">{moodConfig.emoji}</span>
                    <span>{moodConfig.label}</span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-slate-500 italic bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    No status yet
                  </span>
                )}
              </div>

              {/* Middle Row: Date & Mood Status Banner */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {moodConfig ? (
                      isToday ? (
                        <strong className="text-slate-900 font-bold">Checked in today</strong>
                      ) : (
                        <span>Last check-in on {friend.latestMoodDate}</span>
                      )
                    ) : (
                      <span>Waiting for today&apos;s check-in</span>
                    )}
                  </span>
                </div>

                {moodConfig && (
                  <span className="text-xs font-medium text-slate-600">
                    Status: <span className="font-bold text-slate-900">{moodConfig.tagline}</span>
                  </span>
                )}
              </div>

              {/* Last Saved Notes Card */}
              <div
                id={`friend-notes-card-${friend.userId}`}
                className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/90 text-left flex flex-col gap-1.5 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-900">
                    why I am {friend.latestMood || 'feeling this way'}?
                  </span>
                </div>
                <div className="text-xs text-slate-700 leading-relaxed font-medium pl-6">
                  {friend.latestMoodReason && friend.latestMoodReason.trim().length > 0 ? (
                    <p className="whitespace-pre-wrap">{friend.latestMoodReason}</p>
                  ) : (
                    <p className="text-slate-400 italic font-normal">No reflection notes saved yet.</p>
                  )}
                </div>
              </div>

              {/* Bottom Row: Social Cheers & Reactions */}
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
                {/* Floating Emoji Particle on click */}
                <AnimatePresence>
                  {floatingAnimation?.id === friend.userId && (
                    <motion.div
                      initial={{ opacity: 1, y: 0, scale: 1 }}
                      animate={{ opacity: 0, y: -45, scale: 1.5 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="absolute left-20 -top-4 pointer-events-none text-2xl z-20"
                    >
                      {floatingAnimation.emoji}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider mr-1">
                    Cheer:
                  </span>
                  {REACTION_OPTIONS.map((opt) => {
                    const isSelected = activeCheer?.emoji === opt.emoji;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => handleTriggerReaction(friend, opt.emoji, opt.label)}
                        className={`p-1 px-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer border active:scale-95 shadow-2xs ${
                          isSelected
                            ? 'bg-rose-100 border-rose-300 text-rose-950 scale-105 shadow-xs'
                            : 'bg-slate-100 hover:bg-amber-50 hover:scale-105 text-slate-800 border-slate-200/80'
                        }`}
                        title={opt.label}
                      >
                        <span className="text-sm mr-1 leading-none">{opt.emoji}</span>
                        <span className="hidden sm:inline text-[10px]">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-end gap-2">
                  {/* Sent confirmation or current cheer status */}
                  {activeCheer ? (
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200/80 flex items-center gap-1 shadow-2xs">
                      <Check className="w-3.5 h-3.5 stroke-[3] text-rose-600" />
                      <span>Cheered {activeCheer.emoji}</span>
                    </span>
                  ) : null}

                  {/* Nudge button if friend hasn't logged today */}
                  {!isToday && (
                    <button
                      type="button"
                      onClick={() => handleNudge(friend)}
                      disabled={isNudged}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                        isNudged
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>{isNudged ? 'Nudged! 🔔' : 'Nudge'}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
