import React, { useState } from 'react';
import { useAuth, PRESET_BADGES, PRESET_STATUSES } from '../context/AuthContext';
import { 
  User, 
  LogIn, 
  LogOut, 
  Shield, 
  Award, 
  Edit2, 
  Check, 
  X, 
  Sparkles, 
  Flame, 
  Copy, 
  CheckCheck, 
  Link2, 
  Crown, 
  MessageSquare, 
  Sliders, 
  KeyRound, 
  UserCheck, 
  Mail, 
  Lock, 
  Zap, 
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Star,
  Wand2,
  Camera
} from 'lucide-react';
import { HONOR_RANKS, getHonorRank } from '../utils/respectSystem';
import { FeedbackModal } from './FeedbackModal';
import { DeveloperSettingsModal } from './DeveloperSettingsModal';
import { ChessAvatarModal } from './ChessAvatarModal';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { 
    user, 
    profile, 
    loading, 
    isSkyAccount, 
    isGuest,
    isDeveloper,
    isOwner,
    isAdmin,
    devModeUnlocked,
    signInWithGoogle, 
    signInAsGuest,
    signInWithEmail,
    signUpWithEmail,
    signInAsSky, 
    signInAsDeveloper,
    signInWithDeveloperPasskey,
    setOwnerBadgeAndStatus,
    signOut, 
    updateProfileDetails 
  } = useAuth();

  // Navigation & Form Tabs
  const [authTab, setAuthTab] = useState<'google' | 'guest' | 'email' | 'dev_passkey'>('google');
  
  // Guest inputs
  const [guestName, setGuestName] = useState('');
  const [guestCountry, setGuestCountry] = useState('Kurdistan');

  // Email/Password inputs
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailMode, setEmailMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dev Passkey inputs
  const [devPasskeyInput, setDevPasskeyInput] = useState('');
  const [devPassError, setDevPassError] = useState('');

  // Sky account passkey prompt modal state
  const [showSkyPassModal, setShowSkyPassModal] = useState(false);
  const [skyPassInput, setSkyPassInput] = useState('');
  const [skyError, setSkyError] = useState('');

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState('');
  const [flag, setFlag] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [customBadgeInput, setCustomBadgeInput] = useState('');
  const [badgeNumberInput, setBadgeNumberInput] = useState<number>(10);
  const [copiedLink, setCopiedLink] = useState(false);

  // Owner Badge/Status Suite Accordion
  const [showOwnerCustomizer, setShowOwnerCustomizer] = useState(false);
  const [ownerBadgeSuccess, setOwnerBadgeSuccess] = useState('');

  // Modals
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isDevSettingsOpen, setIsDevSettingsOpen] = useState(false);
  const [isAvatarStudioOpen, setIsAvatarStudioOpen] = useState(false);

  if (!isOpen) return null;

  const currentRespect = profile?.respectPoints ?? 100;
  const currentElo = profile?.elo ?? 1200;
  const currentRank = getHonorRank(currentRespect);

  const badgeNumber = profile?.badgeNumber ?? (isOwner || isDeveloper ? 0 : 10);
  const userRole = profile?.role ?? (isOwner || isDeveloper ? 'owner' : isAdmin ? 'admin' : 'member');

  const handleStartEdit = () => {
    setDisplayName(profile?.displayName || (isSkyAccount ? 'sky' : (user?.displayName || 'Peshmerga Warrior')));
    setCountry(profile?.country || 'Kurdistan');
    setFlag(profile?.flag || (isSkyAccount ? '🦋' : '☀️'));
    setStatusMessage(profile?.customStatus || 'Defending the mountain passes with honor');
    setCustomBadgeInput(profile?.customBadge || '');
    setBadgeNumberInput(profile?.badgeNumber !== undefined ? profile.badgeNumber : (isOwner ? 0 : 10));
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    await updateProfileDetails({
      displayName: displayName.trim(),
      country: country.trim(),
      flag: flag.trim(),
      customStatus: statusMessage.trim(),
      customBadge: customBadgeInput.trim() || undefined,
      badgeNumber: Number(badgeNumberInput)
    });
    setIsEditing(false);
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInAsGuest(guestName, guestCountry);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to start guest session');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      setAuthError('Please enter email and password');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      if (emailMode === 'login') {
        await signInWithEmail(emailInput, passwordInput);
      } else {
        await signUpWithEmail(emailInput, passwordInput, guestName || 'Peshmerga Tactician');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication error. Check email format or try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDevPasskeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDevPassError('');
    const success = await signInWithDeveloperPasskey(devPasskeyInput);
    if (success) {
      setDevPasskeyInput('');
    } else {
      setDevPassError('Invalid Developer Passkey. Access restricted to q.brz.');
    }
  };

  const handleSkyLoginClick = async () => {
    setSkyError('');
    if (isDeveloper || isOwner || devModeUnlocked) {
      try {
        await signInAsSky();
      } catch (e: any) {
        setSkyError(e?.message || 'Sky login error');
      }
    } else {
      // Require Dev Passkey
      setShowSkyPassModal(true);
    }
  };

  const handleSkyPasskeyUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSkyError('');
    try {
      const ok = await signInAsSky(skyPassInput);
      if (ok) {
        setShowSkyPassModal(false);
        setSkyPassInput('');
      } else {
        setSkyError('Invalid Developer Passkey for Sky account.');
      }
    } catch (e: any) {
      setSkyError(e?.message || 'Access Denied: Only Developer can log in as [sky].');
    }
  };

  const handleApplyOwnerPresetBadge = async (preset: typeof PRESET_BADGES[0]) => {
    try {
      await setOwnerBadgeAndStatus({
        customBadge: preset.label,
        badgeNumber: preset.badgeNumber,
        role: preset.role
      });
      setOwnerBadgeSuccess(`Equipped ${preset.label}!`);
      setTimeout(() => setOwnerBadgeSuccess(''), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyOwnerPresetStatus = async (status: string) => {
    try {
      await setOwnerBadgeAndStatus({
        customStatus: status
      });
      setOwnerBadgeSuccess(`Status updated!`);
      setTimeout(() => setOwnerBadgeSuccess(''), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 p-3 sm:p-4">
      <div className="relative glass-panel rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl border border-[#F5C453]/30 overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#F5C453]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#52673A]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#8C2425] via-[#52673A] to-[#F5C453] border border-[#F5C453]/40 text-[#F5C453] shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-[#FDFCF7] tracking-tight">
                Peshmerga Cloud Command & Profile
              </h2>
              {isOwner && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-400/40 uppercase">
                  👑 Founder
                </span>
              )}
            </div>
            <p className="text-xs text-[#DFD0B0]/70">
              Multi-Account Authoring, Badge Engine, and Cloud Honor Synchronization
            </p>
          </div>
        </div>

        {/* ========================================================
            AUTH STATE: UNLOGGED / MULTI-AUTHORING WAY OPTIONS
            ======================================================== */}
        {!user && !profile && !isSkyAccount ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            {/* Header */}
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">
                Choose Your Authoring & Sign-In Method
              </h3>
              <p className="text-xs text-[#DFD0B0]/70 max-w-md mx-auto">
                Sign in with Google, start an instant guest session, register with email, or unlock with the Developer Passkey.
              </p>
            </div>

            {/* Auth Mode Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => { setAuthTab('google'); setAuthError(''); }}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authTab === 'google'
                    ? 'bg-white text-black shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => { setAuthTab('guest'); setAuthError(''); }}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authTab === 'guest'
                    ? 'bg-[#52673A] text-white shadow-md border border-[#F5C453]/40'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Guest</span>
              </button>

              <button
                type="button"
                onClick={() => { setAuthTab('email'); setAuthError(''); }}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authTab === 'email'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>


            </div>

            {/* Error Message */}
            {authError && (
              <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* TAB 1: GOOGLE ONE CLICK */}
            {authTab === 'google' && (
              <div className="py-2 text-center space-y-3 animate-in fade-in duration-150">
                <button
                  onClick={signInWithGoogle}
                  disabled={loading || authLoading}
                  className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 rounded-2xl bg-white hover:bg-white/90 text-[#161c12] font-black text-sm transition-all shadow-xl hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in with Google Account</span>
                </button>
                <p className="text-[11px] text-[#DFD0B0]/60">
                  Syncs with Firebase Cloud, auto-allocates your warrior badge, and joins the global leaderboard.
                </p>
              </div>
            )}

            {/* TAB 2: GUEST ACCOUNT */}
            {authTab === 'guest' && (
              <form onSubmit={handleGuestSubmit} className="space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-[#DFD0B0]/70 font-bold block mb-1">
                      Guest Nickname
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Peshmerga Pioneer"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs outline-none focus:border-[#F5C453]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#DFD0B0]/70 font-bold block mb-1">
                      Country / Realm
                    </label>
                    <input
                      type="text"
                      value={guestCountry}
                      onChange={e => setGuestCountry(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs outline-none focus:border-[#F5C453]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 rounded-xl bg-[#52673A] hover:bg-[#435433] text-white font-bold text-xs border border-[#F5C453]/40 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <UserCheck className="w-4 h-4 text-[#F5C453]" />
                  <span>Enter Battlefield as Guest</span>
                </button>
                <p className="text-[11px] text-[#DFD0B0]/60 text-center">
                  Instant local gameplay with full metrics tracking. You can link to Google anytime without losing honor points.
                </p>
              </form>
            )}

            {/* TAB 3: EMAIL / PASSWORD */}
            {authTab === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-3 animate-in fade-in duration-150">
                <div className="flex gap-2 justify-center mb-1">
                  <button
                    type="button"
                    onClick={() => setEmailMode('login')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${emailMode === 'login' ? 'bg-white/20 text-white' : 'text-white/50'}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailMode('register')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${emailMode === 'register' ? 'bg-white/20 text-white' : 'text-white/50'}`}
                  >
                    Create Account
                  </button>
                </div>

                <div>
                  <label className="text-[11px] text-[#DFD0B0]/70 font-bold block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#DFD0B0]/70 font-bold block mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs outline-none focus:border-sky-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>{emailMode === 'login' ? 'Sign In with Email' : 'Register New Warrior Account'}</span>
                </button>
              </form>
            )}

          </div>
        ) : (
          /* ========================================================
             ACTIVE AUTH PROFILE VIEW
             ======================================================== */
          <div className="space-y-4">
            {/* User Profile Header Card */}
            <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              isSkyAccount
                ? 'bg-gradient-to-r from-sky-950/70 via-blue-900/40 to-sky-900/50 border-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                : 'bg-gradient-to-r from-[#52673A]/30 to-[#8C2425]/20 border-[#F5C453]/40'
            }`}>
              <div className="flex items-center gap-3.5">
                {/* Interactive Avatar with Imagen Studio Click */}
                <button
                  type="button"
                  onClick={() => setIsAvatarStudioOpen(true)}
                  className="relative group cursor-pointer text-left shrink-0"
                  title="Click to open Imagen Chess Avatar Studio"
                >
                  <img
                    src={profile?.photoURL || (isSkyAccount ? '/avatars/default.svg' : user?.photoURL || '/avatars/default.svg')}
                    alt={profile?.displayName || 'User'}
                    className={`w-14 h-14 rounded-2xl object-cover border-2 shadow-md transition-all group-hover:scale-105 group-hover:border-[#F5C453] ${
                      isSkyAccount ? 'border-sky-400 ring-2 ring-sky-300/40' : 'border-[#F5C453]'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                  {isSkyAccount && (
                    <span className="absolute -bottom-1.5 -right-1.5 text-sm">🦋</span>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-amber-300">
                    <Wand2 className="w-5 h-5 animate-pulse" />
                  </div>
                </button>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-white">
                      {profile?.displayName || (isSkyAccount ? 'sky' : user?.displayName || 'Peshmerga Warrior')}
                    </h3>
                    <span className="text-sm">{profile?.flag || (isSkyAccount ? '🦋' : '☀️')}</span>

                    {/* Role & Badge Number Pill */}
                    {isOwner || isDeveloper || badgeNumber === 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-400/40 flex items-center gap-1 font-mono shadow-sm">
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span>{profile?.customBadge || 'OWNER #0'}</span>
                      </span>
                    ) : isAdmin || (badgeNumber >= 1 && badgeNumber <= 9) ? (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black border border-purple-400/40 flex items-center gap-1 font-mono shadow-sm">
                        <Shield className="w-3 h-3 text-purple-400" />
                        <span>{profile?.customBadge || `ADMIN #${badgeNumber}`}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-400/30 font-mono">
                        {profile?.customBadge || `#${badgeNumber}`}
                      </span>
                    )}

                    {isGuest && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                        Guest
                      </span>
                    )}

                    {isSkyAccount && (
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/30 text-sky-300 text-[10px] font-black border border-sky-400/40">
                        CELESTIAL 🦋
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#DFD0B0]/70 font-mono">
                    {profile?.country || (isSkyAccount ? 'Kurdistan / Sky Realm' : 'Kurdistan')} • {profile?.email || (isSkyAccount ? 'sky.celestial@chesskys.pro' : isGuest ? 'Local Guest Session' : user?.email)}
                  </p>
                  {profile?.customStatus && (
                    <p className="text-xs text-sky-200/80 italic mt-0.5">
                      "{profile.customStatus}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Imagen AI Avatar Studio Trigger */}
                <button
                  type="button"
                  onClick={() => setIsAvatarStudioOpen(true)}
                  className="p-2 px-2.5 rounded-xl bg-gradient-to-r from-amber-600/30 to-amber-500/20 hover:from-amber-600/50 hover:to-amber-500/40 text-amber-300 hover:text-amber-200 border border-amber-400/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="Generate custom AI Chess Avatar based on Honor Rank"
                >
                  <Wand2 className="w-3.5 h-3.5 text-[#F5C453]" />
                  <span>AI Avatar Studio</span>
                </button>

                {!isEditing ? (
                  <button
                    onClick={handleStartEdit}
                    className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#F5C453]" />
                    <span>Edit</span>
                  </button>
                ) : null}

                <button
                  onClick={signOut}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* ========================================================
                OWNER & DEVELOPER BADGES & STATUSES WORKSHOP
                ======================================================== */}
            {(isOwner || isDeveloper || devModeUnlocked) && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-black/50 to-slate-900/60 border-2 border-[#F5C453]/60 space-y-3 shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-[#F5C453]" />
                    <h3 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide">
                      👑 Founder Badges & Prestige Statuses Workshop
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOwnerCustomizer(!showOwnerCustomizer)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-400/40 transition-all cursor-pointer"
                  >
                    {showOwnerCustomizer ? 'Collapse Workshop' : 'Open Badges & Statuses'}
                  </button>
                </div>

                {ownerBadgeSuccess && (
                  <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-in fade-in">
                    {ownerBadgeSuccess}
                  </div>
                )}

                {showOwnerCustomizer && (
                  <div className="space-y-3 pt-2 border-t border-white/10 animate-in fade-in duration-150">
                    {/* Preset Badges Matrix */}
                    <div>
                      <label className="text-[11px] text-[#DFD0B0]/80 font-bold block mb-1.5">
                        Equip Royal Battlefield Badges (1-Click Apply):
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {PRESET_BADGES.map(badge => {
                          const isEquipped = profile?.customBadge === badge.label;
                          return (
                            <button
                              key={badge.id}
                              type="button"
                              onClick={() => handleApplyOwnerPresetBadge(badge)}
                              className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                                isEquipped
                                  ? 'bg-amber-500/30 border-[#F5C453] text-[#F5C453] ring-1 ring-[#F5C453]'
                                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                              }`}
                            >
                              <div className="text-xs font-black truncate">{badge.label}</div>
                              <div className="text-[10px] text-[#DFD0B0]/60 truncate">{badge.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Preset Status Quotes */}
                    <div>
                      <label className="text-[11px] text-[#DFD0B0]/80 font-bold block mb-1.5">
                        Equip Master Status Battle Cries:
                      </label>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {PRESET_STATUSES.map((status, i) => {
                          const isEquipped = profile?.customStatus === status;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleApplyOwnerPresetStatus(status)}
                              className={`w-full p-2 rounded-xl text-left text-xs font-medium border transition-all cursor-pointer flex items-center justify-between ${
                                isEquipped
                                  ? 'bg-[#52673A]/40 border-[#F5C453] text-white'
                                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-[#DFD0B0]/80'
                              }`}
                            >
                              <span className="truncate italic">"{status}"</span>
                              {isEquipped && <Check className="w-3.5 h-3.5 text-[#F5C453] shrink-0 ml-2" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Editable Profile Inputs */}
            {isEditing && (
              <div className="p-4 rounded-2xl bg-black/50 border border-[#F5C453]/40 space-y-3 animate-in fade-in duration-150">
                <div className="text-xs font-bold text-[#F5C453] uppercase tracking-wider">
                  Edit Battlefield Identity
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-[#DFD0B0]/70 block mb-1">Warrior Nickname</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:border-[#F5C453] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#DFD0B0]/70 block mb-1">Country / Realm</label>
                    <input
                      type="text"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:border-[#F5C453] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#DFD0B0]/70 block mb-1">Custom Status / Battle Cry</label>
                  <input
                    type="text"
                    value={statusMessage}
                    onChange={e => setStatusMessage(e.target.value)}
                    placeholder="e.g. Defending the mountain passes with honor"
                    className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:border-[#F5C453] outline-none"
                  />
                </div>

                {(isOwner || isDeveloper || devModeUnlocked) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-[#DFD0B0]/70 block mb-1">Custom Badge Tag</label>
                      <input
                        type="text"
                        value={customBadgeInput}
                        onChange={e => setCustomBadgeInput(e.target.value)}
                        placeholder="e.g. 👑 FOUNDER #0"
                        className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:border-[#F5C453] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#DFD0B0]/70 block mb-1">Badge Number (0=Owner)</label>
                      <input
                        type="number"
                        value={badgeNumberInput}
                        onChange={e => setBadgeNumberInput(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:border-[#F5C453] outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-1.5 rounded-xl bg-[#52673A] hover:bg-[#435433] text-white text-xs font-bold border border-[#F5C453]/40 shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Check className="w-3.5 h-3.5 text-[#F5C453]" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            )}

            {/* Respect & Battle Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                <span className="text-[10px] uppercase text-[#DFD0B0]/60 font-semibold block">Respect</span>
                <span className="text-lg font-black text-[#F5C453]">✊ {currentRespect}</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                <span className="text-[10px] uppercase text-[#DFD0B0]/60 font-semibold block">Rating</span>
                <span className="text-lg font-black text-white">⚔️ {currentElo}</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                <span className="text-[10px] uppercase text-[#DFD0B0]/60 font-semibold block">Executions</span>
                <span className="text-lg font-black text-red-400">⚔️ {profile?.executions ?? 0}</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                <span className="text-[10px] uppercase text-[#DFD0B0]/60 font-semibold block">Mercies</span>
                <span className="text-lg font-black text-emerald-400">🕊️ {profile?.merciesGranted ?? 0}</span>
              </div>
            </div>

            {/* Honor Rank Progression */}
            <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              isSkyAccount 
                ? 'bg-sky-950/40 border-sky-400/40' 
                : 'bg-[#52673A]/20 border-[#F5C453]/30'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 rounded-xl bg-black/40 border border-[#F5C453]/30">
                  {isSkyAccount ? '🦋' : currentRank.badge}
                </span>
                <div>
                  <span className="text-[10px] text-[#F5C453] uppercase font-bold tracking-wider">Current Honor Rank</span>
                  <h4 className="text-base font-black text-white">{isSkyAccount ? 'CELESTIAL TACTICIAN 🦋' : currentRank.title}</h4>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAvatarStudioOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#F5C453]/20 hover:bg-[#F5C453]/30 text-[#F5C453] text-xs font-bold border border-[#F5C453]/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Generate Avatar</span>
                </button>
                <span className="text-[11px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  Cloud Synced ☁️
                </span>
              </div>
            </div>

            {/* Additional Community & Developer Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsFeedbackOpen(true)}
                className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-[#F5C453] transition-colors">
                      Send Feedback
                    </div>
                    <div className="text-[10px] text-[#DFD0B0]/60">
                      Submit suggestions to creator
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsDevSettingsOpen(true)}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                  isDeveloper || isOwner || devModeUnlocked
                    ? 'bg-gradient-to-r from-amber-950/40 to-slate-900/60 border-[#F5C453] shadow-md shadow-[#F5C453]/10'
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                      <span>Developer Setting</span>
                      <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-400/40">
                        [Dev Set]
                      </span>
                    </div>
                    <div className="text-[10px] text-[#DFD0B0]/60">
                      Manage roles, badges & permissions
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Done Button */}
        <div className="mt-4">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-[#52673A] hover:bg-[#435433] text-white font-bold text-xs transition-all shadow-md border border-[#F5C453]/40 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* User Feedback Submission Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      {/* Developer Command Center Modal [Dev Set] */}
      <DeveloperSettingsModal
        isOpen={isDevSettingsOpen}
        onClose={() => setIsDevSettingsOpen(false)}
      />

      {/* Imagen Chess Avatar Studio Modal */}
      <ChessAvatarModal
        isOpen={isAvatarStudioOpen}
        onClose={() => setIsAvatarStudioOpen(false)}
        currentRankTitle={currentRank.title}
      />
    </div>
  );
};

