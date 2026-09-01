import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../utils/firebase';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './LanguageSelector';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  UserCheck, 
  Flame, 
  Zap, 
  RefreshCw,
  X,
  ChevronLeft,
  KeyRound,
  Crown
} from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onNavigateHome?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onCancel,
  onNavigateHome
}) => {
  const { 
    user, 
    profile, 
    signInWithGoogle, 
    signInWithApple, 
    signInWithEmail, 
    signUpWithEmail, 
    signInAsGuest, 
    sendPasswordReset,
    signInWithDeveloperPasskey,
    signInAsSky,
    signOut
  } = useAuth();
  const { t } = useTranslation();

  // Mode: Sign In vs Sign Up vs Forgot Password
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // Form Inputs
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('chess_remember_me') === 'true';
  });

  // Developer / Master Access
  const [showMasterAccess, setShowMasterAccess] = useState(false);
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [isSkyPasskeyInput, setIsSkyPasskeyInput] = useState(false);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('chess_saved_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
    }
  }, []);

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    localStorage.setItem('chess_remember_me', checked ? 'true' : 'false');
    if (!checked) {
      localStorage.removeItem('chess_saved_email');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (authMode === 'forgot') {
      setIsSubmitting(true);
      try {
        await sendPasswordReset(email.trim());
        setSuccessMessage('Password reset link has been dispatched to your email.');
        setTimeout(() => {
          setAuthMode('signin');
          setSuccessMessage(null);
        }, 4000);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to dispatch password reset. Please verify the email address.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (rememberMe) {
        localStorage.setItem('chess_saved_email', email.trim());
      } else {
        localStorage.removeItem('chess_saved_email');
      }

      if (authMode === 'signup') {
        await signUpWithEmail(email.trim(), password, displayName.trim() || undefined);
        setSuccessMessage('Account successfully created! Welcome to ChessApp.');
      } else {
        await signInWithEmail(email.trim(), password);
        setSuccessMessage('Successfully signed in.');
      }

      const currentUser = user || auth.currentUser;
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        await fetch('/api/auth/session-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });
      }

      if (onSuccess) onSuccess();
      else if (onNavigateHome) onNavigateHome();
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMessage('Invalid email or password combination.');
      } else if (code === 'auth/user-not-found') {
        setErrorMessage('No user found with this email. Would you like to Create an Account?');
      } else if (code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered. Please sign in instead.');
      } else {
        setErrorMessage(err?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      const currentUser = auth.currentUser;
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        await fetch('/api/auth/session-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
      }
      setSuccessMessage('Signed in with Google successfully.');
      if (onSuccess) onSuccess();
      else if (onNavigateHome) onNavigateHome();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(err?.message || 'Google sign-in could not be completed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await signInWithApple();
      setSuccessMessage('Signed in with Apple ID.');
      if (onSuccess) onSuccess();
      else if (onNavigateHome) onNavigateHome();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(err?.message || 'Apple Sign-In could not be completed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await signInAsGuest();
      setSuccessMessage('Welcome! Entering battlefield as Guest Warrior.');
      if (onSuccess) onSuccess();
      else if (onNavigateHome) onNavigateHome();
    } catch (err: any) {
      setErrorMessage('Could not initialize guest session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeveloperUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKeyInput.trim()) return;

    if (isSkyPasskeyInput) {
      signInAsSky(masterKeyInput.trim())
        .then(success => {
          if (success) {
            setSuccessMessage('Celestial Sky Account activated!');
            if (onSuccess) onSuccess();
            else if (onNavigateHome) onNavigateHome();
          } else {
            setErrorMessage('Invalid Celestial Passkey.');
          }
        })
        .catch(err => setErrorMessage(err.message));
    } else {
      const unlocked = signInWithDeveloperPasskey(masterKeyInput.trim());
      if (unlocked) {
        setSuccessMessage('Developer & Founder privileges unlocked (👑 Founder #0).');
        if (onSuccess) onSuccess();
        else if (onNavigateHome) onNavigateHome();
      } else {
        setErrorMessage('Invalid Developer Key. Access Denied.');
      }
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full flex items-center justify-center p-3 sm:p-6 lg:p-10 font-ui text-slate-100">
      {/* Dynamic Chessboard Grid Pattern Background */}
      <div className="absolute inset-0 bg-[#090d14] overflow-hidden pointer-events-none">
        {/* Subtle geometric chessboard tiles */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #ffffff 25%, transparent 25%), 
              linear-gradient(-45deg, #ffffff 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #ffffff 75%), 
              linear-gradient(-45deg, transparent 75%, #ffffff 75%)
            `,
            backgroundSize: '48px 48px',
            backgroundPosition: '0 0, 0 24px, 24px -24px, -24px 0px'
          }}
        />
        {/* Radial ambient glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-amber-500/10 via-emerald-500/10 to-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Glassmorphic Authentication Card */}
      <div className="relative w-full max-w-md bg-slate-900/85 backdrop-blur-2xl rounded-3xl border border-slate-700/60 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden z-10 transition-all duration-300">
        {/* Top Accent Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-[#F5C453] to-[#8C2425]" />

        <div className="p-6 sm:p-8">
          {/* Header Section */}
          <div className="text-center space-y-2 mb-6">
            {/* Logo Emblem */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600 shadow-xl shadow-black/40 text-2xl relative group">
              <span className="select-none filter drop-shadow">♟️</span>
              <span className="absolute -bottom-1 -right-1 text-xs select-none">☀️</span>
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
                  ChessApp
                </h1>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#8C2425] text-white border border-[#F5C453]/40 tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
                Master the 64 squares. Forge your legacy with precision and honor.
              </p>
            </div>
          </div>

          {/* If already logged in, show current profile status & switch option */}
          {profile && (
            <div className="mb-5 p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={profile.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'}
                  alt={profile.displayName}
                  className="w-10 h-10 rounded-xl object-cover border border-[#F5C453]/50 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="truncate">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="truncate">{profile.displayName}</span>
                    <span>{profile.flag}</span>
                  </div>
                  <div className="text-[10px] text-[#F5C453] font-mono">
                    Rating: {profile.elo} • {profile.role?.toUpperCase()}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:text-rose-200 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-lg transition-all cursor-pointer whitespace-nowrap"
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Feedback & Alert Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 shadow-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 shadow-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Mode Switcher Tabs (Sign In / Create Account) */}
          <div className="flex p-1 bg-slate-950/70 rounded-2xl border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('login.login')}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('login.register')}
            </button>
          </div>

          {/* Social OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full py-2.5 px-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-white text-xs font-bold border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer disabled:opacity-50 group hover:shadow-lg hover:shadow-black/30"
              title="Sign in with Google"
            >
              <svg className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Google</span>
            </button>

            {/* Apple OAuth Button */}
            <button
              type="button"
              onClick={handleAppleLogin}
              disabled={isSubmitting}
              className="w-full py-2.5 px-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-white text-xs font-bold border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer disabled:opacity-50 group hover:shadow-lg hover:shadow-black/30"
              title="Sign in with Apple ID"
            >
              <svg className="w-4 h-4 fill-current shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.59-7.71-11.71-14-6.3-9.58-11.14-20.45-14.51-32.61-3.37-12.16-5.06-23.49-5.06-34 0-14.79 3.65-27.13 10.96-37.03 7.31-9.9 16.42-14.93 27.34-15.09 4.35 0 9.17 1.13 14.46 3.39 5.29 2.26 9.13 3.39 11.53 3.39 2.07 0 6.07-1.2 12.01-3.6 5.94-2.4 11.02-3.47 15.24-3.21 11.53.65 20.85 4.97 27.97 12.96-10.23 6.19-15.24 14.89-15.03 26.09.22 8.91 3.58 16.36 10.08 22.34 6.5 5.98 14.3 9.4 23.4 10.27-2.17 6.42-4.78 12.72-7.83 18.9zm-29.43-107.82c0-7.39 2.67-14.24 8.01-20.55 5.34-6.31 11.85-10.12 19.53-11.43.98 7.39-1.31 14.13-6.86 20.22-5.55 6.09-12.44 9.92-20.68 11.76z" />
              </svg>
              <span>Apple ID</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
              Or with email
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* Email & Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {/* Display Name (Only in Sign Up Mode) */}
            {authMode === 'signup' && (
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Warrior Nickname / Display Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Peshmerga Knight"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-[#0B0F19] border border-[#1F293D] focus:border-[#F59E0B] text-white text-xs placeholder-slate-500 focus:ring-1 focus:ring-[#F59E0B] outline-none transition-all"
                  />
                  <ShieldCheck className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                {t('login.email')}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="warrior@chesskys.pro"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-9 py-2.5 rounded-2xl bg-[#0B0F19] border border-[#1F293D] focus:border-[#F59E0B] text-white text-xs placeholder-slate-500 focus:ring-1 focus:ring-[#F59E0B] outline-none transition-all"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Field (Only for Sign In and Sign Up) */}
            {authMode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-300">
                    {t('login.password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] font-semibold text-[#F5C453] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-9 py-2.5 rounded-2xl bg-[#0B0F19] border border-[#1F293D] focus:border-[#F59E0B] text-white text-xs placeholder-slate-500 focus:ring-1 focus:ring-[#F59E0B] outline-none transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
            {authMode === 'signup' && (
              <div className="relative mt-3">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-9 py-2.5 rounded-2xl bg-[#0B0F19] border border-[#1F293D] focus:border-[#F59E0B] text-white text-xs placeholder-slate-500 focus:ring-1 focus:ring-[#F59E0B] outline-none transition-all"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
              </div>
            )}
              </div>
            )}

            {/* Remember Me Checkbox */}
            {authMode !== 'forgot' && (
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => handleRememberMeChange(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-[#F5C453] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Remember me on this device</span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-[#F59E0B] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 border border-emerald-400/40 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : authMode === 'signup' ? (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Enlist & Create Account</span>
                </>
              ) : authMode === 'forgot' ? (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Send Reset Email</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 rtl-flip" />
                  <span>Enter Battlefield</span>
                </>
              )}
            </button>

            {/* Return to Sign In if on Forgot Password */}
            {authMode === 'forgot' && (
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className="w-full text-center text-xs text-slate-400 hover:text-white py-1 flex items-center justify-center gap-1 cursor-pointer font-bold"
              >
                <ChevronLeft className="w-3.5 h-3.5 rtl-flip" />
                <span>Return to Sign In</span>
              </button>
            )}
          </form>

          {/* =========================================================
              GUEST ACCESS (Prominent 1-Click Entry)
              ========================================================= */}
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-[#F5C453] font-bold text-xs border border-[#F5C453]/40 hover:border-[#F5C453] flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer group"
            >
              <Zap className="w-4 h-4 group-hover:scale-110 transition-transform text-[#F5C453]" />
              <span>{t('login.playAsGuest')}</span>
            </button>
            <p className="text-[10px] text-center text-slate-500 mt-1.5 mb-3">
              Jump straight into games without registration. Progress is stored locally on this device.
            </p>
            <div className="flex justify-center">
              <LanguageSelector />
            </div>
          </div>

          {/* Master / Developer Passkey Accordion */}
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => setShowMasterAccess(!showMasterAccess)}
              className="text-slate-500 hover:text-[#F5C453] flex items-center gap-1.5 transition-colors cursor-pointer font-mono"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{showMasterAccess ? 'Hide Master Passkey' : 'Developer & Master Passkey'}</span>
            </button>
            
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-slate-500 hover:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            )}
          </div>

          {/* Master Key Input Accordion Drawer */}
          {showMasterAccess && (
            <form onSubmit={handleDeveloperUnlock} className="mt-3 p-3 rounded-2xl bg-black/60 border border-amber-500/30 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#F5C453] uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  <span>Master Access Passkey</span>
                </span>
                <label className="flex items-center gap-1.5 text-[10px] text-sky-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSkyPasskeyInput}
                    onChange={e => setIsSkyPasskeyInput(e.target.checked)}
                    className="w-3 h-3 rounded"
                  />
                  <span>Celestial [Sky]</span>
                </label>
              </div>

              <div className="flex gap-1.5">
                <input
                  type="password"
                  placeholder={isSkyPasskeyInput ? 'Enter Celestial Passkey' : 'Enter Developer Key'}
                  value={masterKeyInput}
                  onChange={e => setMasterKeyInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-[#F5C453] outline-none"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[#F5C453] hover:bg-[#e0b042] text-black text-xs font-black transition-all cursor-pointer"
                >
                  Unlock
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
