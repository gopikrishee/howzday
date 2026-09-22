import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, X, Smartphone, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'banner' | 'button';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      {isInstallable && (
        <button
          type="button"
          onClick={handleInstall}
          disabled={isInstalling}
          id="pwa-install-app-btn"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 shrink-0 select-none ${className}`}
          title="Install HowZDay as an App"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
        </button>
      )}

      {isIOS && !isInstallable && (
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          id="pwa-install-ios-btn"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-amber-300 text-xs font-bold border border-amber-400/40 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0 select-none ${className}`}
          title="Install HowZDay on iPhone/iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install on iOS</span>
        </button>
      )}

      {/* iOS Safari Installation Modal Sheet */}
      <AnimatePresence>
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-slate-200 text-slate-900 relative"
            >
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md">
                  <Smartphone className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 leading-tight">Install HowZDay</h3>
                  <p className="text-xs text-slate-500 font-medium">Add to your iPhone / iPad Home Screen</p>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <p className="leading-snug">
                    Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-indigo-600 mx-0.5" /> at the bottom or top of Safari.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <p className="leading-snug">
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <p className="leading-snug">
                    Tap <strong>Add</strong> in the top-right corner to enjoy the full app experience!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-extrabold hover:bg-slate-800 transition-colors shadow-sm"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
