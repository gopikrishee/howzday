import React, { useEffect, useState } from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

interface OfflineIndicatorProps {
  isQuotaExceeded?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isQuotaExceeded = false }) => {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline ? (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 pointer-events-none"
        >
          <div className="bg-slate-900/95 backdrop-blur-md text-amber-300 border border-amber-500/30 px-3.5 py-2 rounded-2xl shadow-xl flex items-center justify-center gap-2 text-xs font-bold select-none">
            <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Offline Mode &bull; Cached mood data active</span>
          </div>
        </motion.div>
      ) : isQuotaExceeded ? (
        <motion.div
          key="quota"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 pointer-events-none"
        >
          <div className="bg-amber-950/95 backdrop-blur-md text-amber-200 border border-amber-500/40 px-3.5 py-2 rounded-2xl shadow-xl flex items-center justify-center gap-2 text-xs font-medium select-none text-center">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Firestore daily quota reached &bull; Serving from local cache</span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
