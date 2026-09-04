import React, { useState } from 'react';
import { FriendUser } from '../../types/chess';
import { UserPlus, Search, Check, AtSign } from 'lucide-react';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => Promise<FriendUser[]>;
  onSendRequest: (target: FriendUser) => Promise<{ success: boolean; message: string }>;
  friendsList: FriendUser[];
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isOpen,
  onClose,
  onSearch,
  onSendRequest,
  friendsList
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FriendUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setFeedback(null);
    try {
      const users = await onSearch(query.trim());
      setResults(users);
      if (users.length === 0) {
        setFeedback({ msg: 'No players found matching that handle or name.', type: 'error' });
      }
    } catch {
      setFeedback({ msg: 'Search failed. Try again.', type: 'error' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async (target: FriendUser) => {
    const res = await onSendRequest(target);
    setFeedback({ msg: res.message, type: res.success ? 'success' : 'error' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="glass-friend-panel rounded-3xl p-6 max-w-lg w-full border border-white/15 space-y-4 animate-in fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#52673A]/40 text-[#F5C453] border border-[#F5C453]/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Add Tactician</h3>
              <p className="text-[11px] text-white/50">Send an alliance friend request</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white text-sm p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by @handle or display name..."
              className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/15 focus:border-[#F5C453] rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="px-4 py-2 rounded-xl bg-[#52673A] hover:bg-[#52673A]/80 disabled:opacity-50 text-white font-bold text-xs transition-all cursor-pointer"
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </form>

        {feedback && (
          <div className={`p-2.5 rounded-xl text-xs ${
            feedback.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}>
            {feedback.msg}
          </div>
        )}

        {/* Results */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {results.map(user => {
            const isFriend = friendsList.some(f => f.uid === user.uid);
            return (
              <div
                key={user.uid}
                className="p-3 rounded-2xl glass-card-subtle flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#52673A]/40 border border-[#F5C453] flex items-center justify-center font-bold text-xs text-[#F5C453]">
                    {user.displayName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white truncate">
                      {user.displayName}
                      {user.username && <span className="text-[10px] text-[#F5C453] ml-1 font-mono">@{user.username}</span>}
                    </div>
                    <div className="text-[10px] text-white/50">{user.elo} Elo</div>
                  </div>
                </div>

                {isFriend ? (
                  <span className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Friends
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAdd(user)}
                    className="px-3 py-1.5 rounded-xl bg-[#8C2425] hover:bg-[#8C2425]/80 text-white text-xs font-bold flex items-center gap-1 shadow-md border border-[#F5C453]/30 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
