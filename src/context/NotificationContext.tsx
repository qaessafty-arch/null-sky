import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../utils/firebase';
import { useAuth } from './AuthContext';
import { Notification, NotificationType } from '../types/chess';
import { soundManager } from '../utils/audio';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, X, Check, Swords, UserPlus, Trophy, Info } from 'lucide-react';

interface ToastOptions {
  id?: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
    color?: 'emerald' | 'amber' | 'red';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    color?: 'emerald' | 'amber' | 'red';
  };
  expiresAt?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  showToast: (options: ToastOptions) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  sendNotification: (userId: string, notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<ToastOptions[]>([]);
  const lastNotificationId = useRef<string | null>(null);
  const initialLoad = useRef(true);

  // Firestore Listener for Notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/notifications`),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.isRead).length);

      // Trigger toasts for new incoming notifications
      if (!initialLoad.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data() as Notification;
            // Only toast if it's new and unread
            if (!data.isRead) {
              handleNewNotification(data);
            }
          }
        });
      }
      initialLoad.current = false;
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/notifications`);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle Tab Title Alerts
  useEffect(() => {
    let interval: any;
    const originalTitle = document.title;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        document.title = originalTitle;
        if (interval) clearInterval(interval);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (interval) clearInterval(interval);
    };
  }, []);

  const triggerTabAlert = useCallback((message: string) => {
    if (!document.hidden) return;
    
    const originalTitle = document.title;
    let showingAlert = false;
    
    const interval = setInterval(() => {
      document.title = showingAlert ? originalTitle : message;
      showingAlert = !showingAlert;
    }, 1500);

    const stopAlert = () => {
      clearInterval(interval);
      document.title = originalTitle;
      window.removeEventListener('focus', stopAlert);
    };

    window.addEventListener('focus', stopAlert);
  }, []);

  const handleNewNotification = useCallback((notif: Notification) => {
    // Play sound based on type
    if (notif.type === 'challenge') {
      soundManager.playNotification();
      triggerTabAlert(`(1) ⚔️ Game Challenge!`);
    } else if (notif.type === 'friend_request') {
      soundManager.playCorrect();
    } else {
      soundManager.playMove();
    }

    // Show floating toast
    showToast({
      id: notif.id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      duration: notif.type === 'challenge' ? 30000 : 6000,
      action: notif.type === 'challenge' ? {
        label: 'Accept',
        color: 'emerald',
        onClick: () => handleChallengeResponse(notif, 'accepted')
      } : undefined,
      secondaryAction: notif.type === 'challenge' ? {
        label: 'Decline',
        color: 'red',
        onClick: () => handleChallengeResponse(notif, 'declined')
      } : undefined,
      expiresAt: notif.actionData?.expiresAt
    });
  }, [triggerTabAlert]);

  const handleChallengeResponse = async (notif: Notification, status: 'accepted' | 'declined') => {
    if (!user) return;
    try {
      const ref = doc(db, `users/${user.uid}/notifications/${notif.id}`);
      await updateDoc(ref, { 
        'actionData.status': status,
        isRead: true 
      });

      if (status === 'accepted' && notif.actionData?.matchId) {
        // Here you would typically navigate to the match
        // For now, we'll emit a custom event or update a global state
        window.dispatchEvent(new CustomEvent('accept-challenge', { 
          detail: { matchId: notif.actionData.matchId } 
        }));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}/notifications/${notif.id}`);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setToasts(prev => {
        const hasExpired = prev.some(t => t.expiresAt && t.expiresAt < now);
        if (hasExpired) {
          return prev.filter(t => !t.expiresAt || t.expiresAt >= now);
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    const id = options.id || Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...options, id }]);

    if (options.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, options.duration || 6000);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      const ref = doc(db, `users/${user.uid}/notifications/${notificationId}`);
      await updateDoc(ref, { isRead: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}/notifications/${notificationId}`);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, `users/${user.uid}/notifications`),
        where('isRead', '==', false)
      );
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => {
        batch.update(d.ref, { isRead: true });
      });
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}/notifications`);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;
    try {
      const ref = doc(db, `users/${user.uid}/notifications/${notificationId}`);
      await deleteDoc(ref);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/notifications/${notificationId}`);
    }
  };

  const sendNotification = async (userId: string, notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    try {
      const coll = collection(db, `users/${userId}/notifications`);
      await addDoc(coll, {
        ...notification,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${userId}/notifications`);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      showToast,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      sendNotification
    }}>
      {children}
      
      {/* Global Toast Container */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem 
              key={toast.id} 
              toast={toast} 
              onClose={() => removeToast(toast.id!)} 
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: ToastOptions; onClose: () => void }> = ({ toast, onClose }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (toast.expiresAt) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((toast.expiresAt! - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          onClose();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [toast.expiresAt, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'challenge': return <Swords className="w-5 h-5 text-amber-400" />;
      case 'friend_request': return <UserPlus className="w-5 h-5 text-emerald-400" />;
      case 'achievement': return <Trophy className="w-5 h-5 text-yellow-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26, mass: 0.8 }}
      className="w-full glass-panel p-4 pointer-events-auto flex flex-col gap-3 group"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#0B0F19] border border-[#1F293D] flex items-center justify-center shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-black text-white uppercase tracking-tight truncate">{toast.title}</h4>
            {timeLeft !== null && (
              <span className="text-[10px] font-mono text-amber-400 font-bold">{timeLeft}s</span>
            )}
          </div>
          <p className="text-xs text-[#94A3B8] leading-relaxed mt-0.5 line-clamp-2">{toast.message}</p>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/5 text-[#94A3B8] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {(toast.action || toast.secondaryAction) && (
        <div className="flex items-center gap-2 mt-1">
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                onClose();
              }}
              className={`flex-1 min-h-[36px] px-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                toast.action.color === 'emerald' ? 'bg-emerald-500 text-black hover:bg-emerald-400' :
                toast.action.color === 'amber' ? 'bg-amber-500 text-black hover:bg-amber-400' :
                'bg-red-500 text-white hover:bg-red-400'
              }`}
            >
              {toast.action.label}
            </button>
          )}
          {toast.secondaryAction && (
            <button
              onClick={() => {
                toast.secondaryAction?.onClick();
                onClose();
              }}
              className="flex-1 min-h-[36px] px-3 rounded-xl bg-[#0B0F19] border border-[#1F293D] text-[11px] font-black text-[#94A3B8] hover:text-white uppercase tracking-widest transition-all"
            >
              {toast.secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
