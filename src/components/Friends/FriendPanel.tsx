import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { FriendUser, FriendRequestItem, TimeControl } from '../../types/chess';
import { 
  searchUsersInDirectory, 
  sendFriendRequest, 
  respondToFriendRequest, 
  listenToFriendRequests, 
  listenToFriendsList, 
  removeFriendRelationship,
  blockUser,
  checkUsernameAvailability 
} from '../../services/friendService';
import { SearchBar } from './SearchBar';
import { FriendList } from './FriendList';
import { FriendDetails } from './FriendDetails';
import { FriendRequests } from './FriendRequests';
import { FriendChat } from './FriendChat';
import { AddFriendModal } from './AddFriendModal';
import { RemoveFriendModal } from './RemoveFriendModal';
import { GameInvite } from './GameInvite';
import { FriendActivity } from './FriendActivity';
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  Swords, 
  X, 
  Clock, 
  AtSign, 
  Edit3, 
  Check, 
  Copy, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import '../../styles/friends-panel.css';
import '../../styles/friends-animations.css';

interface FriendPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat?: (friend: FriendUser) => void;
  onChallengeFriend?: (friend: FriendUser) => void;
}

type TabType = 'all' | 'online' | 'offline' | 'requests' | 'blocked';

export const FriendPanel: React.FC<FriendPanelProps> = ({
  isOpen,
  onClose,
  onOpenChat,
  onChallengeFriend
}) => {
  const { profile, updateProfileDetails } = useAuth();
  const { sendNotification } = useNotification();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [friendsList, setFriendsList] = useState<FriendUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestItem[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Friend & Sub-modals
  const [selectedFriend, setSelectedFriend] = useState<FriendUser | null>(null);
  const [activeChatFriend, setActiveChatFriend] = useState<FriendUser | null>(null);
  const [friendToRemove, setFriendToRemove] = useState<FriendUser | null>(null);
  const [friendToChallenge, setFriendToChallenge] = useState<FriendUser | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSort, setFilterSort] = useState<'status' | 'name' | 'elo' | 'recent'>('status');

  // Username Editor state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [usernameAvailability, setUsernameAvailability] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const currentUsername = profile?.username || (profile?.displayName ? profile.displayName.toLowerCase().replace(/[^a-z0-9_]/g, '_') : 'tactician');

  // Real-time Firestore subscriptions
  useEffect(() => {
    if (!isOpen || !profile?.uid) return;
    setIsLoading(true);

    const unsubFriends = listenToFriendsList(profile.uid, friends => {
      setFriendsList(friends);
      setIsLoading(false);
      // Auto-select first friend if none selected
      if (!selectedFriend && friends.length > 0) {
        setSelectedFriend(friends[0]);
      }
    });

    const unsubRequests = listenToFriendRequests(profile.uid, (inc, out) => {
      setIncomingRequests(inc);
      setOutgoingRequests(out);
    });

    // Blocked users local fallback
    const localBlocked = JSON.parse(localStorage.getItem('chess_blocked_users') || '[]');
    setBlockedUsers(localBlocked);

    return () => {
      if (unsubFriends) unsubFriends();
      if (unsubRequests) unsubRequests();
    };
  }, [isOpen, profile?.uid]);

  // Username live validation
  useEffect(() => {
    if (!newUsernameInput.trim()) {
      setUsernameAvailability(null);
      return;
    }
    const clean = newUsernameInput.trim().toLowerCase().replace(/^@/, '');
    if (clean.length < 3) {
      setUsernameAvailability(false);
      return;
    }

    setUsernameChecking(true);
    const timer = setTimeout(async () => {
      const available = await checkUsernameAvailability(clean, profile?.uid);
      setUsernameAvailability(available);
      setUsernameChecking(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [newUsernameInput, profile?.uid]);

  // Filtered and Sorted Friends
  const filteredFriends = useMemo(() => {
    return friendsList
      .filter(f => {
        // Tab filtering
        if (activeTab === 'online' && !f.isOnline) return false;
        if (activeTab === 'offline' && f.isOnline) return false;
        if (activeTab === 'blocked') return blockedUsers.includes(f.uid);

        // Search query filtering
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().replace(/^@/, '');
          const matchName = f.displayName?.toLowerCase().includes(q);
          const matchUser = f.username?.toLowerCase().includes(q);
          return matchName || matchUser;
        }
        return true;
      })
      .sort((a, b) => {
        if (filterSort === 'elo') return (b.elo || 0) - (a.elo || 0);
        if (filterSort === 'name') return (a.displayName || '').localeCompare(b.displayName || '');
        if (filterSort === 'status') {
          if (a.isOnline === b.isOnline) return (b.elo || 0) - (a.elo || 0);
          return a.isOnline ? -1 : 1;
        }
        return 0;
      });
  }, [friendsList, activeTab, searchQuery, filterSort, blockedUsers]);

  const onlineCount = useMemo(() => friendsList.filter(f => f.isOnline).length, [friendsList]);

  if (!isOpen) return null;

  const handleSaveUsername = async () => {
    if (!newUsernameInput.trim() || !usernameAvailability || !profile) return;
    const clean = newUsernameInput.trim().toLowerCase().replace(/^@/, '');
    await updateProfileDetails({ username: clean });
    setIsEditingUsername(false);
    setNewUsernameInput('');
    setFeedback({ msg: `Your unique handle is now @${clean}`, type: 'success' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCopyHandle = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`@${currentUsername}`);
      setCopiedHandle(true);
      setTimeout(() => setCopiedHandle(false), 2000);
    }
  };

  const handleAcceptRequest = async (req: FriendRequestItem) => {
    if (!profile) return;
    const success = await respondToFriendRequest(req.id, true, profile.uid, req.fromUserId);
    if (success) {
      setFeedback({ msg: `You and ${req.fromUserName} are now allies!`, type: 'success' });
      setIncomingRequests(prev => prev.filter(r => r.id !== req.id));
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleDeclineRequest = async (req: FriendRequestItem) => {
    if (!profile) return;
    const success = await respondToFriendRequest(req.id, false, profile.uid, req.fromUserId);
    if (success) {
      setIncomingRequests(prev => prev.filter(r => r.id !== req.id));
    }
  };

  const handleRemoveFriendConfirm = async (friend: FriendUser) => {
    if (!profile) return;
    await removeFriendRelationship(profile.uid, friend.uid);
    setFriendsList(prev => prev.filter(f => f.uid !== friend.uid));
    if (selectedFriend?.uid === friend.uid) {
      setSelectedFriend(null);
    }
    setFeedback({ msg: `${friend.displayName} was removed.`, type: 'success' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleBlockUser = async (friend: FriendUser) => {
    if (!profile) return;
    await blockUser(profile.uid, friend.uid, friend.displayName);
    const updated = [...blockedUsers, friend.uid];
    setBlockedUsers(updated);
    localStorage.setItem('chess_blocked_users', JSON.stringify(updated));
    setFriendsList(prev => prev.filter(f => f.uid !== friend.uid));
    setSelectedFriend(null);
    setFeedback({ msg: `${friend.displayName} has been blocked.`, type: 'success' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSendChallenge = (friend: FriendUser, tc: TimeControl) => {
    if (!profile) return;
    sendNotification(friend.uid, {
      userId: friend.uid,
      type: 'challenge',
      title: 'Game Challenge!',
      message: `${profile.displayName || 'Grandmaster'} has challenged you to a ${tc.name} match!`,
      actionData: {
        challengerId: profile.uid,
        challengerName: profile.displayName || 'Tactician',
        challengerAvatar: profile.photoURL,
        timeControlName: tc.name,
        timeControlSeconds: tc.initialSeconds,
        status: 'pending',
        expiresAt: Date.now() + 30000
      }
    });

    if (onChallengeFriend) {
      onChallengeFriend(friend);
    } else {
      setActiveChatFriend(friend);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="relative glass-friend-panel rounded-3xl p-5 sm:p-7 max-w-5xl w-full border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0B0F19] border border-[#F5C453] flex items-center justify-center text-[#F5C453] shadow-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight uppercase">
                  Social Alliance
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#F5C453]/20 text-[#F5C453] font-mono text-xs font-bold">
                  {friendsList.length}
                </span>
              </div>
              <p className="text-[10px] font-black text-[#DFD0B0]/60 uppercase tracking-widest">
                Real-Time Mountain Guild & Challenges
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#52673A] to-[#8C2425] hover:brightness-110 text-white text-xs font-black shadow-lg border border-[#F5C453]/40 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#F5C453]" />
              <span>Add Tactician</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Unique Handle Card */}
        <div className="mt-3 p-3 rounded-2xl bg-black/40 border border-[#F5C453]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#52673A]/40 text-[#F5C453] border border-[#F5C453]/30">
              <AtSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[#DFD0B0]/60 uppercase font-bold tracking-wider">
                Your Alliance Handle
              </span>
              <div className="text-sm font-black text-[#F5C453] font-mono flex items-center gap-1.5">
                <span>@{currentUsername}</span>
                <button
                  type="button"
                  onClick={handleCopyHandle}
                  className="text-white/40 hover:text-white transition-colors cursor-pointer"
                  title="Copy Handle"
                >
                  {copiedHandle ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {!isEditingUsername ? (
            <button
              type="button"
              onClick={() => {
                setNewUsernameInput(currentUsername);
                setIsEditingUsername(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#F5C453]" />
              <span>Edit Handle</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <input
                  type="text"
                  value={newUsernameInput}
                  onChange={e => setNewUsernameInput(e.target.value)}
                  placeholder="new_handle"
                  className="bg-black/60 border border-white/20 rounded-xl px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#F5C453]"
                  maxLength={20}
                />
                {usernameChecking && (
                  <span className="absolute right-2 top-1 text-[10px] text-white/40">...</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSaveUsername}
                disabled={!usernameAvailability || usernameChecking}
                className={`p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  usernameAvailability && !usernameChecking
                    ? 'bg-[#52673A] text-white'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingUsername(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 shrink-0 ${
            feedback.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}>
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all' ? 'glass-pill-tab active' : 'glass-pill-tab'
            }`}
          >
            All Allies ({friendsList.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('online')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'online' ? 'glass-pill-tab active' : 'glass-pill-tab'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 status-dot-pulse-online" />
            <span>Online ({onlineCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('offline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'offline' ? 'glass-pill-tab active' : 'glass-pill-tab'
            }`}
          >
            Offline ({friendsList.length - onlineCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'requests' ? 'glass-pill-tab active' : 'glass-pill-tab'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Requests</span>
            {incomingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[10px] font-black animate-pulse">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('blocked')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'blocked' ? 'glass-pill-tab active' : 'glass-pill-tab'
            }`}
          >
            Blocked ({blockedUsers.length})
          </button>
        </div>

        {/* Main Content Body */}
        <div className="mt-3 flex-1 overflow-hidden">
          {activeTab === 'requests' ? (
            <FriendRequests
              incomingRequests={incomingRequests}
              outgoingRequests={outgoingRequests}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
              {/* Left Column: List & Filters */}
              <div className="lg:col-span-6 flex flex-col space-y-3 h-full overflow-hidden">
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  filterSort={filterSort}
                  onFilterSortChange={setFilterSort}
                />

                <div className="flex-1 overflow-y-auto pr-1">
                  <FriendList
                    friends={filteredFriends}
                    selectedFriend={selectedFriend}
                    isLoading={isLoading}
                    onSelectFriend={setSelectedFriend}
                    onChallengeFriend={f => setFriendToChallenge(f)}
                    onChatFriend={f => {
                      if (onOpenChat) onOpenChat(f);
                      else setActiveChatFriend(f);
                    }}
                    onRemoveFriend={f => setFriendToRemove(f)}
                    onFindFriends={() => setIsAddModalOpen(true)}
                  />
                </div>
              </div>

              {/* Right Column: Selected Friend Details / Live Chat */}
              <div className="lg:col-span-6 flex flex-col h-full overflow-hidden">
                {activeChatFriend ? (
                  <FriendChat
                    friend={activeChatFriend}
                    onClose={() => setActiveChatFriend(null)}
                    onChallenge={f => setFriendToChallenge(f)}
                  />
                ) : (
                  <div className="space-y-4 h-full flex flex-col justify-between">
                    <FriendDetails
                      friend={selectedFriend}
                      onChallenge={f => setFriendToChallenge(f)}
                      onChat={f => {
                        if (onOpenChat) onOpenChat(f);
                        else setActiveChatFriend(f);
                      }}
                      onRemove={f => setFriendToRemove(f)}
                      onBlock={handleBlockUser}
                    />
                    {selectedFriend && (
                      <FriendActivity friendName={selectedFriend.displayName} />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sub-modals */}
        <AddFriendModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSearch={q => searchUsersInDirectory(q, profile?.uid)}
          onSendRequest={target =>
            sendFriendRequest(
              {
                uid: profile?.uid || '',
                displayName: profile?.displayName || 'Tactician',
                username: currentUsername,
                photoURL: profile?.photoURL || undefined,
                elo: profile?.elo,
                honorRank: profile?.honorRank
              },
              target
            )
          }
          friendsList={friendsList}
        />

        <RemoveFriendModal
          isOpen={!!friendToRemove}
          friend={friendToRemove}
          onClose={() => setFriendToRemove(null)}
          onConfirm={handleRemoveFriendConfirm}
        />

        <GameInvite
          isOpen={!!friendToChallenge}
          friend={friendToChallenge}
          onClose={() => setFriendToChallenge(null)}
          onSendChallenge={handleSendChallenge}
        />
      </motion.div>
    </div>
  );
};
