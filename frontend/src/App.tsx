import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChessGame } from './components/ChessGame';
import { Lobby } from './components/Lobby';
import { TournamentView } from './components/TournamentView';
import { LeaderboardView } from './components/LeaderboardView';
import { ProfileView } from './components/ProfileView';
import { AnalysisView } from './components/AnalysisView';
import { FriendsView } from './components/FriendsView';
import { SettingsView } from './components/SettingsView';
import { Trophy, Swords, BarChart2, User, Users, Settings, LogOut } from 'lucide-react';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [view, setView] = useState<'lobby' | 'game' | 'tournament' | 'leaderboard' | 'profile' | 'analysis' | 'friends' | 'settings'>('lobby');

  // User session
  const [user, setUser] = useState<any>({
    id: 'user_' + Math.random().toString(36).substring(2, 8),
    username: 'Grandmaster' + Math.floor(100 + Math.random() * 900),
    elo_rating: 1200,
    games_played: 14,
    games_won: 9,
    games_drawn: 2,
    country_code: 'US'
  });

  // Game state
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [myColor, setMyColor] = useState<'white' | 'black' | 'spectator'>('white');
  const [opponent, setOpponent] = useState<any>(null);
  const [timeControl, setTimeControl] = useState('10+0');
  const [analysisPgn, setAnalysisPgn] = useState<string>('');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('tourney-1');

  // Public Lobby Games and Tournaments
  const [availableGames, setAvailableGames] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([
    { id: 'tourney-1', name: 'Spring Grandmaster Swiss', type: 'Swiss', time_control: '5+3', max_players: 32, participant_count: 18, status: 'Registration' },
    { id: 'tourney-2', name: 'Midnight Bullet Arena', type: 'Elimination', time_control: '1+0', max_players: 16, participant_count: 12, status: 'Active' }
  ]);

  // Connect Socket.IO
  useEffect(() => {
    const s = io(window.location.origin, {
      auth: { token: localStorage.getItem('token') || undefined, username: user.username },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    s.on('connect', () => {
      console.log('Connected to Chess Engine Server via Socket.IO');
    });

    s.on('gameCreated', (data) => {
      setActiveGameId(data.gameId);
      setMyColor('white');
    });

    s.on('gameJoined', (data) => {
      setActiveGameId(data.gameId);
      setMyColor(data.color);
      setOpponent(data.opponent);
      setTimeControl(data.timeControl);
      setView('game');
    });

    s.on('gameStarted', (data) => {
      setActiveGameId(data.gameId);
      setTimeControl(data.timeControl);
      const isWhite = data.white?.id === user.id || data.white?.username === user.username;
      setMyColor(isWhite ? 'white' : 'black');
      setOpponent(isWhite ? data.black : data.white);
      setView('game');
    });

    setSocket(s);

    // Fetch initial available games
    fetch('/api/games/available')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAvailableGames(d); })
      .catch(() => {});

    return () => {
      s.disconnect();
    };
  }, [user.username, user.id]);

  const handleQuickMatch = (tc: string) => {
    if (!socket) return;
    socket.emit('quickMatch', { timeControl: tc });
  };

  const handleCreateGame = (settings: any) => {
    if (!socket) return;
    socket.emit('createGame', settings, (res: any) => {
      if (res?.gameId) {
        setActiveGameId(res.gameId);
        setMyColor(settings.colorPreference === 'black' ? 'black' : 'white');
        setView('game');
      }
    });
  };

  const handleJoinGame = (gameCode: string) => {
    if (!socket) return;
    socket.emit('joinGame', { gameCode }, (res: any) => {
      if (res?.success) {
        setActiveGameId(res.gameId);
        setView('game');
      }
    });
  };

  const handleOpenAnalysis = (pgn: string) => {
    setAnalysisPgn(pgn);
    setView('analysis');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* GLOBAL TOP NAVIGATION */}
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            onClick={() => setView('lobby')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-xl shadow-lg">
              ♚
            </div>
            <span className="font-black text-lg tracking-tight text-white">
              Chess<span className="text-emerald-400">Pro</span>
            </span>
          </div>

          <nav className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => setView('lobby')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
                view === 'lobby' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Swords className="w-4 h-4 text-emerald-400" />
              Play
            </button>
            <button
              onClick={() => setView('leaderboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
                view === 'leaderboard' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              Leaderboard
            </button>
            <button
              onClick={() => setView('friends')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
                view === 'friends' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-400" />
              Friends
            </button>
            <button
              onClick={() => setView('settings')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
                view === 'settings' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 text-purple-400" />
              Settings
            </button>
            <button
              onClick={() => setView('profile')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
                view === 'profile' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4 text-sky-400" />
              {user.username}
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="flex-1">
        {view === 'lobby' && (
          <Lobby
            socket={socket}
            onQuickMatch={handleQuickMatch}
            onCreateGame={handleCreateGame}
            onJoinGame={handleJoinGame}
            onSelectTournament={(id) => {
              setSelectedTournamentId(id);
              setView('tournament');
            }}
            availableGames={availableGames}
            tournaments={tournaments}
          />
        )}

        {view === 'game' && activeGameId && (
          <ChessGame
            socket={socket}
            gameId={activeGameId}
            myColor={myColor}
            opponent={opponent}
            currentUser={user}
            timeControl={timeControl}
            onLeaveGame={() => {
              setActiveGameId(null);
              setView('lobby');
            }}
            onOpenAnalysis={handleOpenAnalysis}
          />
        )}

        {view === 'tournament' && (
          <TournamentView
            tournamentId={selectedTournamentId}
            onBack={() => setView('lobby')}
            onJoinTournament={(id) => alert('Registered for tournament!')}
            currentUserId={user.id}
          />
        )}

        {view === 'leaderboard' && (
          <LeaderboardView onBack={() => setView('lobby')} />
        )}

        {view === 'profile' && (
          <ProfileView user={user} onBack={() => setView('lobby')} />
        )}

        {view === 'friends' && (
          <div className="py-6">
            <FriendsView socket={socket} />
          </div>
        )}

        {view === 'settings' && (
          <div className="py-6">
            <SettingsView />
          </div>
        )}

        {view === 'analysis' && (
          <AnalysisView pgn={analysisPgn} onBack={() => setView('lobby')} />
        )}
      </main>
    </div>
  );
}
