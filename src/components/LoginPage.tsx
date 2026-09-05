import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../utils/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Mail, Eye, EyeOff, UserPlus, ArrowRight, User, X,
  ShieldCheck, Zap, ChevronLeft, KeyRound, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useGlassFloat } from '../hooks/useGlassFloat';
import { useTranslation } from 'react-i18next';

interface LoginPageProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onNavigateHome?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onCancel, onNavigateHome }) => {
  const { 
    user, profile, signInWithGoogle, signInWithApple, signInWithEmail, 
    signUpWithEmail, signInAsGuest, sendPasswordReset, signOut 
  } = useAuth();
  
  const { t } = useTranslation();
  const floatVariants = useGlassFloat(1.1);
  
  const [screen, setScreen] = useState<'landing' | 'auth'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Dev
  const [showDev, setShowDev] = useState(false);
  const [devPassword, setDevPassword] = useState('');
  const [skyPassword, setSkyPassword] = useState('');
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem('chess_saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setScreen('auth');
      setAuthMode('login');
    }
  }, []);

  const handleSuccess = async (message: string) => {
    setSuccess(message);
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const idToken = await currentUser.getIdToken();
        await fetch('/api/auth/session-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });
      } catch (e) {
        console.error('Session login failed', e);
      }
    }
    setTimeout(() => {
      if (onSuccess) onSuccess();
      else if (onNavigateHome) onNavigateHome();
    }, 1000);
  };

  const handleGuest = async () => {
    setError(null); setLoading(true);
    try {
      await signInAsGuest();
      await handleSuccess('Welcome, Guest Warrior!');
    } catch (err: any) {
      setError(err.message); setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setError(null); setLoading(true);
    try {
      if (provider === 'google') await signInWithGoogle();
      if (provider === 'apple') await signInWithApple();
      await handleSuccess(`Signed in with ${provider === 'google' ? 'Google' : 'Apple'}`);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') setError(err.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    
    try {
      if (authMode === 'forgot') {
        await sendPasswordReset(email);
        setSuccess('Password reset link sent.');
        setTimeout(() => setAuthMode('login'), 3000);
        setLoading(false);
        return;
      }

      if (authMode === 'signup') {
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        if (password.length < 8) throw new Error('Password must be at least 8 characters');
        await signUpWithEmail(email, password, displayName || undefined);
        if (rememberMe) localStorage.setItem('chess_saved_email', email);
        await handleSuccess('Account created successfully!');
      } else {
        await signInWithEmail(email, password);
        if (rememberMe) localStorage.setItem('chess_saved_email', email);
        else localStorage.removeItem('chess_saved_email');
        await handleSuccess('Successfully signed in.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  const handleDevAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devPassword) return;
    setError(null); setLoading(true);
    try {
      if (devPassword === 'q.brz') {
        await signInWithEmail('dev@chessky.local', 'q.brz1234');
        await handleSuccess('Developer Account activated.');
      } else {
        throw new Error('Invalid passkey');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSkyAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skyPassword) return;
    setError(null); setLoading(true);
    try {
      if (skyPassword === 'BLUEBERRY') {
        await signInWithEmail('sky@chessky.local', 'BLUEBERRY1234');
        await handleSuccess('Celestial Account activated.');
      } else {
        throw new Error('Invalid passkey');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={["visible", "float"]}
        variants={{
          visible: { opacity: 1, scale: 1 },
          ...floatVariants
        }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />
        
        {onCancel && (
          <button onClick={onCancel} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 flex items-center justify-center mb-4 shadow-inner">
            <span className="text-2xl filter drop-shadow">♟️</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Chesskys <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">PRO</span>
          </h1>
        </div>

        
        {profile && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-800/50 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img src={profile.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'} alt="Profile" className="w-10 h-10 rounded-xl object-cover border border-emerald-500/30" referrerPolicy="no-referrer" />
              <div className="truncate">
                <div className="text-sm font-bold text-white truncate">{profile.displayName} {profile.flag}</div>
                <div className="text-[10px] text-emerald-400 font-mono">Rating: {profile.elo}</div>
              </div>
            </div>
            <button onClick={async () => { await signOut(); if (onNavigateHome) onNavigateHome(); }} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold transition-colors whitespace-nowrap">
              Sign Out
            </button>
          </div>
        )}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}

        <AnimatePresence mode="wait">
          {screen === 'landing' ? (
            <motion.div key="landing" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-4">
              <button
                onClick={handleGuest}
                disabled={loading}
                className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Zap className="w-5 h-5 text-emerald-400" /> Play as Guest
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Or</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              <button
                onClick={() => setScreen('auth')}
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 rounded-xl text-white font-bold shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <ShieldCheck className="w-5 h-5" /> Sign In / Register
              </button>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => handleOAuth('google')}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" /> Google
                </button>
                <button
                  onClick={() => handleOAuth('apple')}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg> Apple
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="auth" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center mb-6">
                <button onClick={() => setScreen('landing')} className="text-slate-400 hover:text-white mr-3">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-1 bg-black/40 rounded-lg p-1">
                  <button onClick={() => {setAuthMode('login'); setError(null);}} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${authMode === 'login' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Log In</button>
                  <button onClick={() => {setAuthMode('signup'); setError(null);}} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${authMode === 'signup' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Sign Up</button>
                </div>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {authMode === 'signup' && (
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50" placeholder="Display Name" required />
                  </div>
                )}
                
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50" placeholder="Email Address" required />
                </div>

                {authMode !== 'forgot' && (
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50" placeholder="Password" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                {authMode === 'signup' && (
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50" placeholder="Confirm Password" required />
                  </div>
                )}

                {authMode === 'login' && (
                  <div className="flex justify-between items-center px-1">
                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                      <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500/50" />
                      Remember me
                    </label>
                    <button type="button" onClick={() => setAuthMode('forgot')} className="text-xs font-bold text-emerald-400 hover:text-emerald-300">
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button type="submit" disabled={loading} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? 'Processing...' : authMode === 'login' ? 'Sign In' : authMode === 'signup' ? 'Create Account' : 'Reset Password'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Master Access */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col items-center">
          <button onClick={() => setShowDev(!showDev)} className="text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest flex items-center gap-1 transition-colors">
            <KeyRound className="w-3 h-3" /> Developer Access
          </button>
          
          <AnimatePresence>
            {showDev && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="w-full overflow-hidden mt-3">
                <div className="flex flex-col gap-2">
                  <form onSubmit={handleDevAuth} className="flex gap-2">
                    <input type="password" value={devPassword} onChange={e => setDevPassword(e.target.value)} placeholder="Dev Passkey..." autoComplete="off" className="flex-1 bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-amber-500/50" />
                    <button type="submit" disabled={loading} className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
                      Unlock Dev
                    </button>
                  </form>
                  <form onSubmit={handleSkyAuth} className="flex gap-2">
                    <input type="password" value={skyPassword} onChange={e => setSkyPassword(e.target.value)} placeholder="Sky Passkey..." autoComplete="off" className="flex-1 bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-sky-500/50" />
                    <button type="submit" disabled={loading} className="px-3 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
                      Unlock Sky
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
