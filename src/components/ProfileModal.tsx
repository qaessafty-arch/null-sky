import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
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
  Camera,
  Upload,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { HONOR_RANKS, getHonorRank } from '../utils/respectSystem';
import { FeedbackModal } from './FeedbackModal';
import { DeveloperSettingsModal } from './DeveloperSettingsModal';
import { ChessAvatarModal } from './ChessAvatarModal';
import { AVATAR_PRESETS, compressAndResizeImage } from '../utils/imageUtils';
import { collection, doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../utils/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sanitizeChatText } from '../utils/security';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
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
    updateProfileDetails,
    updateProfilePhoto 
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

  // Profile Picture Selector & Persistence States
  const [isPhotoSelectorOpen, setIsPhotoSelectorOpen] = useState(false);
  const [photoSuccessMessage, setPhotoSuccessMessage] = useState('');
  const [customPhotoUrlInput, setCustomPhotoUrlInput] = useState('');
  const [profilePhotoInput, setProfilePhotoInput] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Owner Badge/Status Suite Accordion
  const [showOwnerCustomizer, setShowOwnerCustomizer] = useState(false);
  const [ownerBadgeSuccess, setOwnerBadgeSuccess] = useState('');
  
  // Account Management States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  useEffect(() => {
    if (user?.uid && isOpen) {
      const unsub = onSnapshot(collection(db, `users/${user.uid}/blocked`), snap => {
        setBlockedUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
    }
  }, [user?.uid, isOpen]);
  const handleUnblock = async (uid: string) => { if(user) { await deleteDoc(doc(db, `users/${user.uid}/blocked/${uid}`)); } };
  const [linkError, setLinkError] = useState('');
  
  const handleTogglePrivacy = async () => {
    try {
      await useAuth().updatePrivacy(!profile?.isPublic);
    } catch (e) {
      console.error('Failed to update privacy', e);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    try {
      await useAuth().deleteAccount(deleteInput);
      onClose();
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        setDeleteError('Requires recent login. Please sign out and sign in again before deleting your account.');
      } else {
        setDeleteError(e.message || 'Failed to delete account');
      }
    }
  };

  const handleLinkProvider = async (providerId: string) => {
    setLinkError('');
    try {
      await useAuth().linkProvider(providerId);
    } catch (e: any) {
      setLinkError(e.message || 'Failed to link account');
    }
  };

  const handleUnlinkProvider = async (providerId: string) => {
    setLinkError('');
    try {
      await useAuth().unlinkProvider(providerId);
    } catch (e: any) {
      setLinkError(e.message || 'Failed to unlink account');
    }
  };

  const userProviders = user?.providerData?.map(p => p.providerId) || [];


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
    setProfilePhotoInput(profile?.photoURL || '');
    setCustomPhotoUrlInput(profile?.photoURL || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    let sanitizedDisplayName = sanitizeChatText(displayName.trim());
    if (sanitizedDisplayName.length > 20) sanitizedDisplayName = sanitizedDisplayName.substring(0, 20);
    const sanitizedStatus = sanitizeChatText(statusMessage.trim());

    await updateProfileDetails({
      displayName: sanitizedDisplayName,
      country: country.trim(),
      flag: flag.trim(),
      customStatus: sanitizedStatus,
      customBadge: customBadgeInput.trim() || undefined,
      badgeNumber: Number(badgeNumberInput),
      photoURL: profilePhotoInput.trim() || undefined
    });
    setIsEditing(false);
    setPhotoSuccessMessage('Profile and picture updated and saved to cloud!');
    setTimeout(() => setPhotoSuccessMessage(''), 3500);
  };

  const handlePhotoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File must be smaller than 2MB');
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Only .jpg, .png, and .webp images are allowed');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const storageRef = ref(storage, `avatars/${user?.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      setProfilePhotoInput(downloadUrl);
      setCustomPhotoUrlInput(downloadUrl);
      await updateProfilePhoto(downloadUrl);

      setPhotoSuccessMessage('Profile picture uploaded to storage and saved successfully!');
      setTimeout(() => setPhotoSuccessMessage(''), 3500);
    } catch (err: any) {
      alert(err?.message || 'Failed to process image file');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveCustomPhotoUrl = async () => {
    if (!customPhotoUrlInput.trim()) return;
    const trimmed = customPhotoUrlInput.trim();
    setProfilePhotoInput(trimmed);
    await updateProfilePhoto(trimmed);
    setPhotoSuccessMessage('Profile picture URL saved and synchronized!');
    setTimeout(() => setPhotoSuccessMessage(''), 3500);
  };

  const handleSelectPresetAvatar = async (presetUrl: string) => {
    setProfilePhotoInput(presetUrl);
    setCustomPhotoUrlInput(presetUrl);
    await updateProfilePhoto(presetUrl);
    setPhotoSuccessMessage('Preset avatar equipped and saved to cloud!');
    setTimeout(() => setPhotoSuccessMessage(''), 3500);
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

  const handleDevPasskeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDevPassError('');
    const success = signInWithDeveloperPasskey(devPasskeyInput);
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

  const getSkyLoginUrl = () => {
    const origin = window.location.origin + window.location.pathname;
    return `${origin}?account=sky`;
  };

  const handleCopySkyLink = () => {
    navigator.clipboard.writeText(getSkyLoginUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="relative obsidian-panel rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl border border-[#1F293D] overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#F59E0B]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#94A3B8] hover:text-white p-1.5 rounded-xl hover:bg-[#1F293D] transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#1F293D] shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-[#0B0F19] border border-[#F59E0B] flex items-center justify-center text-[#F59E0B] shadow-2xl">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight uppercase">
                {t('profile.accountProfile')}
              </h2>
              {isOwner && (
                <span className="px-2 py-0.5 rounded-lg bg-[#F59E0B] text-[#0B0F19] text-[9px] font-black uppercase tracking-tighter shadow-lg shadow-[#F59E0B]/20">
                  Founder
                </span>
              )}
            </div>
            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] opacity-60">
              Identity & Cloud Command
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">

        {/* Dedicated Account [sky] Card (Developer-Locked Access) */}
        <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-sky-950/70 via-[#0B1726]/90 to-sky-900/50 border border-sky-400/40 shadow-lg relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(56,189,248,0.4)] shrink-0">
                🦋
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-black text-sky-200">Account: [sky]</h3>
                  <span className="px-1.5 py-0.5 rounded bg-sky-400/20 text-sky-300 text-[10px] font-black border border-sky-400/30">
                    CELESTIAL IMMORTAL 🦋
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-mono border border-amber-400/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> DEV ONLY
                  </span>
                </div>
                <p className="text-xs text-sky-200/70">
                  Infinite Celestial ELO (∞) • Infinite Respect (∞) • Protected Developer Identity
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isSkyAccount ? (
                <span className="px-3 py-1.5 rounded-xl bg-sky-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-sky-500/30">
                  <Check className="w-3.5 h-3.5" />
                  Active Celestial
                </span>
              ) : (
                <button
                  onClick={handleSkyLoginClick}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs transition-all shadow-md hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
                  title="Developer authorization required"
                >
                  <Lock className="w-3 h-3 text-sky-200" />
                  <span>Log in as [sky]</span>
                </button>
              )}

              <button
                onClick={handleCopySkyLink}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-sky-300 border border-sky-400/30 transition-all text-xs flex items-center gap-1"
                title="Copy Direct Login URL for [sky] Account"
              >
                {copiedLink ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Link'}</span>
              </button>
            </div>
          </div>

          {/* Sky Passkey Unlock Prompt Modal/Dropdown */}
          {showSkyPassModal && (
            <form onSubmit={handleSkyPasskeyUnlock} className="mt-3 pt-3 border-t border-sky-400/30 flex flex-wrap items-center gap-2 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-1.5 text-xs text-sky-200 font-bold">
                <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                <span>Developer Key:</span>
              </div>
              <input
                type="password"
                placeholder="Enter Developer Passkey (e.g. q.brz)"
                value={skyPassInput}
                onChange={e => setSkyPassInput(e.target.value)}
                className="flex-1 min-w-[180px] px-3 py-1.5 rounded-xl bg-black/50 border border-sky-400/40 text-white text-xs outline-none focus:border-sky-300"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow"
              >
                Verify & Unlock
              </button>
              <button
                type="button"
                onClick={() => setShowSkyPassModal(false)}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 text-white/70 text-xs font-bold"
              >
                Cancel
              </button>
              {skyError && (
                <p className="w-full text-[11px] text-red-300 font-bold mt-1">
                  {skyError}
                </p>
              )}
            </form>
          )}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10">
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

              <button
                type="button"
                onClick={() => { setAuthTab('dev_passkey'); setAuthError(''); }}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authTab === 'dev_passkey'
                    ? 'bg-gradient-to-r from-amber-600 to-[#8C2425] text-white shadow-md border border-amber-400'
                    : 'text-amber-300/80 hover:text-amber-200 hover:bg-white/5'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                <span>Dev Key</span>
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

            {/* TAB 4: DEVELOPER MASTER PASSKEY */}
            {authTab === 'dev_passkey' && (
              <form onSubmit={handleDevPasskeySubmit} className="space-y-3 animate-in fade-in duration-150">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Founder Direct Passkey Portal</span>
                  </div>
                  <p className="text-[11px] text-[#DFD0B0]/70 mt-1">
                    Instant access to <span className="text-[#F5C453] font-bold">qayssafty@gmail.com</span> Owner #0 credentials from any browser.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] text-[#DFD0B0]/70 font-bold block mb-1">
                    Developer Passkey
                  </label>
                  <input
                    type="password"
                    placeholder="Enter passkey (e.g. q.brz)"
                    value={devPasskeyInput}
                    onChange={e => setDevPasskeyInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-amber-400/40 text-white text-xs outline-none focus:border-amber-300 font-mono"
                  />
                </div>

                {devPassError && (
                  <p className="text-[11px] text-red-400 font-bold">{devPassError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-[#8C2425] hover:from-amber-500 text-white font-black text-xs border border-amber-400 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Crown className="w-4 h-4 text-[#F5C453]" />
                  <span>Authenticate as Founder #0</span>
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
              {/* Hidden File Input for Avatar Upload */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoFileSelect}
                accept="image/*"
                className="hidden"
              />

              <div className="flex items-center gap-3.5">
                {/* Interactive Avatar with Photo Switcher and Camera Action */}
                <div className="relative group shrink-0">
                  <img
                    src={profile?.photoURL || (isSkyAccount ? 'https://images.unsplash.com/photo-1557925923-cd4648e211a0?w=200&auto=format&fit=crop&q=80' : user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60')}
                    alt={profile?.displayName || 'User'}
                    className={`w-14 h-14 rounded-2xl object-cover border-2 shadow-md transition-all group-hover:scale-105 group-hover:border-[#F5C453] ${
                      isSkyAccount ? 'border-sky-400 ring-2 ring-sky-300/40' : 'border-[#F5C453]'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                  {isSkyAccount && (
                    <span className="absolute -bottom-1.5 -right-1.5 text-sm">🦋</span>
                  )}
                  {/* Photo Edit / Avatar Studio Overlay Button */}
                  <button
                    type="button"
                    onClick={() => setIsPhotoSelectorOpen(!isPhotoSelectorOpen)}
                    className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-amber-300 cursor-pointer"
                    title="Change or upload profile picture"
                  >
                    <Camera className="w-5 h-5 animate-pulse" />
                    <span className="text-[9px] font-bold text-white mt-0.5">Change</span>
                  </button>
                </div>

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
                {/* Change Picture Quick Toggle */}
                <button
                  type="button"
                  onClick={() => setIsPhotoSelectorOpen(!isPhotoSelectorOpen)}
                  className={`p-2 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                    isPhotoSelectorOpen
                      ? 'bg-[#F5C453] text-black border-[#F5C453]'
                      : 'bg-white/[0.08] hover:bg-white/[0.14] text-white/90 border-white/20'
                  }`}
                  title="Change, upload, or choose profile picture"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isPhotoSelectorOpen ? 'Close Photo Menu' : 'Change Photo'}</span>
                </button>

                {/* Imagen AI Avatar Studio Trigger */}
                <button
                  type="button"
                  onClick={() => setIsAvatarStudioOpen(true)}
                  className="p-2 px-2.5 rounded-xl bg-gradient-to-r from-amber-600/30 to-amber-500/20 hover:from-amber-600/50 hover:to-amber-500/40 text-amber-300 hover:text-amber-200 border border-amber-400/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="Generate custom AI Chess Avatar based on Honor Rank"
                >
                  <Wand2 className="w-3.5 h-3.5 text-[#F5C453]" />
                  <span>AI Studio</span>
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

            {/* Notification Banner for Saved Profile Picture */}
            {photoSuccessMessage && (
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{photoSuccessMessage}</span>
              </div>
            )}

            {/* ========================================================
                PROFILE PICTURE STUDIO & SELECTION DRAWER
                ======================================================== */}
            {isPhotoSelectorOpen && (
              <div className="p-4 rounded-2xl bg-black/60 border border-[#F5C453]/40 space-y-4 animate-in fade-in duration-150 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#52673A]/40 text-[#F5C453] border border-[#F5C453]/30">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">
                        Update & Save Profile Picture
                      </h4>
                      <p className="text-[10px] text-[#DFD0B0]/70">
                        Upload custom image, paste a web link, choose a Kurdish emblem, or forge with AI
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPhotoSelectorOpen(false)}
                    className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Upload or URL Action Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: File Upload */}
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[#F5C453] flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload From Device</span>
                      </span>
                      <p className="text-[10px] text-[#DFD0B0]/70 mt-1">
                        Select any PNG, JPG or WEBP image. It will be compressed & saved immediately to your cloud account.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isUploadingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-[#52673A] hover:bg-[#435433] text-white text-xs font-bold border border-[#F5C453]/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingPhoto ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Picture...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose Image File</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Option 2: Image URL Input */}
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[#F5C453] flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Image Web Link (URL)</span>
                      </span>
                      <p className="text-[10px] text-[#DFD0B0]/70 mt-1">
                        Paste any online image URL (e.g. from Unsplash, Imgur, Discord, etc.)
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="url"
                        placeholder="https://images.example.com/avatar.jpg"
                        value={customPhotoUrlInput}
                        onChange={e => setCustomPhotoUrlInput(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs focus:border-[#F5C453] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSaveCustomPhotoUrl}
                        disabled={!customPhotoUrlInput.trim()}
                        className="px-3 py-1.5 rounded-xl bg-[#F5C453] hover:bg-[#e0b042] text-black text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>

                {/* Option 3: Curated Peshmerga & Kurdish Emblem Presets */}
                <div className="space-y-2 pt-1 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#F5C453] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#F5C453]" />
                      <span>Curated Emblem & Commander Avatars (1-Click Equip & Save)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAvatarStudioOpen(true)}
                      className="text-[11px] text-[#F5C453] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Open AI Studio</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                    {AVATAR_PRESETS.map(preset => {
                      const isCurrent = profile?.photoURL === preset.url || profilePhotoInput === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPresetAvatar(preset.url)}
                          className={`relative group rounded-xl overflow-hidden aspect-square border-2 transition-all p-0.5 cursor-pointer ${
                            isCurrent
                              ? 'border-[#F5C453] ring-2 ring-[#F5C453]/50 scale-105'
                              : 'border-white/10 hover:border-[#F5C453]/60 hover:scale-105'
                          }`}
                          title={preset.name}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-1 right-1 text-xs drop-shadow">
                            {preset.badge}
                          </span>
                          {isCurrent && (
                            <div className="absolute inset-0 bg-[#52673A]/60 flex items-center justify-center rounded-lg">
                              <Check className="w-4 h-4 text-white drop-shadow font-black" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

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
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#F5C453] uppercase tracking-wider">
                    Edit Battlefield Identity
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPhotoSelectorOpen(true)}
                    className="text-[11px] text-[#F5C453] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Change Profile Photo</span>
                  </button>
                </div>

                {/* Profile Photo Quick Preview & Upload Row */}
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
                  <img
                    src={profilePhotoInput || profile?.photoURL || (isSkyAccount ? 'https://images.unsplash.com/photo-1557925923-cd4648e211a0?w=200&auto=format&fit=crop&q=80' : user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60')}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover border border-[#F5C453]/50 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <label className="text-[11px] text-[#DFD0B0]/70 block mb-1">Avatar Image Source</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold border border-white/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3 h-3 text-[#F5C453]" />
                        <span>Upload File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPhotoSelectorOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-[#52673A]/60 hover:bg-[#52673A] text-[#F5C453] text-[11px] font-bold border border-[#F5C453]/30 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Choose Preset / AI</span>
                      </button>
                    </div>
                  </div>
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
        </div>

        {/* Done Button */}
        <div className="mt-4 shrink-0 pt-4 border-t border-[#1F293D]">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-[#111827] hover:bg-[#1F293D] text-white font-black text-[10px] uppercase tracking-widest transition-all border border-[#1F293D] active:scale-95 cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </motion.div>

      {/* Global Utility Modals */}
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

