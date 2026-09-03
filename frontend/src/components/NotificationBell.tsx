// FILE: frontend/src/components/NotificationBell.tsx
import React, { useState, useEffect } from 'react';
import { Bell, Check, Swords, UserPlus, Trophy } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface NotificationItem {
  id: string;
  type: 'challenge' | 'friend_request' | 'game_invite' | 'achievement';
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  socket: Socket | null;
  onAcceptChallenge?: (challengeData: any) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ socket, onAcceptChallenge }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'achievement',
      message: 'Achievement Unlocked: "First Blood" (Win your first rated game)',
      read: false,
      created_at: new Date().toISOString()
    }
  ]);

  useEffect(() => {
    if (!socket) return;

    socket.on('notification', (notif: NotificationItem) => {
      setNotifications(prev => [notif, ...prev]);
    });

    socket.on('challengeReceived', (data: any) => {
      const challengeNotif: NotificationItem = {
        id: 'chal-' + Date.now(),
        type: 'challenge',
        message: `${data.fromUsername} challenged you to a ${data.timeControl} match!`,
        data,
        read: false,
        created_at: new Date().toISOString()
      };
      setNotifications(prev => [challengeNotif, ...prev]);
    });

    return () => {
      socket.off('notification');
      socket.off('challengeReceived');
    };
  }, [socket]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'challenge':
        return <Swords className="w-4 h-4 text-amber-400" />;
      case 'friend_request':
        return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'achievement':
        return <Trophy className="w-4 h-4 text-yellow-400" />;
      default:
        return <Bell className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shadow">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in text-slate-200">
          <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-850">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-medium flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No notifications right now.
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-3 text-xs transition-colors ${
                    n.read ? 'bg-slate-900 text-slate-400' : 'bg-slate-850 text-slate-100 font-medium'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-800 shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1">
                      <p className="leading-snug">{n.message}</p>
                      {n.type === 'challenge' && n.data && onAcceptChallenge && (
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => {
                              onAcceptChallenge(n.data);
                              setIsOpen(false);
                            }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-[11px]"
                          >
                            Accept Match
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
