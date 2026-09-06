import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, X, Swords, AlertCircle, Info, Sparkles } from 'lucide-react';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'invite' | 'info' | 'warning';
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

interface NotificationToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="toast-container" id="notification-toast-container">
      <AnimatePresence>
        {toasts.map((toast) => {
          const type = toast.type || 'info';
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`toast-card ${type}`}
              role="alert"
            >
              <div className={`toast-icon-badge ${type}`}>
                {type === 'invite' && <Swords className="w-5 h-5 text-[#F5C453]" />}
                {type === 'success' && <Check className="w-5 h-5 text-emerald-400" />}
                {type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
                {type === 'warning' && <Sparkles className="w-5 h-5 text-amber-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-white tracking-wide truncate">
                    {toast.title}
                  </h4>
                  <button
                    type="button"
                    onClick={() => onDismiss(toast.id)}
                    className="text-white/40 hover:text-white/90 p-1 transition-colors"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-white/70 mt-1 line-clamp-2 leading-relaxed">
                  {toast.message}
                </p>

                {(toast.actionLabel || toast.secondaryLabel) && (
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10">
                    {toast.actionLabel && (
                      <button
                        type="button"
                        onClick={() => {
                          toast.onAction?.();
                          onDismiss(toast.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#F5C453] text-[#05070A] text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer"
                      >
                        {toast.actionLabel}
                      </button>
                    )}
                    {toast.secondaryLabel && (
                      <button
                        type="button"
                        onClick={() => {
                          toast.onSecondary?.();
                          onDismiss(toast.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/10 text-white/80 text-xs font-bold hover:bg-white/15 transition-all cursor-pointer"
                      >
                        {toast.secondaryLabel}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
