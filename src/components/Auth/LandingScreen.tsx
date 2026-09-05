import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { Play, LogIn, ArrowRight } from 'lucide-react';
import { useGlassFloat } from '../../hooks/useGlassFloat';

interface LandingScreenProps {
  onOpenAuth: () => void;
  onSuccess?: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onOpenAuth, onSuccess }) => {
  const { signInAsGuest, signInWithGoogle, signInWithApple } = useAuth();
  const floatVariants = useGlassFloat(1.2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGuest = async () => {
    setLoading(true);
    try {
      await signInAsGuest();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={floatVariants}
        className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col items-center"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />
        
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-sky-500/20 rounded-2xl border border-white/10 flex items-center justify-center mb-6 shadow-inner">
          <span className="text-3xl filter drop-shadow-md">♟️</span>
        </div>
        
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight text-center">
          Chesskys <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">PRO</span>
        </h1>
        <p className="text-slate-400 text-sm mb-8 text-center">
          Enter the battlefield. Play anonymously or create an account to track your progress and Elo rating.
        </p>

        {error && (
          <div className="mb-6 w-full p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="w-full space-y-4">
          <button
            onClick={handleGuest}
            disabled={loading}
            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
          >
            <Play className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            Play as Guest (Instant)
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Or</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          <button
            onClick={onOpenAuth}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 rounded-xl text-white font-bold shadow-lg shadow-emerald-900/50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <LogIn className="w-5 h-5" />
            Sign Up / Log In
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>

        <div className="mt-8 w-full">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider text-center mb-4">
            Quick Connect
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={signInWithGoogle}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
              Google
            </button>
            <button
              type="button"
              onClick={signInWithApple}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              Apple
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
