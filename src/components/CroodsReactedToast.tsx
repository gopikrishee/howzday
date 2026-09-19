import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StatusReaction } from '../types';
import { Sparkles, ArrowRight, Heart, Clock, X } from 'lucide-react';

interface CroodsReactedToastProps {
  unreadReactions: StatusReaction[];
  onViewInMoods: () => void;
  onDismiss: () => void;
  isVisible: boolean;
}

export const CroodsReactedToast: React.FC<CroodsReactedToastProps> = ({
  unreadReactions,
  onViewInMoods,
  onDismiss,
  isVisible,
}) => {
  const [timeLeft, setTimeLeft] = useState(10);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  const reactionIdsKey = unreadReactions.map((r) => r.id).join(',');

  useEffect(() => {
    if (!reactionIdsKey || !isVisible) {
      setTimeLeft(10);
      return;
    }

    setTimeLeft(10);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const autoDismissTimeout = setTimeout(() => {
      onDismissRef.current();
    }, 10000);

    return () => {
      clearInterval(timer);
      clearTimeout(autoDismissTimeout);
    };
  }, [reactionIdsKey, isVisible]);

  if (!isVisible || unreadReactions.length === 0) return null;

  const latest = unreadReactions[0];
  const count = unreadReactions.length;
  const summaryText =
    count === 1
      ? `${latest.senderName} cheered with ${latest.emoji} ${latest.label}`
      : `${latest.senderName} and ${count - 1} other ${count - 1 === 1 ? 'crood' : 'croods'} reacted`;

  return (
    <AnimatePresence>
      <motion.div
        id="croods-reacted-notification-toast"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-50 pointer-events-auto"
      >
        <div
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 p-[1.5px] shadow-xl hover:shadow-2xl transition-all select-none"
        >
          {/* Shimmer sweep effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

          <div className="relative flex items-center justify-between gap-2.5 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-[15px]">
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
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                    croods reacted
                  </span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                </div>
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200/80">
                  <Clock className="w-2.5 h-2.5 text-rose-500" />
                  {timeLeft}s
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 truncate mt-0.5 leading-tight">
                {summaryText}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={onViewInMoods}
                  className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors shadow-2xs cursor-pointer active:scale-95"
                >
                  <span>View</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onDismiss}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0 self-start -mr-1"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 10-second Vanishing Progress Bar along the bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / 10) * 100}%` }}
                transition={{ ease: 'linear', duration: 1 }}
                className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

