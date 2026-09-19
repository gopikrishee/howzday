import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StatusReaction } from '../types';
import { Sparkles, Heart, Users } from 'lucide-react';

interface CroodsReactionsCardProps {
  reactions: StatusReaction[];
  onAcknowledgeReactions?: () => void;
  hasTodayEntry: boolean;
}

const getRelativeTime = (dateStr: string): string => {
  try {
    const ms = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return 'Earlier today';
  } catch {
    return 'Today';
  }
};

export const CroodsReactionsCard: React.FC<CroodsReactionsCardProps> = ({
  reactions,
  onAcknowledgeReactions,
  hasTodayEntry,
}) => {
  // Acknowledge all unread reactions when viewed in the Moods tab
  useEffect(() => {
    const hasUnread = reactions.some((r) => !r.read);
    if (hasUnread && onAcknowledgeReactions) {
      // Gentle delay so user sees transition
      const timer = setTimeout(() => {
        onAcknowledgeReactions();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [reactions, onAcknowledgeReactions]);

  if (!hasTodayEntry) return null;

  return (
    <section
      id="croods-status-reactions-card"
      aria-label="Crood Reactions to Your Status"
      className="mb-5 overflow-hidden rounded-3xl bg-white/80 backdrop-blur-md border border-indigo-100/90 shadow-sm p-4 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-xs">
            <Heart className="w-4 h-4 fill-white text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              Croods reacted
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Friends cheering your status today
            </p>
          </div>
        </div>

        {reactions.length > 0 && (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
            {reactions.length} {reactions.length === 1 ? 'cheer' : 'cheers'}
          </span>
        )}
      </div>

      {reactions.length === 0 ? (
        <div className="py-4 px-3 rounded-2xl bg-slate-50/70 border border-slate-200/60 text-center">
          <p className="text-xs font-semibold text-slate-600">
            Waiting for your Croods to cheer your status in Feeds
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">
            When friends react, their names and cheer emojis will appear here!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {reactions.map((reaction, idx) => {
              const initials = (reaction.senderName || 'C')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <motion.div
                  key={reaction.id || `${reaction.senderId}-${reaction.createdAt}`}
                  initial={{ opacity: 0, x: -10, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: idx * 0.05, duration: 0.25 }}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-slate-50/90 to-indigo-50/40 border border-indigo-100/60 shadow-2xs hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Friend Avatar */}
                    <div className="relative shrink-0">
                      {reaction.senderPhoto ? (
                        <img
                          src={reaction.senderPhoto}
                          alt={reaction.senderName}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-2xs"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-2xs">
                          {initials}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 text-sm leading-none filter drop-shadow-xs">
                        {reaction.emoji}
                      </span>
                    </div>

                    {/* Friend Name & Cheer Description */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {reaction.senderName}
                        </span>
                        {!reaction.read && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-indigo-700 block truncate">
                        cheered with {reaction.label} {reaction.emoji}
                      </span>
                    </div>
                  </div>

                  {/* Relative timestamp */}
                  <span className="text-[10px] font-bold text-slate-600 shrink-0 ml-2">
                    {getRelativeTime(reaction.createdAt)}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <div className="pt-1.5 text-center">
            <span className="text-[10px] font-semibold text-slate-600 flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-slate-600" />
              Reactions reset automatically when you log a new mood
            </span>
          </div>
        </div>
      )}
    </section>
  );
};
