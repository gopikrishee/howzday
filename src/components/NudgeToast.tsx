import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NudgeNotification } from '../types';
import { BellRing, Sparkles, X, ArrowRight } from 'lucide-react';

interface NudgeToastProps {
  nudge: NudgeNotification | null;
  onDismiss: () => void;
  onLogMood: () => void;
}

export const NudgeToast: React.FC<NudgeToastProps> = ({
  nudge,
  onDismiss,
  onLogMood,
}) => {
  return (
    <AnimatePresence>
      {nudge && (
        <motion.div
          id="nudge-realtime-toast"
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 pointer-events-auto"
        >
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-xl border border-indigo-500/30 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm relative">
              <BellRing className="w-5 h-5 stroke-[2.5] animate-bounce" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Friendly Nudge
                </span>
              </div>
              <p className="text-sm font-bold text-white mt-0.5 leading-snug">
                <span className="text-amber-200">{nudge.senderName}</span> nudged you to check in your mood today!
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  type="button"
                  id="toast-log-mood-btn"
                  onClick={onLogMood}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <span>Log Mood</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  id="toast-dismiss-btn"
                  onClick={onDismiss}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>

            <button
              type="button"
              id="toast-close-icon-btn"
              onClick={onDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
