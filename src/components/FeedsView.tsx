import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';
import { UserProfile, MoodLevel } from '../types';
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
  onGoToCroods: () => void;
  onSignIn: () => void;
}

export const FeedsView: React.FC<FeedsViewProps> = ({
  user,
  friends,
  onGoToCroods,
  onSignIn,
}) => {
  const [nudgedFriends, setNudgedFriends] = useState<Record<string, boolean>>({});
  const [reactionsSent, setReactionsSent] = useState<Record<string, string>>({});

  const todayStr = getTodayDateString();

  const handleNudge = (friendId: string) => {
    setNudgedFriends((prev) => ({ ...prev, [friendId]: true }));
    setTimeout(() => {
      setNudgedFriends((prev) => ({ ...prev, [friendId]: false }));
    }, 4000);
  };

  const handleReaction = (friendId: string, reactionEmoji: string) => {
    setReactionsSent((prev) => ({ ...prev, [friendId]: reactionEmoji }));
    setTimeout(() => {
      setReactionsSent((prev) => {
        const next = { ...prev };
        delete next[friendId];
        return next;
      });
    }, 3000);
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
          You haven&apos;t added any friends to your Crood yet. Search for friends by name or email in the Croods tab to see their daily mood status alone.
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
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Crood Mood Climate
            </h3>
          </div>
          <span className="text-xs font-extrabold text-indigo-900 bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-300">
            {friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}
          </span>
        </div>

        <p className="text-xs font-medium text-slate-700 mb-3 leading-relaxed">
          {loggedFriends.length === 0 ? (
            <span>No one in your Crood has checked in yet today. Be the first to cheer them on!</span>
          ) : (
            <span>
              {moodCounts.map((m) => (
                <span key={m.level} className="mr-1.5">
                  <strong className="font-bold" style={{ color: m.config.primaryColor }}>
                    {m.count} {m.config.label} {m.config.emoji}
                  </strong>
                </span>
              ))}
              in your circle today.
            </span>
          )}
        </p>

        {/* Climate Visual Indicator */}
        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex border border-slate-200">
          {loggedFriends.length > 0 ? (
            <>
              {moodCounts.map((m) => (
                <div
                  key={m.level}
                  style={{
                    width: `${(m.count / loggedFriends.length) * 100}%`,
                    backgroundColor: m.config.primaryColor,
                  }}
                  className="h-full transition-all"
                  title={`${m.count} ${m.config.label}`}
                />
              ))}
            </>
          ) : (
            <div className="w-full bg-slate-200 h-full" />
          )}
        </div>
      </div>

      {/* Friends Feed Header */}
      <div className="flex items-center justify-between px-1">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-indigo-600" />
          <span>Friends&apos; Mood Status</span>
        </h4>
        <span className="text-[11px] font-semibold text-slate-500">Shared reflections &amp; moods</span>
      </div>

      {/* Friends Cards Feed */}
      <div className="space-y-3">
        {friends.map((friend) => {
          const moodConfig = friend.latestMood ? getMoodConfig(friend.latestMood) : null;
          const isToday = friend.latestMoodDate === todayStr;
          const isNudged = nudgedFriends[friend.userId];
          const activeReaction = reactionsSent[friend.userId];

          return (
            <motion.div
              key={friend.userId}
              id={`friend-feed-card-${friend.userId}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col space-y-3"
            >
              {/* Top Row: Avatar, Name, Level & Streak */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black flex items-center justify-center text-base shadow-xs overflow-hidden border-2 border-white">
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

              {/* Last Saved Notes Card - Above Cheer Section */}
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
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                    Cheer:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleReaction(friend.userId, '✋ High Five')}
                    className="p-1 px-2.5 rounded-xl bg-slate-100 hover:bg-amber-100 hover:scale-105 active:scale-95 text-slate-800 font-bold text-xs transition-all cursor-pointer border border-slate-200/80"
                    title="Send High Five"
                  >
                    ✋
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReaction(friend.userId, '❤️ Love')}
                    className="p-1 px-2.5 rounded-xl bg-slate-100 hover:bg-rose-100 hover:scale-105 active:scale-95 text-slate-800 font-bold text-xs transition-all cursor-pointer border border-slate-200/80"
                    title="Send Love"
                  >
                    ❤️
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReaction(friend.userId, '🤗 Hug')}
                    className="p-1 px-2.5 rounded-xl bg-slate-100 hover:bg-indigo-100 hover:scale-105 active:scale-95 text-slate-800 font-bold text-xs transition-all cursor-pointer border border-slate-200/80"
                    title="Send Hug"
                  >
                    🤗
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReaction(friend.userId, '💪 You Got This')}
                    className="p-1 px-2.5 rounded-xl bg-slate-100 hover:bg-emerald-100 hover:scale-105 active:scale-95 text-slate-800 font-bold text-xs transition-all cursor-pointer border border-slate-200/80"
                    title="You got this"
                  >
                    💪
                  </button>
                </div>

                {/* Feedback or Nudge button */}
                {activeReaction ? (
                  <span className="text-xs font-black text-emerald-700 flex items-center gap-1 animate-bounce">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Sent!</span>
                  </span>
                ) : !isToday ? (
                  <button
                    type="button"
                    onClick={() => handleNudge(friend.userId)}
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
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
