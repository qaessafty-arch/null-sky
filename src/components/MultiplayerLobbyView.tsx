import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PanelContainer } from './PanelContainer';
import { 
  AppSettings, 
  TimeControl, 
  PieceColor, 
  OnlineMatchPlayer,
  OnlineMatchSession 
} from '../types/chess';
import { TIME_CONTROLS } from '../utils/chessEngine';
import { useAuth } from '../context/AuthContext';
import { 
  createOnlineMatch, 
  joinOnlineMatch,
  joinWorldwideMatchmaking,
  listenToOnlineMatchSession,
  listenToPublicOpenMatches,
  generateGameRoomCode
} from '../services/onlineMatchService';
import { 
  listenToTournaments,
  createTournament,
  joinTournament,
  startMatch
} from '../services/tournamentService';
import { soundManager } from '../utils/audio';
import { getLocalPlayerUid } from '../utils/identity';
import { 
  Swords, 
  Globe, 
  Plus, 
  Users, 
  Clock, 
  Shield, 
  Crown, 
  Zap, 
  Copy, 
  Check, 
  Play, 
  ArrowRight, 
  Sparkles, 
  RefreshCw,
  Search,
  Trophy
} from 'lucide-react';
import { Tournament, TournamentPlayer } from '../types/chess';
import { ModernWaitingRoom } from './multiplayer/ModernWaitingRoom';
import { ModernGameCreationModal } from './multiplayer/ModernGameCreationModal';

interface MultiplayerLobbyViewProps {
  settings: AppSettings;
  onStartMatch: (matchId: string) => void;
  onOpenWorldwideModal?: () => void;
}

export const MultiplayerLobbyView: React.FC<MultiplayerLobbyViewProps> = ({
  settings,
  onStartMatch,
  onOpenWorldwideModal
}) => {
  const { profile, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'quick' | 'create' | 'join' | 'open_challenges' | 'tournaments'>('quick');

  // Quick matchmaking
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState(0);
  const [searchStatus, setSearchStatus] = useState('');
  const cancelSearchRef = useRef<(() => void) | null>(null);
  const pairWithBotRef = useRef<(() => void) | null>(null);
  const guestUidRef = useRef(getLocalPlayerUid());
  const [selectedQuickTime, setSelectedQuickTime] = useState<TimeControl>(TIME_CONTROLS[5]); // Rapid 10m

  // Create Room state
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>(TIME_CONTROLS[5]);
  const [selectedSide, setSelectedSide] = useState<'w' | 'b' | 'random'>('random');
  const [isCreating, setIsCreating] = useState(false);
  const [createdMatchId, setCreatedMatchId] = useState<string | null>(null);
  const [pregeneratedCode, setPregeneratedCode] = useState<string>(() => generateGameRoomCode());
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);

  // Join Room state
  const [joinMatchId, setJoinMatchId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Auto-transition host into match when opponent joins with the code
  useEffect(() => {
    if (!createdMatchId) return;
    const unsub = listenToOnlineMatchSession(createdMatchId, session => {
      if (
        session &&
        (session.status === 'in_progress' ||
          (session.guestId && session.guestId !== buildLocalPlayer().uid))
      ) {
        soundManager.playVictory();
        onStartMatch(createdMatchId);
      }
    });
    return () => {
      if (unsub) unsub();
    };
  }, [createdMatchId]);

  // Open Public Matches from Firestore
  const [openMatches, setOpenMatches] = useState<OnlineMatchSession[]>([]);

  // Tournaments
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentMaxPlayers, setTournamentMaxPlayers] = useState<number>(4);
  const [expandedTournamentId, setExpandedTournamentId] = useState<string | null>(null);

  // Search countdown interval
  useEffect(() => {
    let interval: any;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchTimer(prev => prev + 1);
      }, 1000);
    } else {
      setSearchTimer(0);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  // Cancel any pending matchmaking search when leaving the lobby
  useEffect(() => {
    return () => {
      cancelSearchRef.current?.();
      cancelSearchRef.current = null;
    };
  }, []);

  const buildLocalPlayer = useCallback((): OnlineMatchPlayer => {
    const uid = profile?.uid || user?.uid || guestUidRef.current;
    const player: OnlineMatchPlayer = {
      uid,
      displayName: profile?.displayName || user?.displayName || 'Peshmerga Warrior',
      username: profile?.username || 'peshmerga',
      elo: Number(profile?.elo) || 1200,
      respectPoints: Number(profile?.respectPoints) || 100,
      honorRank: profile?.honorRank || 'Peshmerga Tactician',
      rankBadge: profile?.rankBadge || '🌿',
      country: profile?.country || 'Kurdistan',
      flag: profile?.flag || '☀️',
      avatar:
        profile?.photoURL ||
        user?.photoURL ||
        `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(uid)}&backgroundColor=0B0F19`
    };
    const photoURL = profile?.photoURL || user?.photoURL;
    if (photoURL) player.photoURL = photoURL;
    return player;
  }, [profile, user]);

  // Take the host into the arena as soon as a challenger joins the room
  useEffect(() => {
    if (!createdMatchId) return;
    const unsub = listenToOnlineMatchSession(createdMatchId, session => {
      if (session?.status === 'in_progress') {
        soundManager.playVictory();
        onStartMatch(createdMatchId);
      }
    });
    return () => unsub();
  }, [createdMatchId, onStartMatch]);

  // Listen to open public challenges
  useEffect(() => {
    const unsub = listenToPublicOpenMatches(matches => {
      setOpenMatches(matches);
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Listen to tournaments
  useEffect(() => {
    const unsub = listenToTournaments(data => {
      setTournaments(data);
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Quick Match Finder Logic — Firestore live queue, engine challenger as fallback
  const handleQuickMatch = async (tc: TimeControl) => {
    if (isSearching) return;
    setIsSearching(true);
    setSearchStatus('Scanning the live queue for opponents…');
    soundManager.playCapture();

    try {
      const { cancel, pairWithBotNow } = await joinWorldwideMatchmaking(
        buildLocalPlayer(),
        tc,
        matchId => {
          cancelSearchRef.current = null;
          pairWithBotRef.current = null;
          setIsSearching(false);
          setSearchStatus('');
          soundManager.playVictory();
          onStartMatch(matchId);
        },
        setSearchStatus,
        'human_first',
        20
      );
      cancelSearchRef.current = cancel;
      pairWithBotRef.current = pairWithBotNow;
    } catch (e) {
      console.error('Quick match error:', e);
      setIsSearching(false);
      setSearchStatus('');
    }
  };

  const handleCancelQuickMatch = () => {
    cancelSearchRef.current?.();
    cancelSearchRef.current = null;
    pairWithBotRef.current = null;
    setIsSearching(false);
    setSearchStatus('');
  };

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      const code = (pregeneratedCode || generateGameRoomCode()).trim().toUpperCase();
      const matchId = await createOnlineMatch(buildLocalPlayer(), selectedTimeControl, selectedSide, code);
      setCreatedMatchId(matchId);
      setIsCreating(false);
      soundManager.playCapture();
    } catch (e) {
      console.error('Create room error:', e);
      setIsCreating(false);
    }
  };

  const handleModalCreateGame = async (config: {
    timeControl: TimeControl;
    isRated: boolean;
    colorPreference: 'w' | 'b' | 'random';
    roomCode: string;
  }) => {
    const matchId = await createOnlineMatch(
      buildLocalPlayer(),
      config.timeControl,
      config.colorPreference,
      config.roomCode
    );
    setCreatedMatchId(matchId);
    setSelectedTimeControl(config.timeControl);
    setSelectedSide(config.colorPreference);
    return matchId;
  };

  const handleJoinRoom = async () => {
    const cleanId = joinMatchId.trim().toUpperCase();
    if (!cleanId) {
      setJoinError('Please enter a valid 6-character match room code.');
      return;
    }

    setIsJoining(true);
    setJoinError(null);
    try {
      await joinOnlineMatch(cleanId, buildLocalPlayer());
      setIsJoining(false);
      soundManager.playVictory();
      onStartMatch(cleanId);
    } catch (e: any) {
      console.error('Join room error:', e);
      setJoinError(e?.message || 'Match not found or already completed.');
      setIsJoining(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdMatchId) return;
    navigator.clipboard.writeText(createdMatchId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateTournament = async () => {
    if (!tournamentName.trim()) return;
    try {
      const local = buildLocalPlayer();
      const p: TournamentPlayer = {
        uid: local.uid,
        displayName: local.displayName,
        elo: local.elo,
        avatar: local.avatar,
        rankBadge: local.rankBadge
      };
      await createTournament(tournamentName, p, tournamentMaxPlayers, selectedTimeControl);
      setShowCreateTournament(false);
      setTournamentName('');
      soundManager.playCapture();
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinTournament = async (tId: string) => {
    try {
      const local = buildLocalPlayer();
      const p: TournamentPlayer = {
        uid: local.uid,
        displayName: local.displayName,
        elo: local.elo,
        avatar: local.avatar,
        rankBadge: local.rankBadge
      };
      await joinTournament(tId, p);
      soundManager.playCapture();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Error joining tournament');
    }
  };

  const handleStartTournamentMatch = async (tId: string, matchId: string, tc: TimeControl) => {
    try {
      const sessionId = await startMatch(tId, matchId, tc);
      onStartMatch(sessionId);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <PanelContainer>
      {/* Hero Header */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-[#F5C453]/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8C2425] via-[#52673A] to-[#F5C453] p-0.5 shadow-lg shadow-[#F5C453]/25 flex-shrink-0">
            <div className="w-full h-full bg-[#161c12] rounded-[14px] flex items-center justify-center text-[#F5C453]">
              <Swords className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight">
                Multiplayer Arena & Worldwide PvP
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#8C2425] text-white border border-[#F5C453]/40 uppercase tracking-wider">
                Live Multiplayer
              </span>
            </div>
            <p className="text-xs text-[#DFD0B0]/75">
              Battle live against chess players worldwide, challenge friends by room code, or join public arena matches.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-[#161c12] p-1.5 rounded-2xl border border-white/10 flex-wrap">
          <button
            onClick={() => setActiveTab('quick')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'quick'
                ? 'bg-[#52673A] text-white shadow-md border border-[#F5C453]/50'
                : 'text-[#DFD0B0]/70 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#F5C453]" />
            <span>Quick Match</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-[#52673A] text-white shadow-md border border-[#F5C453]/50'
                : 'text-[#DFD0B0]/70 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-[#F5C453]" />
            <span>Create Room</span>
          </button>

          <button
            onClick={() => setActiveTab('join')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'join'
                ? 'bg-[#52673A] text-white shadow-md border border-[#F5C453]/50'
                : 'text-[#DFD0B0]/70 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#F5C453]" />
            <span>Join Code</span>
          </button>

          <button
            onClick={() => setActiveTab('open_challenges')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'open_challenges'
                ? 'bg-[#52673A] text-white shadow-md border border-[#F5C453]/50'
                : 'text-[#DFD0B0]/70 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-[#F5C453]" />
            <span>Open Arena ({openMatches.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tournaments'
                ? 'bg-[#52673A] text-white shadow-md border border-[#F5C453]/50'
                : 'text-[#DFD0B0]/70 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#F5C453]" />
            <span>Tournaments</span>
          </button>
        </div>
      </div>

      {/* User Stats Ribbon */}
      <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#52673A] border border-[#F5C453] flex items-center justify-center font-black text-white text-xs">
            {profile?.displayName?.charAt(0) || '👑'}
          </div>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span>{profile?.displayName || user?.displayName || 'Peshmerga Tactician'}</span>
              {profile?.honorRank && (
                <span className="text-[10px] font-mono text-[#F5C453]">
                  ({profile.rankBadge ? `${profile.rankBadge} ` : ''}{profile.honorRank})
                </span>
              )}
            </div>
            <div className="text-[10px] text-[#DFD0B0]/60">
              Live Battle Rating: <strong className="text-white font-mono">{profile?.elo || 1200} Elo</strong> • Respect: <strong className="text-[#F5C453] font-mono">{profile?.respectPoints || 100} pts</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenWorldwideModal && (
            <button
              onClick={onOpenWorldwideModal}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#DFD0B0] text-xs font-bold flex items-center gap-1.5 border border-white/10 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#F5C453]" />
              <span>Worldwide Roster</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: QUICK MATCHMAKING */}
      {activeTab === 'quick' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Quick Match Time Controls */}
          <div className="lg:col-span-8 space-y-4">
            <div className="glass-panel p-5 rounded-3xl border border-[#F5C453]/30 shadow-xl space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#F5C453]" />
                <span>Select Time Control & Queue Instantly</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TIME_CONTROLS.map(tc => {
                  const isSelected = selectedQuickTime.id === tc.id;
                  return (
                    <button
                      key={tc.id}
                      disabled={isSearching}
                      onClick={() => setSelectedQuickTime(tc)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#52673A]/50 border-[#F5C453] shadow-lg shadow-[#F5C453]/15'
                          : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-black/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-white font-mono">{tc.name}</span>
                        <span className="text-[10px] uppercase font-bold text-[#F5C453]">{tc.category}</span>
                      </div>
                      <div className="text-[10px] text-[#DFD0B0]/60">
                        {tc.initialSeconds / 60} min {tc.incrementSeconds > 0 ? `+ ${tc.incrementSeconds}s` : ''}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Start Searching Button or Active Searching Spinner */}
              {!isSearching ? (
                <button
                  onClick={() => handleQuickMatch(selectedQuickTime)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#8C2425] via-[#52673A] to-[#F5C453] hover:brightness-110 text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-[#F5C453]/20 border border-[#F5C453]/50 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <Swords className="w-5 h-5" />
                  <span>Start Instant Multiplayer Match ({selectedQuickTime.name})</span>
                </button>
              ) : (
                <div className="p-6 rounded-2xl bg-black/80 border-2 border-[#F5C453] text-center space-y-3">
                  <div className="w-12 h-12 rounded-full border-4 border-[#F5C453] border-t-transparent animate-spin mx-auto" />
                  <h4 className="text-base font-black text-white">Searching for Worthy Opponent...</h4>
                  <p className="text-xs text-white/80">{searchStatus}</p>
                  <p className="text-xs text-[#DFD0B0]/70 font-mono">
                    {selectedQuickTime.name} • {searchTimer}s elapsed
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={handleCancelQuickMatch}
                      className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                    >
                      Cancel Queue
                    </button>
                    <button
                      onClick={() => pairWithBotRef.current?.()}
                      className="px-4 py-1.5 rounded-xl bg-[#52673A]/70 hover:bg-[#52673A] border border-[#F5C453]/40 text-[#F5C453] text-xs font-bold cursor-pointer"
                    >
                      Play Bot Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Tips & Rules */}
          <div className="lg:col-span-4 space-y-4">
            <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-[#DFD0B0]/70 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#F5C453]" />
                <span>Multiplayer Honor Code</span>
              </h4>
              <ul className="text-xs text-[#DFD0B0]/80 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[#F5C453] font-bold">•</span>
                  <span><strong>Live Clock Countdown:</strong> Clocks tick in real-time. Moving adds configured increments.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F5C453] font-bold">•</span>
                  <span><strong>Respect Points:</strong> Victories award +30 Respect Points and +20 ELO points.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F5C453] font-bold">•</span>
                  <span><strong>Instant Sparring:</strong> If no human player is instantly available in the queue, our Grandmaster bot matches with you immediately.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CREATE CUSTOM ROOM */}
      {activeTab === 'create' && (
        <div className="glass-panel p-6 rounded-3xl border border-[#F5C453]/30 shadow-xl max-w-2xl mx-auto space-y-5">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <Plus className="w-6 h-6 text-[#F5C453]" />
            <div>
              <h3 className="text-base font-black text-white">Create Custom Multiplayer Challenge</h3>
              <p className="text-xs text-[#DFD0B0]/70">
                Configure time, piece color, and share the room code with your friend.
              </p>
            </div>
          </div>

          {!createdMatchId ? (
            <div className="space-y-4">
              {/* Unique 6-character Game Code Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-black/90 via-[#182214] to-black/90 border border-[#F5C453]/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#F5C453] tracking-widest block">
                    Assigned 6-Character Game Code
                  </span>
                  <span className="font-mono text-2xl sm:text-3xl font-black text-white tracking-[0.25em]">
                    {pregeneratedCode}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(pregeneratedCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#F5C453]" />}
                    <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPregeneratedCode(generateGameRoomCode())}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
                    title="Generate different 6-character code"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#DFD0B0]">Time Control</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIME_CONTROLS.map(tc => (
                    <button
                      key={tc.id}
                      type="button"
                      onClick={() => setSelectedTimeControl(tc)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        selectedTimeControl.id === tc.id
                          ? 'bg-[#52673A] text-white border-[#F5C453] font-bold'
                          : 'bg-black/40 text-white/70 border-white/10 hover:bg-black/60'
                      }`}
                    >
                      <div className="font-mono">{tc.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#DFD0B0]">Choose Your Side</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSide('w')}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedSide === 'w'
                        ? 'bg-[#52673A] text-white border-[#F5C453]'
                        : 'bg-black/40 text-white/70 border-white/10'
                    }`}
                  >
                    ⚪ White
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSide('b')}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedSide === 'b'
                        ? 'bg-[#52673A] text-white border-[#F5C453]'
                        : 'bg-black/40 text-white/70 border-white/10'
                    }`}
                  >
                    ⚫ Black
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSide('random')}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedSide === 'random'
                        ? 'bg-[#52673A] text-white border-[#F5C453]'
                        : 'bg-black/40 text-white/70 border-white/10'
                    }`}
                  >
                    🎲 Random
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#52673A] via-[#8C2425] to-[#F5C453] hover:brightness-110 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#F5C453]/20 border border-[#F5C453]/50 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreating ? 'Creating Room...' : `Create Game (${pregeneratedCode})`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreationModal(true)}
                  className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/20 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Custom Game Creator</span>
                </button>
              </div>
            </div>
          ) : (
            <ModernWaitingRoom
              gameCode={createdMatchId}
              timeControlName={selectedTimeControl.name}
              isRated={true}
              playerSide={selectedSide}
              onCancel={() => {
                setCreatedMatchId(null);
                setPregeneratedCode(generateGameRoomCode());
              }}
              onEnterBoard={() => onStartMatch(createdMatchId)}
            />
          )}
        </div>
      )}

      {/* TAB 3: JOIN ROOM BY CODE */}
      {activeTab === 'join' && (
        <div className="glass-panel p-6 rounded-3xl border border-[#F5C453]/30 shadow-xl max-w-md mx-auto space-y-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <Users className="w-6 h-6 text-[#F5C453]" />
            <div>
              <h3 className="text-base font-black text-white">Join Game with Code</h3>
              <p className="text-xs text-[#DFD0B0]/70">
                Enter the unique 6-character game code generated by Player 1.
              </p>
            </div>
          </div>

          {joinError && (
            <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-bold">
              {joinError}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#DFD0B0]">6-Character Game Code</label>
            <input
              type="text"
              value={joinMatchId}
              onChange={e => setJoinMatchId(e.target.value.toUpperCase())}
              maxLength={12}
              placeholder="e.g. K9X2P7"
              className="w-full px-4 py-3.5 rounded-2xl bg-black/70 border-2 border-[#F5C453]/40 text-white font-mono text-center text-xl font-black tracking-[0.25em] focus:border-[#F5C453] focus:outline-none transition-all placeholder:text-white/20"
            />
          </div>

          <button
            onClick={handleJoinRoom}
            disabled={isJoining || !joinMatchId.trim()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8C2425] via-[#52673A] to-[#F5C453] hover:brightness-110 disabled:opacity-40 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#F5C453]/20 border border-[#F5C453]/50 transition-all cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>{isJoining ? 'Connecting to Room...' : 'Join & Start Playing'}</span>
          </button>
        </div>
      )}

      {/* TAB 4: OPEN PUBLIC ARENA CHALLENGES */}
      {activeTab === 'open_challenges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#F5C453]" />
              <span>Public Live Open Challenges ({openMatches.length})</span>
            </h3>
          </div>

          {openMatches.length === 0 ? (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-3">
              <Swords className="w-10 h-10 text-[#F5C453]/40 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Public Waiting Matches</h4>
              <p className="text-xs text-[#DFD0B0]/60 max-w-sm mx-auto">
                No players are currently waiting in the open lobby. Create a new challenge or use Quick Match!
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 rounded-xl bg-[#52673A] hover:bg-[#52673A]/90 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5 text-[#F5C453]" />
                <span>Create Public Match</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {openMatches.map(m => (
                <div
                  key={m.id}
                  className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-[#F5C453]/50 transition-all flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">{m.whitePlayer?.displayName || 'Host Player'}</span>
                      <span className="text-[10px] font-mono text-[#F5C453]">{m.whitePlayer?.elo || 1200} Elo</span>
                    </div>
                    <div className="text-[11px] text-[#DFD0B0]/70 font-mono mt-0.5">
                      {m.timeControl?.name || 'Rapid'} • Open Waiting
                    </div>
                  </div>

                  <button
                    onClick={() => onStartMatch(m.id)}
                    className="px-3 py-1.5 rounded-xl bg-[#52673A] hover:bg-[#52673A]/90 text-white font-black text-xs flex items-center gap-1 cursor-pointer border border-[#F5C453]/40 shadow-md"
                  >
                    <span>Accept</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* TAB 5: TOURNAMENTS */}
      {activeTab === 'tournaments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#F5C453]" />
                <span>Tournament Bracket Arena</span>
              </h3>
              <p className="text-xs text-[#DFD0B0]/70 mt-1">Join or create knockout tournaments.</p>
            </div>
            
            <button
              onClick={() => setShowCreateTournament(!showCreateTournament)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8C2425] to-[#52673A] text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md border border-[#F5C453]/40"
            >
              <Plus className="w-4 h-4" />
              <span>Host Tournament</span>
            </button>
          </div>

          {showCreateTournament && (
            <div className="glass-panel p-5 rounded-2xl border border-[#F5C453]/40 space-y-4 animate-in slide-in-from-top-4">
              <h4 className="text-sm font-bold text-white">Create New Tournament</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#DFD0B0]">Tournament Name</label>
                  <input
                    type="text"
                    value={tournamentName}
                    onChange={e => setTournamentName(e.target.value)}
                    placeholder="e.g. Weekly Masters"
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs font-bold focus:border-[#F5C453] focus:outline-none"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#DFD0B0]">Max Players</label>
                  <select 
                    value={tournamentMaxPlayers} 
                    onChange={e => setTournamentMaxPlayers(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs font-bold focus:border-[#F5C453] focus:outline-none"
                  >
                    <option value={4}>4 Players</option>
                    <option value={8}>8 Players</option>
                    <option value={16}>16 Players</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#DFD0B0]">Time Control</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TIME_CONTROLS.map(tc => (
                    <button
                      key={tc.id}
                      onClick={() => setSelectedTimeControl(tc)}
                      className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        selectedTimeControl.id === tc.id
                          ? 'bg-[#52673A] text-white border-[#F5C453] font-bold'
                          : 'bg-black/40 text-white/70 border-white/10'
                      }`}
                    >
                      {tc.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCreateTournament}
                  disabled={!tournamentName.trim()}
                  className="px-6 py-2.5 rounded-xl bg-[#52673A] text-white font-bold text-xs shadow-md border border-[#F5C453]/40 cursor-pointer disabled:opacity-50"
                >
                  Create Bracket
                </button>
              </div>
            </div>
          )}

          {tournaments.length === 0 ? (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-3">
              <Trophy className="w-10 h-10 text-[#F5C453]/40 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Active Tournaments</h4>
              <p className="text-xs text-[#DFD0B0]/60 max-w-sm mx-auto">
                There are no open tournaments right now. Be the first to host one!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.map(t => {
                const isJoined = t.players.some(p => p.uid === user?.uid);
                
                return (
                  <div key={t.id} className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-[#F5C453]/30 transition-all flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white">{t.name}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md uppercase font-bold border ${
                            t.status === 'registration' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                            t.status === 'in_progress' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                            'bg-slate-500/20 text-slate-300 border-slate-500/30'
                          }`}>
                            {t.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-[#DFD0B0]/70 mt-1 flex items-center gap-3">
                          <span>Host: <strong>{t.creatorName}</strong></span>
                          <span>•</span>
                          <span>{t.timeControl.name}</span>
                          <span>•</span>
                          <span>{t.players.length}/{t.maxPlayers} Players</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        {t.status === 'registration' && !isJoined && (
                          <button
                            onClick={() => handleJoinTournament(t.id)}
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#52673A] to-[#3a4a29] text-white font-bold text-xs border border-[#F5C453]/30 cursor-pointer whitespace-nowrap shadow-md"
                          >
                            Join Tournament
                          </button>
                        )}
                        
                        {t.status !== 'registration' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedTournamentId(expandedTournamentId === t.id ? null : t.id)}
                              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#DFD0B0] font-bold text-xs border border-white/10 cursor-pointer whitespace-nowrap"
                            >
                              {expandedTournamentId === t.id ? 'Hide Bracket' : 'View Bracket'}
                            </button>
                            
                            {t.matches.some(m => m.status === 'ready' && (m.player1?.uid === user?.uid || m.player2?.uid === user?.uid)) && (
                              <button
                                onClick={() => {
                                  const myMatch = t.matches.find(m => m.status === 'ready' && (m.player1?.uid === user?.uid || m.player2?.uid === user?.uid));
                                  if (myMatch) {
                                    if (myMatch.matchSessionId) {
                                      onStartMatch(myMatch.matchSessionId);
                                    } else {
                                      handleStartTournamentMatch(t.id, myMatch.id, t.timeControl);
                                    }
                                  }
                                }}
                                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs border border-emerald-400/50 cursor-pointer whitespace-nowrap shadow-md shadow-emerald-900/40"
                              >
                                Enter Match
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Bracket View */}
                    {expandedTournamentId === t.id && (
                      <div className="mt-2 p-4 sm:p-6 rounded-2xl bg-[#0b0e09] border border-white/5 overflow-x-auto">
                      <div className="flex items-start gap-8 min-w-max">
                        {Array.from({ length: Math.log2(t.maxPlayers) }).map((_, roundIndex) => {
                          const roundMatches = t.matches.filter(m => m.round === roundIndex + 1);
                          return (
                            <div key={`round-${roundIndex}`} className="flex flex-col gap-4">
                              <h5 className="text-[10px] font-black text-[#F5C453] uppercase tracking-widest text-center mb-2">
                                {roundIndex + 1 === Math.log2(t.maxPlayers) ? 'Finals' : `Round ${roundIndex + 1}`}
                              </h5>
                              {roundMatches.map(m => (
                                <div key={m.id} className={`w-48 p-2.5 rounded-xl border flex flex-col gap-1.5 ${m.status === 'completed' ? 'bg-black/80 border-white/10' : m.status === 'in_progress' ? 'bg-[#52673A]/20 border-emerald-500/30' : 'bg-black/40 border-white/5'}`}>
                                  <div className={`flex items-center justify-between text-xs px-2 py-1.5 rounded-lg ${m.winnerId === m.player1?.uid ? 'bg-[#52673A]/60 font-black text-white' : 'bg-white/5 text-[#DFD0B0]'}`}>
                                    <span className="truncate">{m.player1?.displayName || 'TBD'}</span>
                                    {m.winnerId === m.player1?.uid && <Check className="w-3 h-3 text-[#F5C453]" />}
                                  </div>
                                  <div className={`flex items-center justify-between text-xs px-2 py-1.5 rounded-lg ${m.winnerId === m.player2?.uid ? 'bg-[#52673A]/60 font-black text-white' : 'bg-white/5 text-[#DFD0B0]'}`}>
                                    <span className="truncate">{m.player2?.displayName || 'TBD'}</span>
                                    {m.winnerId === m.player2?.uid && <Check className="w-3 h-3 text-[#F5C453]" />}
                                  </div>
                                  {m.status === 'in_progress' && (
                                    <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider text-center mt-1">Live Match</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* Advanced Custom Game Creation Modal */}
      <ModernGameCreationModal
        isOpen={showCreationModal}
        onClose={() => setShowCreationModal(false)}
        onCreateGame={handleModalCreateGame}
        onStartMatch={onStartMatch}
      />
    </PanelContainer>
  );
};
