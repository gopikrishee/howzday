import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NudgeNotification } from '../types';
import { BellRing, Check, Clock, Sparkles, X, Heart, ArrowRight } from 'lucide-react';

interface NudgeNotificationModalProps {
  isOpen: boolean;
  nudges: NudgeNotification[];
  onClose: () => void;
  onLogMood: () => void;
  onMarkAllRead: () => void;
  onMarkSingleRead: (nudgeId: string) => void;
}

export const NudgeNotificationModal: React.FC<NudgeNotificationModalProps> = ({
  isOpen,
  nudges,
  onClose,
  onLogMood,
  onMarkAllRead,
  onMarkSingleRead,
}) => {
  if (!isOpen) return null;

  const unreadNudges = nudges.filter((n) => !n.read);
  const readNudges = nudges.filter((n) => n.read);

  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return 'Today';
    } catch {
      return 'Today';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          id="nudge-notifications-modal"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/70 via-rose-50/50 to-indigo-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-xs">
                <BellRing className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Crood Check-in Nudges
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {unreadNudges.length > 0
                    ? `${unreadNudges.length} unread ${unreadNudges.length === 1 ? 'nudge' : 'nudges'} from your circle`
                    : 'All caught up with your circle!'}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="close-nudge-modal-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/80 shadow-2xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {nudges.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No nudges yet today</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                  When your friends in your Crood encourage you to log your mood, their real-time nudges will appear here!
                </p>
              </div>
            ) : (
              <>
                {/* Action CTA if unread */}
                {unreadNudges.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-xs flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                        Friends are thinking of you
                      </p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">
                        Log today&apos;s mood to complete your streak!
                      </p>
                    </div>
                    <button
                      type="button"
                      id="modal-checkin-now-btn"
                      onClick={() => {
                        onClose();
                        onLogMood();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-400 text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 shadow-sm cursor-pointer"
                    >
                      <span>Check In</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                )}

                {/* List of unread nudges */}
                {unreadNudges.map((nudge) => (
                  <div
                    key={nudge.id}
                    className="p-3.5 rounded-2xl bg-amber-50/60 border-2 border-amber-200/90 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 font-bold flex items-center justify-center shrink-0 overflow-hidden border border-amber-300">
                        {nudge.senderPhoto ? (
                          <img
                            src={nudge.senderPhoto}
                            alt={nudge.senderName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          nudge.senderName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-sm font-extrabold text-slate-900 truncate">
                          {nudge.senderName}
                        </h5>
                        <p className="text-xs text-slate-600 font-medium">
                          Nudged you to record your mood today
                        </p>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(nudge.createdAt)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onMarkSingleRead(nudge.id)}
                      title="Mark as read"
                      className="p-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                ))}

                {/* Read past nudges */}
                {readNudges.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      Earlier Today
                    </span>
                    <div className="space-y-2 mt-1.5">
                      {readNudges.map((nudge) => (
                        <div
                          key={nudge.id}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between opacity-75"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 text-xs overflow-hidden">
                              {nudge.senderPhoto ? (
                                <img
                                  src={nudge.senderPhoto}
                                  alt={nudge.senderName}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                nudge.senderName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {nudge.senderName}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                {formatTimeAgo(nudge.createdAt)} • Acknowledged
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                            Seen
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
            {unreadNudges.length > 0 ? (
              <button
                type="button"
                id="mark-all-nudges-read-btn"
                onClick={onMarkAllRead}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 transition-colors cursor-pointer px-2 py-1"
              >
                Mark all as read
              </button>
            ) : (
              <span className="text-xs text-slate-400 font-medium">All caught up</span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
