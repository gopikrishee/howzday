import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, ExternalLink, Copy, Check, X, ArrowRight, Sparkles } from 'lucide-react';
import { firebaseConfig } from '../services/firebase';

interface DomainAuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetrySignIn: () => void;
}

export const DomainAuthorizationModal: React.FC<DomainAuthorizationModalProps> = ({
  isOpen,
  onClose,
  onRetrySignIn,
}) => {
  const [copied, setCopied] = useState(false);
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'gopikrishee.github.io';
  const consoleSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentHostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API is restricted
      const el = document.createElement('textarea');
      el.value = currentHostname;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="domain-auth-title"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="domain-auth-title" className="text-sm font-bold text-slate-800">
                    Authorize Domain for Google Sign-In
                  </h3>
                  <p className="text-[11px] text-amber-900 font-medium">
                    Firebase Error: auth/unauthorized-domain
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4 text-xs text-slate-600 leading-relaxed max-h-[80vh] overflow-y-auto">
              <p>
                Firebase Authentication restricts Google Sign-In to authorized domains to protect your account. Because this app is hosted on{' '}
                <span className="font-semibold text-slate-900 font-mono bg-slate-100 px-1 py-0.5 rounded">
                  {currentHostname}
                </span>
                , Google blocks login until you add it to your Firebase Console authorized domains list.
              </p>

              {/* Hostname Copier */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Domain to Authorize
                  </span>
                  <span className="font-mono text-xs font-semibold text-indigo-700 truncate block">
                    {currentHostname}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium transition-colors shadow-2xs cursor-pointer active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Domain</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Steps */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide block">
                  3-Step Quick Fix (Takes ~30 seconds):
                </span>

                <ol className="space-y-2.5 text-[11px] text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <div className="flex-1">
                      <span>Open your Firebase Project&apos;s Auth Settings:</span>
                      <div className="mt-1">
                        <a
                          href={consoleSettingsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2"
                        >
                          <span>Open Firebase Auth Settings ({firebaseConfig.projectId})</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </li>

                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <div className="flex-1">
                      <span>
                        Under the <strong className="text-slate-800">Authorized domains</strong> section, click{' '}
                        <strong className="text-slate-800">Add domain</strong>.
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      3
                    </span>
                    <div className="flex-1">
                      <span>
                        Paste <strong className="text-slate-900 font-mono">{currentHostname}</strong> and click <strong className="text-slate-800">Add</strong>. Then return here and click &quot;Retry Sign In&quot;.
                      </span>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Local fallback notice */}
              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2 text-indigo-900 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Note:</strong> You can continue logging your mood right now in offline/local draft mode. Your streaks and entries will be safely preserved locally on your device!
                </p>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Use Local Mode for Now
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRetrySignIn();
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <span>Retry Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
