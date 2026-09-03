// FILE: frontend/src/components/FriendsView.tsx
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Check, X, Shield, Swords, Trash2, Search, Circle } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface FriendsViewProps {
  socket: Socket | null;
  onChallengeFriend?: (friendId: string, timeControl: string) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ socket, onChallengeFriend }) => {
  const [friends, setFriends] = useState<any[]>([
    { id: 'f1', username: 'Magnus_Carlsen', display_name: 'Magnus C.', elo_rating: 2850, is_online: true, country_code: 'NO' },
    { id: 'f2', username: 'Hikaru_Nakamura', display_name: 'Hikaru N.', elo_rating: 2835, is_online: true, country_code: 'US' },
    { id: 'f3', username: 'TacticsMaster', display_name: 'Tactician', elo_rating: 1820, is_online: false, country_code: 'DE' }
  ]);

  const [requests, setRequests] = useState<any[]>([
    { id: 'req-1', from_user_id: 'u-99', username: 'ChessStudent', elo_rating: 1450, message: 'Good game earlier! Let\'s be friends.' }
  ]);

  const [searchUsername, setSearchUsername] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'online' | 'requests'>('all');
  const [selectedTimeControl, setSelectedTimeControl] = useState('10+0');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial friends from API
    fetch('/api/friends', {
      headers: { Authorization: `Bearer ${localStorage.getItem('chess_token')}` }
    })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length > 0) setFriends(d); })
      .catch(() => {});

    fetch('/api/friends/requests', {
      headers: { Authorization: `Bearer ${localStorage.getItem('chess_token')}` }
    })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setRequests(d); })
      .catch(() => {});

    if (!socket) return;

    socket.on('friendOnline', ({ userId }) => {
      setFriends(prev => prev.map(f => f.id === userId ? { ...f, is_online: true } : f));
    });

    socket.on('friendOffline', ({ userId }) => {
      setFriends(prev => prev.map(f => f.id === userId ? { ...f, is_online: false } : f));
    });

    socket.on('friendRequestReceived', (req) => {
      setRequests(prev => [req, ...prev]);
    });

    return () => {
      socket.off('friendOnline');
      socket.off('friendOffline');
      socket.off('friendRequestReceived');
    };
  }, [socket]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;

    try {
      if (socket) {
        socket.emit('sendFriendRequest', { username: searchUsername });
      }
      setStatusMessage(`Friend request sent to ${searchUsername}!`);
      setSearchUsername('');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Failed to send request');
    }
  };

  const handleAcceptRequest = (requestId: string) => {
    if (socket) socket.emit('acceptFriendRequest', { requestId });
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const handleDeclineRequest = (requestId: string) => {
    if (socket) socket.emit('declineFriendRequest', { requestId });
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const handleChallenge = (friend: any) => {
    if (onChallengeFriend) {
      onChallengeFriend(friend.id, selectedTimeControl);
    } else if (socket) {
      socket.emit('challengeFriend', { friendId: friend.id, timeControl: selectedTimeControl });
    }
    setStatusMessage(`Challenged ${friend.display_name || friend.username} (${selectedTimeControl})!`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const filteredFriends = friends.filter(f => {
    if (activeTab === 'online') return f.is_online;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Users className="w-7 h-7 text-amber-500" />
            Social & Friends
          </h2>
          <p className="text-sm text-slate-400 mt-1">Connect, chat, and challenge your chess peers directly.</p>
        </div>

        {/* Add Friend Form */}
        <form onSubmit={handleSendRequest} className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Username to add..."
              value={searchUsername}
              onChange={e => setSearchUsername(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-850 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm rounded-lg transition-colors shadow"
          >
            <UserPlus className="w-4 h-4" />
            Add
          </button>
        </form>
      </div>

      {statusMessage && (
        <div className="mt-4 p-3 bg-amber-950/40 border border-amber-500/40 text-amber-300 text-sm rounded-lg animate-fade-in">
          {statusMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mt-6 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'all' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          All Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('online')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === 'online' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />
          Online ({friends.filter(f => f.is_online).length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors relative ${activeTab === 'requests' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Requests
          {requests.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500 text-slate-950 font-bold rounded-full">
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'requests' ? (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No pending friend requests.</p>
            ) : (
              requests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-4 bg-slate-850 border border-slate-800 rounded-lg">
                  <div>
                    <div className="font-semibold text-slate-200">{req.username}</div>
                    <div className="text-xs text-slate-400">{req.message || 'Wants to be friends with you'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                      title="Accept"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(req.id)}
                      className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
                      title="Decline"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFriends.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No friends to display in this list.</p>
            ) : (
              filteredFriends.map(friend => (
                <div key={friend.id} className="flex items-center justify-between p-4 bg-slate-850 hover:bg-slate-800/80 border border-slate-800 rounded-lg transition-all">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-amber-400 border border-slate-600">
                        {friend.username.substring(0, 2).toUpperCase()}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${friend.is_online ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-100 flex items-center gap-2">
                        {friend.display_name || friend.username}
                        <span className="text-xs font-normal text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {friend.elo_rating}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {friend.is_online ? 'Online • Ready for match' : 'Offline'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={selectedTimeControl}
                      onChange={e => setSelectedTimeControl(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-xs text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none"
                    >
                      <option value="1+0">1+0 Bullet</option>
                      <option value="3+0">3+0 Blitz</option>
                      <option value="5+3">5+3 Blitz</option>
                      <option value="10+0">10+0 Rapid</option>
                    </select>

                    <button
                      onClick={() => handleChallenge(friend)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors shadow"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      Challenge
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
