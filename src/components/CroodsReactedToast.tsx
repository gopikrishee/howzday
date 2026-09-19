import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StatusReaction } from '../types';
import { Sparkles, Heart, Clock, X } from 'lucide-react';

interface CroodsReactedToastProps {
  unreadReactions: StatusReaction[];
  isVisible: boolean;
  onDismiss: () => void;
}

export const CroodsReactedToast: React.FC<CroodsReactedToastProps> = ({
  unreadReactions,
  isVisible,
  onDismiss,
}) => {
  const [timeLeft, setTimeLeft] = useState(10);
  const showToast = isVisible && unreadReactions.length > 0;
  const latest = unreadReactions[0];

  useEffect(() => {
    if (!showToast) {
      setTimeLeft(10);
      return;
    }

    setTimeLeft(10);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showToast, latest?.id, onDismiss]);

  if (!showToast || !latest) return null;

  const count = unreadReactions.length;
  const summaryText =
    count === 1
      ? `${latest.senderName} reacted with ${latest.emoji} ${latest.label}`
      : `${latest.senderName} and ${count - 1} other ${count - 1 === 1 ? 'crood' : 'croods'} reacted`;

  return (
    <AnimatePresence>
      <motion.div
        id="croods-reacted-notification-toast"
        initial={{ opacity: 0, y: -25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -25, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 pointer-events-auto select-none"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 p-[1.5px] shadow-2xl">
          <div className="relative flex items-center justify-between gap-3 bg-white/95 backdrop-blur-md px-3.5 py-3 rounded-[15px]">
            {/* Animated avatar / emoji icon */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-100 to-amber-100 border border-rose-200 flex items-center justify-center text-xl shadow-2xs">
                {latest.emoji || '❤️'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-[9px] shadow-xs">
                <Sparkles className="w-2.5 h-2.5 text-amber-950 fill-current" />
              </span>
            </div>

            {/* Notification content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                  Croods Reacted
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  <Clock className="w-2.5 h-2.5 text-rose-500" />
                  {timeLeft}s
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 truncate mt-0.5 leading-tight">
                {summaryText}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Showing in Moods • resets automatically
              </p>
            </div>

            {/* Dismiss button */}
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Close notification"
              className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 10-second Vanishing Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-100/60">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${(timeLeft / 10) * 100}%` }}
              transition={{ ease: 'linear', duration: 1 }}
              className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
