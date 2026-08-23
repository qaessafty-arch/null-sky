import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FriendUser, FriendRequestItem, UserRole } from '../types/chess';
import { 
  searchUsersInDirectory, 
  sendFriendRequest, 
  respondToFriendRequest, 
  listenToFriendRequests, 
  listenToFriendsList, 
  removeFriendRelationship,
  checkUsernameAvailability 
} from '../services/friendService';
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  Swords, 
  Check, 
  X, 
  Search, 
  Copy, 
  AtSign, 
  Shield, 
  Sparkles, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Edit3
} from 'lucide-react';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (friend: FriendUser) => void;
  onChallengeFriend: (friend: FriendUser) => void;
}

type TabType = 'friends' | 'requests' | 'search';

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  onOpenChat,
  onChallengeFriend
}) => {
  const { user, profile, updateProfileDetails } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friendsList, setFriendsList] = useState<FriendUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestItem[]>([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Username Editor state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [usernameAvailability, setUsernameAvailability] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [copiedHandle, setCopiedHandle] = useState(false);

  // Default fallback username if none set
  const currentUsername = profile?.username || (profile?.displayName ? profile.displayName.toLowerCase().replace(/[^a-z0-9_]/g, '_') : 'tactician');

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!isOpen || !profile?.uid) return;

    const unsubFriends = listenToFriendsList(profile.uid, friends => {
      setFriendsList(friends);
    });

    const unsubRequests = listenToFriendRequests(profile.uid, (inc, out) => {
      setIncomingRequests(inc);
      setOutgoingRequests(out);
    });

    return () => {
      if (unsubFriends) unsubFriends();
      if (unsubRequests) unsubRequests();
    };
  }, [isOpen, profile?.uid]);

  // Username validation check
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
    }, 400);

    return () => clearTimeout(timer);
  }, [newUsernameInput, profile?.uid]);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setActionFeedback(null);
    try {
      const results = await searchUsersInDirectory(searchQuery, profile?.uid);
      setSearchResults(results);
      if (results.length === 0) {
        setActionFeedback({ msg: 'No players found matching your query.', type: 'error' });
      }
    } catch {
      setActionFeedback({ msg: 'Failed to search directory.', type: 'error' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (targetUser: FriendUser) => {
    if (!profile) return;
    const res = await sendFriendRequest(
      {
        uid: profile.uid,
        displayName: profile.displayName || 'Tactician',
        username: currentUsername,
        photoURL: profile.photoURL || undefined,
        elo: profile.elo,
        honorRank: profile.honorRank
      },
      targetUser
    );

    setActionFeedback({
      msg: res.message,
      type: res.success ? 'success' : 'error'
    });

    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleAcceptRequest = async (req: FriendRequestItem) => {
    if (!profile) return;
    const success = await respondToFriendRequest(req.id, true, profile.uid, req.fromUserId);
    if (success) {
      setActionFeedback({ msg: `You and ${req.fromUserName} are now friends!`, type: 'success' });
      setIncomingRequests(prev => prev.filter(r => r.id !== req.id));
    }
  };

  const handleDeclineRequest = async (req: FriendRequestItem) => {
    if (!profile) return;
    const success = await respondToFriendRequest(req.id, false, profile.uid, req.fromUserId);
    if (success) {
      setIncomingRequests(prev => prev.filter(r => r.id !== req.id));
    }
  };

  const handleRemoveFriend = async (friend: FriendUser) => {
    if (!profile) return;
    if (window.confirm(`Are you sure you want to remove ${friend.displayName} from your friends list?`)) {
      await removeFriendRelationship(profile.uid, friend.uid);
      setFriendsList(prev => prev.filter(f => f.uid !== friend.uid));
    }
  };

  const handleSaveUsername = async () => {
    if (!newUsernameInput.trim() || !usernameAvailability || !profile) return;
    const clean = newUsernameInput.trim().toLowerCase().replace(/^@/, '');
    await updateProfileDetails({ username: clean });
    setIsEditingUsername(false);
    setNewUsernameInput('');
    setActionFeedback({ msg: `Your unique handle is now @${clean}`, type: 'success' });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleCopyMyHandle = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`@${currentUsername}`);
      setCopiedHandle(true);
      setTimeout(() => setCopiedHandle(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-3 sm:p-4 animate-in fade-in">
      <div className="relative glass-panel rounded-3xl p-5 sm:p-7 max-w-xl w-full border border-[#F5C453]/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#8C2425] via-[#52673A] to-[#F5C453] text-[#F5C453] border border-[#F5C453]/40">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Peshmerga Friends Realm</span>
              </h2>
              <p className="text-xs text-[#DFD0B0]/70">
                Connect, chat, and challenge friends to real-time online matches
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unique Username Display & Editor Card */}
        <div className="mt-4 p-3 rounded-2xl bg-[#161c12] border border-[#F5C453]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#52673A]/30 text-[#F5C453] border border-[#F5C453]/30">
              <AtSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[#DFD0B0]/60 uppercase font-bold tracking-wider">
                Your Unique Handle
              </div>
              <div className="text-sm font-black text-[#F5C453] font-mono flex items-center gap-1.5">
                <span>@{currentUsername}</span>
                <button
                  type="button"
                  onClick={handleCopyMyHandle}
                  className="text-white/50 hover:text-white transition-colors cursor-pointer p-0.5"
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
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#F5C453]" />
              <span>Change Handle</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-44">
                <input
                  type="text"
                  value={newUsernameInput}
                  onChange={e => setNewUsernameInput(e.target.value)}
                  placeholder="new_handle"
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#F5C453]"
                  maxLength={20}
                />
                {usernameChecking && (
                  <span className="absolute right-2 top-1.5 text-[10px] text-white/40 animate-pulse">...</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSaveUsername}
                disabled={!usernameAvailability || usernameChecking}
                className={`p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  usernameAvailability && !usernameChecking
                    ? 'bg-[#52673A] text-white hover:bg-[#52673A]/90'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
                title="Save handle"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingUsername(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs cursor-pointer"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Feedback Alert */}
        {actionFeedback && (
          <div className={`mt-3 p-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in shrink-0 ${
            actionFeedback.type === 'success' 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}>
            {actionFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{actionFeedback.msg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-4 p-1 rounded-2xl bg-[#161c12] border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'friends'
                ? 'bg-[#52673A] text-white shadow-md border border-[#F5C453]/40'
                : 'text-[#DFD0B0]/70 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>My Friends</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white/20 ml-1">
              {friendsList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'requests'
                ? 'bg-[#8C2425] text-white shadow-md border border-[#F5C453]/40'
                : 'text-[#DFD0B0]/70 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Requests</span>
            {incomingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-400 text-black font-black ml-1 animate-pulse">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'search'
                ? 'bg-gradient-to-r from-[#52673A] to-[#8C2425] text-white shadow-md border border-[#F5C453]/40'
                : 'text-[#DFD0B0]/70 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Find Players</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-3 min-h-[220px]">
          {/* TAB 1: FRIENDS LIST */}
          {activeTab === 'friends' && (
            <div>
              {friendsList.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="text-3xl">⚔️</div>
                  <h4 className="text-sm font-bold text-white">No Friends in Your Realm Yet</h4>
                  <p className="text-xs text-[#DFD0B0]/60 max-w-xs mx-auto">
                    Search for other players by their @username handle or invite fellow grandmasters to build your mountain alliance.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('search')}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#52673A] hover:bg-[#52673A]/80 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#F5C453]" />
                    <span>Find Friends</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {friendsList.map(friend => (
                    <div
                      key={friend.uid}
                      className="p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 flex items-center justify-between gap-3 transition-all"
                    >
                      {/* Friend Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          {friend.photoURL ? (
                            <img
                              src={friend.photoURL}
                              alt={friend.displayName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-[#F5C453]"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#161c12] border-2 border-[#F5C453] flex items-center justify-center text-sm font-black text-[#F5C453]">
                              {friend.displayName.charAt(0)}
                            </div>
                          )}
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#161c12]" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-white truncate max-w-[140px]">
                              {friend.displayName}
                            </span>
                            {friend.username && (
                              <span className="text-[10px] font-mono text-[#F5C453]/80">
                                @{friend.username}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#DFD0B0]/70">
                            <span>{friend.rankBadge} {friend.honorRank}</span>
                            <span>•</span>
                            <span className="font-mono text-emerald-400 font-bold">{friend.elo} Elo</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenChat(friend)}
                          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="Open Private Chat"
                        >
                          <MessageSquare className="w-4 h-4 text-blue-400" />
                          <span className="hidden sm:inline">Chat</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onChallengeFriend(friend)}
                          className="p-2 rounded-xl bg-[#8C2425]/80 hover:bg-[#8C2425] text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-[#F5C453]/30"
                          title="Challenge to Online Match"
                        >
                          <Swords className="w-4 h-4 text-[#F5C453]" />
                          <span className="hidden sm:inline">Match</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(friend)}
                          className="p-2 rounded-xl hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remove Friend"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[#DFD0B0]/70 uppercase tracking-wider mb-2">
                  Incoming Requests ({incomingRequests.length})
                </h4>
                {incomingRequests.length === 0 ? (
                  <p className="text-xs text-white/40 italic py-2">No pending incoming requests.</p>
                ) : (
                  <div className="space-y-2">
                    {incomingRequests.map(req => (
                      <div
                        key={req.id}
                        className="p-3 rounded-2xl bg-white/[0.04] border border-[#F5C453]/30 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {req.fromUserAvatar ? (
                            <img
                              src={req.fromUserAvatar}
                              alt={req.fromUserName}
                              className="w-9 h-9 rounded-full object-cover border border-[#F5C453]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#52673A]/40 border border-[#F5C453] flex items-center justify-center font-bold text-xs text-[#F5C453]">
                              {req.fromUserName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-black text-white">
                              {req.fromUserName}
                              {req.fromUsername && <span className="text-[10px] font-mono text-[#F5C453] ml-1">@{req.fromUsername}</span>}
                            </div>
                            <div className="text-[10px] text-[#DFD0B0]/60">
                              {req.fromUserHonorRank} • {req.fromUserElo} Elo
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAcceptRequest(req)}
                            className="px-3 py-1.5 rounded-xl bg-[#52673A] hover:bg-[#52673A]/80 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Accept</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineRequest(req)}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {outgoingRequests.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <h4 className="text-xs font-bold text-[#DFD0B0]/70 uppercase tracking-wider mb-2">
                    Sent Requests ({outgoingRequests.length})
                  </h4>
                  <div className="space-y-2">
                    {outgoingRequests.map(req => (
                      <div
                        key={req.id}
                        className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-white/70"
                      >
                        <span>Sent to {req.toUsername ? `@${req.toUsername}` : 'Player'}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SEARCH & ADD FRIENDS */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by @username or display name..."
                    className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/15 rounded-xl text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#F5C453]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-4 py-2 rounded-xl bg-[#52673A] hover:bg-[#52673A]/80 disabled:opacity-50 text-white font-bold text-xs transition-all cursor-pointer shrink-0"
                >
                  {isSearching ? '...' : 'Search'}
                </button>
              </form>

              {/* Search Results */}
              <div className="space-y-2">
                {searchResults.map(resultUser => {
                  const isAlreadyFriend = friendsList.some(f => f.uid === resultUser.uid);
                  return (
                    <div
                      key={resultUser.uid}
                      className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {resultUser.photoURL ? (
                          <img
                            src={resultUser.photoURL}
                            alt={resultUser.displayName}
                            className="w-9 h-9 rounded-full object-cover border border-[#F5C453]"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#161c12] border border-[#F5C453] flex items-center justify-center font-bold text-xs text-[#F5C453]">
                            {resultUser.displayName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white truncate">
                            {resultUser.displayName}
                            {resultUser.username && (
                              <span className="text-[10px] font-mono text-[#F5C453] ml-1">
                                @{resultUser.username}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#DFD0B0]/60">
                            {resultUser.rankBadge} {resultUser.honorRank} • {resultUser.elo} Elo
                          </div>
                        </div>
                      </div>

                      {isAlreadyFriend ? (
                        <span className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          Already Friends
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendRequest(resultUser)}
                          className="px-3 py-1.5 rounded-xl bg-[#8C2425] hover:bg-[#8C2425]/80 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-[#F5C453]/30"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-[#F5C453]" />
                          <span>Add Friend</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
