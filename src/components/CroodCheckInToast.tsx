import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CroodCheckInNotification } from '../types';
import { Bell, ArrowRight, X, Users } from 'lucide-react';

interface CroodCheckInToastProps {
  notification: CroodCheckInNotification | null;
  onViewInFeeds: () => void;
  onDismiss: () => void;
}

export const CroodCheckInToast: React.FC<CroodCheckInToastProps> = ({
  notification,
  onViewInFeeds,
  onDismiss,
}) => {
  const [timeLeft, setTimeLeft] = useState(8);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (!notification) {
      setTimeLeft(8);
      return;
    }

    setTimeLeft(8);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    const autoDismissTimeout = setTimeout(() => {
      onDismissRef.current();
    }, 8000);

    return () => {
      clearInterval(timer);
      clearTimeout(autoDismissTimeout);
    };
  }, [notification]);

  if (!notification) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="crood-checkin-toast-banner"
        initial={{ opacity: 0, y: -40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-md z-50 pointer-events-auto"
      >
        <div className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md border border-amber-300 shadow-2xl p-4 flex flex-col gap-3">
          {/* Top colored accent line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

          <div className="flex items-start gap-3">
            {/* Notification Avatar / Icon */}
            <div className="relative shrink-0 mt-0.5">
              {notification.senderPhoto ? (
                <img
                  src={notification.senderPhoto}
                  alt={notification.senderName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-300 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white font-black text-sm shadow-sm">
                  {notification.senderName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                <Bell className="w-2.5 h-2.5 text-white" />
              </div>
            </div>

            {/* Notification content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  <Users className="w-3 h-3" />
                  Crood Update
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Just now</span>
              </div>

              <h4 className="text-sm font-black text-slate-900 mt-0.5 leading-snug">
                {notification.message}
              </h4>
              <p className="text-xs text-slate-700 font-medium truncate mt-0.5">
                <span className="font-bold text-slate-900">{notification.senderName}</span> updated their mood today.
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              id="crood-checkin-toast-dismiss"
              onClick={onDismiss}
              className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">
              Closing in {timeLeft}s
            </span>

            <button
              type="button"
              id="crood-checkin-toast-view-btn"
              onClick={onViewInFeeds}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <span>View in Feeds</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
