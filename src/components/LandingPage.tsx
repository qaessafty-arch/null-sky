import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Swords, 
  Zap, 
  Users, 
  Trophy, 
  Sparkles, 
  Globe, 
  ShieldCheck, 
  ArrowRight, 
  Play, 
  Activity, 
  Cpu, 
  Flame, 
  Star, 
  ChevronRight,
  Clock,
  Radio,
  Eye
} from 'lucide-react';
import { GameMode } from '../types/chess';
import { KurdishFlag } from './KurdishFlag';

interface LandingPageProps {
  onStartPlay: (mode?: GameMode) => void;
  onOpenMultiplayer: () => void;
  onOpenLeaderboard: () => void;
  onOpenPuzzles: () => void;
  onOpenTournaments: () => void;
  onOpenLogin: () => void;
}

interface LiveGameTickerItem {
  id: string;
  white: { name: string; elo: number; flag: string };
  black: { name: string; elo: number; flag: string };
  timeControl: string;
  evalScore: string;
  currentMove: string;
  moveCount: number;
  spectators: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartPlay,
  onOpenMultiplayer,
  onOpenLeaderboard,
  onOpenPuzzles,
  onOpenTournaments,
  onOpenLogin
}) => {
  const [activeGamesCount, setActiveGamesCount] = useState(14820);
  const [gamesPlayedToday, setGamesPlayedToday] = useState(1248920);
  const [latencyMs, setLatencyMs] = useState(18);

  // Live simulation ticker for games in progress
  const [liveGames, setLiveGames] = useState<LiveGameTickerItem[]>([
    {
      id: 'g-1',
      white: { name: 'GM Magnus K.', elo: 2842, flag: '🇳🇴' },
      black: { name: 'GM Hikaru N.', elo: 2820, flag: '🇺🇸' },
      timeControl: '3+0 Blitz',
      evalScore: '+0.4',
      currentMove: '32. Qxe4',
      moveCount: 32,
      spectators: 3410
    },
    {
      id: 'g-2',
      white: { name: 'PeshmergaKnight', elo: 2410, flag: '☀️' },
      black: { name: 'ArbilTactician', elo: 2395, flag: '☀️' },
      timeControl: '10+0 Rapid',
      evalScore: '-1.1',
      currentMove: '24... Nd5',
      moveCount: 24,
      spectators: 890
    },
    {
      id: 'g-3',
      white: { name: 'IM Elena_V', elo: 2490, flag: '🇪🇸' },
      black: { name: 'GM Alireza_F', elo: 2785, flag: '🇫🇷' },
      timeControl: '5+3 Blitz',
      evalScore: '+0.0',
      currentMove: '18. Rfc1',
      moveCount: 18,
      spectators: 1820
    }
  ]);

  // Minor live simulation tick
  useEffect(() => {
    const timer = setInterval(() => {
      setGamesPlayedToday(prev => prev + Math.floor(Math.random() * 3) + 1);
      setActiveGamesCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));
      setLatencyMs(prev => Math.max(12, Math.min(35, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Grandmaster Testimonials
  const testimonials = [
    {
      quote: "The move latency is astonishingly low. It feels like moving physical pieces on an elite mahogany tournament table.",
      author: "Grandmaster D. Petrosyan",
      title: "Super GM & FIDE 2750+",
      avatar: "👑"
    },
    {
      quote: "The Respect Honor system and Kurdish Peshmerga cultural aesthetics bring something truly unique and soulful to digital chess.",
      author: "WGM Soran Hewleri",
      title: "Kurdistan National Champion",
      avatar: "☀️"
    },
    {
      quote: "From deep Stockfish vision analysis to instantaneous WebSocket synchronization, Chesskys PRO is state of the art.",
      author: "Master Liam Thorne",
      title: "Author & Lead Tactical Coach",
      avatar: "⚔️"
    }
  ];

  return (
    <div className="w-full min-h-screen relative overflow-hidden bg-[var(--app-bg)] text-white select-none">
      
      {/* 1. Full-Screen 3D Animated Chessboard Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
        <div 
          className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[1400px] h-[1400px] rounded-3xl"
          style={{
            transform: 'perspective(1200px) rotateX(62deg) rotateZ(-24deg) translateY(-100px)',
            backgroundImage: `
              linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%),
              linear-gradient(-45deg, rgba(255,255,255,0.06) 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.06) 75%),
              linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.06) 75%)
            `,
            backgroundSize: '120px 120px',
            backgroundPosition: '0 0, 0 60px, 60px -60px, -60px 0px'
          }}
        />
        {/* Glow ambient spots */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[var(--primary-accent)]/20 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-[var(--secondary-accent)]/20 blur-[130px]" />
      </div>

      {/* Floating 3D Animated Chess Pieces */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ y: [0, -25, 0], rotate: [0, 8, -6, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-24 left-[8%] text-7xl opacity-20 filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
        >
          ♚
        </motion.div>
        <motion.div 
          animate={{ y: [0, 30, 0], rotate: [0, -10, 8, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 right-[10%] text-8xl opacity-25 filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
        >
          ♞
        </motion.div>
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 12, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-32 left-[12%] text-6xl opacity-15 filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
        >
          ♝
        </motion.div>
        <motion.div 
          animate={{ y: [0, 25, 0], rotate: [0, -6, 12, 0] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute bottom-24 right-[15%] text-7xl opacity-20 filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
        >
          ♛
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24 relative z-10">
        
        {/* TOP LIVE TELEMETRY BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-5 mb-10 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <Radio className="w-3.5 h-3.5" />
              <span>LIVE SERVER</span>
            </span>
            <span className="text-xs text-white/60 font-mono hidden sm:inline">
              Latency: <strong className="text-white">{latencyMs}ms</strong>
            </span>
            <span className="text-xs text-white/60 font-mono hidden md:inline">
              Concurrent: <strong className="text-emerald-300">{activeGamesCount.toLocaleString()}</strong> games
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--secondary-accent)]/15 border border-[var(--secondary-accent)]/30 text-[11px] font-mono text-[var(--secondary-accent)]">
              <Flame className="w-3.5 h-3.5" />
              <span>1.2M+ Games Today</span>
            </div>
            <button
              onClick={onOpenLogin}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 transition-all text-white border border-white/15"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* HERO BANNER SECTION */}
        <div className="text-center max-w-4xl mx-auto mb-16 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-amber-500/20 border border-white/15 backdrop-blur-md mb-6 shadow-xl"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-xs sm:text-sm font-semibold text-white/90">
              The Next Generation Multiplayer Chess Platform
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 drop-shadow-2xl"
          >
            Master The Board. <br />
            <span className="bg-gradient-to-r from-[var(--secondary-accent)] via-purple-400 to-[var(--primary-accent)] bg-clip-text text-transparent">
              Elevate Your Strategy.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
          >
            Sub-50ms real-time multiplayer, deep Stockfish strategic vision, 
            cinematic 3D perspectives, and an honorable Peshmerga spirit.
          </motion.p>

          {/* CALL TO ACTION BUTTONS */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6"
          >
            {/* Primary Pulse Button: Play Now */}
            <button
              id="landing-play-now-btn"
              onClick={() => onOpenMultiplayer()}
              className="relative group px-8 py-4 rounded-2xl bg-gradient-to-r from-[var(--primary-accent)] to-[var(--secondary-accent)] text-white font-black text-lg shadow-[0_0_40px_rgba(108,99,255,0.45)] hover:shadow-[0_0_60px_rgba(255,107,107,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Play className="w-5 h-5 fill-current" />
              <span>Play Now</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping ml-1" />
            </button>

            {/* Play vs AI */}
            <button
              onClick={() => onStartPlay('ai')}
              className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-base border border-white/20 backdrop-blur-xl hover:border-white/40 transition-all flex items-center gap-2.5 shadow-lg active:scale-95"
            >
              <Cpu className="w-5 h-5 text-[var(--secondary-accent)]" />
              <span>Vs Bot Masters</span>
            </button>

            {/* Daily Puzzle */}
            <button
              onClick={() => onOpenPuzzles()}
              className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/90 font-bold text-base border border-white/10 backdrop-blur-xl hover:border-white/25 transition-all flex items-center gap-2.5 shadow-lg active:scale-95"
            >
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Tactics Puzzle</span>
            </button>
          </motion.div>
        </div>

        {/* LIVE STATS COUNTER STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-20">
          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-xl flex flex-col items-center text-center">
            <span className="text-3xl sm:text-4xl font-black font-mono text-white mb-1">
              {(gamesPlayedToday / 1000000).toFixed(1)}M+
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Games Played
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-xl flex flex-col items-center text-center">
            <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 mb-1">
              &lt;25ms
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
              WebSocket Latency
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-xl flex flex-col items-center text-center">
            <span className="text-3xl sm:text-4xl font-black font-mono text-[var(--secondary-accent)] mb-1">
              99.99%
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Engine Uptime
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-xl flex flex-col items-center text-center">
            <span className="text-3xl sm:text-4xl font-black font-mono text-amber-400 mb-1">
              100K+
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Active Tacticians
            </span>
          </div>
        </div>

        {/* LIVE GAMES FEED SECTION */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-xl font-bold tracking-tight text-white">Live Grandmaster Games</h2>
            </div>
            <button
              onClick={() => onOpenMultiplayer()}
              className="text-xs font-bold text-[var(--secondary-accent)] flex items-center gap-1 hover:underline"
            >
              <span>View All Arena Rooms</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {liveGames.map((gameItem) => (
              <div
                key={gameItem.id}
                className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all shadow-lg group hover:-translate-y-1"
              >
                <div className="flex items-center justify-between text-xs text-white/50 mb-3 font-mono">
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white/80">{gameItem.timeControl}</span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <Eye className="w-3.5 h-3.5" />
                    {gameItem.spectators} watching
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                      <span>{gameItem.white.flag}</span>
                      <span>{gameItem.white.name}</span>
                    </span>
                    <span className="text-xs font-mono text-white/60">({gameItem.white.elo})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                      <span>{gameItem.black.flag}</span>
                      <span>{gameItem.black.name}</span>
                    </span>
                    <span className="text-xs font-mono text-white/60">({gameItem.black.elo})</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/70">
                  <span>Move: <strong className="text-white">{gameItem.currentMove}</strong></span>
                  <span className="text-emerald-400 font-bold">{gameItem.evalScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURES GRID */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
              Crafted For Elite Competitors
            </h2>
            <p className="text-white/60 max-w-xl mx-auto text-sm sm:text-base">
              Engineered with zero compromises. From lightning WebSocket connections to cinematic glass themes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-500/30 backdrop-blur-xl transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                <Swords className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Real-Time Arena</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                6-char instant room codes, drift-free high resolution game clocks, and under 50ms moves.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 backdrop-blur-xl transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Social & Friends</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Unique handles, live challenge invites, instant private chat, and real-time friend presence.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 backdrop-blur-xl transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Tournaments</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Interactive Swiss and bracket ladders, live pairings, automatic clock transitions, and prize pools.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 backdrop-blur-xl transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Strategic Vision</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Deep position evaluation, classification of blunders vs brilliant moves, and interactive arrows.
              </p>
            </div>
          </div>
        </div>

        {/* TESTIMONIALS SECTION */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="text-center mb-10">
            <span className="text-xs font-mono uppercase tracking-widest text-[var(--secondary-accent)]">Endorsed Globally</span>
            <h2 className="text-3xl font-black tracking-tight text-white mt-1">Master Testimonials</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col justify-between shadow-xl"
              >
                <div className="mb-6">
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-white/80 italic leading-relaxed">
                    "{t.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl shadow-md">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{t.author}</h4>
                    <span className="text-xs text-white/50">{t.title}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER CALL TO ACTION */}
        <div className="max-w-4xl mx-auto text-center p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-white/[0.06] to-transparent border border-white/15 backdrop-blur-2xl shadow-2xl">
          <h3 className="text-2xl sm:text-4xl font-black text-white mb-4">
            Ready To Make Your Move?
          </h3>
          <p className="text-white/60 max-w-md mx-auto mb-8 text-sm">
            Join thousands of players worldwide. No downloads required. Pure web speed.
          </p>
          <button
            onClick={() => onOpenMultiplayer()}
            className="px-8 py-3.5 rounded-xl bg-white text-black font-extrabold text-base hover:bg-white/90 hover:scale-105 active:scale-95 transition-all shadow-xl inline-flex items-center gap-2"
          >
            <span>Launch Quick Arena</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
