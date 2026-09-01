import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Info, 
  Heart, 
  Globe, 
  ShieldCheck, 
  Code, 
  MessageCircle, 
  Play, 
  Send,
  ExternalLink,
  Users
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { AboutUsConfig } from '../types/chess';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FALLBACK_CONFIG: AboutUsConfig = {
  appName: "Chesskys PRO",
  tagline: "The Ultimate Kurdish Chess Experience",
  founderNote: "Forged in the heart of the Zagros mountains, Chesskys PRO is more than just a game—it's a tribute to the enduring spirit of the Peshmerga and the intellectual heritage of Kurdistan.",
  visionParagraphs: "Our vision is to unite the global Kurdish diaspora through the royal game. We combine cutting-edge engine technology with cultural lore to create a battlefield where honor and intelligence reign supreme.",
  socialLinks: {
    discord: "https://discord.gg/chesskys",
    github: "https://github.com/qayssafty",
    twitter: "https://twitter.com/chesskys",
    telegram: "https://t.me/chesskys"
  },
  credits: "Developed with passion by Qays Safty. Special thanks to the Peshmerga Vanguard community for their continuous support and testing.",
  announcementBanner: "Welcome to the Grand Arena of Kurdistan!"
};

export const AboutUsModal: React.FC<AboutUsModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<AboutUsConfig>(FALLBACK_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = onSnapshot(doc(db, 'system_configs', 'aboutUs'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as AboutUsConfig);
      } else {
        setConfig(FALLBACK_CONFIG);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-[#111827] border border-[#1F293D] rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-br from-[#1F293D] to-[#0B0F19] relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
               <div className="grid grid-cols-8 gap-1 rotate-12 scale-150">
                 {[...Array(64)].map((_, i) => (
                   <div key={i} className={`w-8 h-8 ${((Math.floor(i/8) + i%8) % 2 === 0) ? 'bg-white' : 'bg-transparent'}`} />
                 ))}
               </div>
            </div>
            
            <div className="relative z-10 text-center px-4">
              <h2 className="text-3xl font-black text-white tracking-tighter drop-shadow-md">
                {config.appName}
              </h2>
              <p className="text-amber-500 font-medium text-sm uppercase tracking-[0.2em]">
                {config.tagline}
              </p>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Announcement Banner */}
          {config.announcementBanner && (
            <div className="bg-amber-500/10 border-y border-amber-500/20 px-6 py-2">
              <p className="text-amber-400 text-xs font-semibold text-center uppercase tracking-widest animate-pulse">
                {config.announcementBanner}
              </p>
            </div>
          )}

          {/* Content Area */}
          <div className="max-h-[60vh] overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-700">
            
            {/* Founder's Note */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-slate-100 font-bold text-lg">
                <Heart size={20} className="text-rose-500" />
                <h3>Founder's Note</h3>
              </div>
              <p className="text-slate-400 leading-relaxed italic border-l-4 border-[#1F293D] pl-4">
                "{config.founderNote || FALLBACK_CONFIG.founderNote}"
              </p>
            </section>

            {/* Our Vision */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-slate-100 font-bold text-lg">
                <Globe size={20} className="text-blue-500" />
                <h3>Our Vision</h3>
              </div>
              <div className="text-slate-400 leading-relaxed space-y-4">
                {(config.visionParagraphs || FALLBACK_CONFIG.visionParagraphs).split('\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>

            {/* Core Values / Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#0B0F19] border border-[#1F293D] rounded-xl flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase">Security</div>
                  <div className="text-sm text-slate-200">Military Grade</div>
                </div>
              </div>
              <div className="p-4 bg-[#0B0F19] border border-[#1F293D] rounded-xl flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg">
                  <Users size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase">Community</div>
                  <div className="text-sm text-slate-200">Kurdish Vanguard</div>
                </div>
              </div>
            </div>

            {/* Connect */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-slate-100 font-bold text-lg">
                <ExternalLink size={20} className="text-amber-500" />
                <h3>Connect With Us</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {config.socialLinks.discord && (
                  <a href={config.socialLinks.discord} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#1F293D] hover:bg-[#2D3748] rounded-full text-slate-200 transition-colors text-sm">
                    {/* Lucide doesn't have Discord, using generic icon or placeholder if not found, but I included Discord in imports if available, actually Lucide has it now? Let's check imports */}
                    {/* Lucide might not have Discord. Using Globe as fallback if it fails */}
                    <MessageCircle size={16} /> 
                    <span>Discord</span>
                  </a>
                )}
                {config.socialLinks.github && (
                  <a href={config.socialLinks.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#1F293D] hover:bg-[#2D3748] rounded-full text-slate-200 transition-colors text-sm">
                    <Code size={16} />
                    <span>GitHub</span>
                  </a>
                )}
                {config.socialLinks.twitter && (
                  <a href={config.socialLinks.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#1F293D] hover:bg-[#2D3748] rounded-full text-slate-200 transition-colors text-sm">
                    <Globe size={16} />
                    <span>Twitter</span>
                  </a>
                )}
                {config.socialLinks.telegram && (
                  <a href={config.socialLinks.telegram} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#1F293D] hover:bg-[#2D3748] rounded-full text-slate-200 transition-colors text-sm">
                    <Send size={16} />
                    <span>Telegram</span>
                  </a>
                )}
                {config.socialLinks.youtube && (
                  <a href={config.socialLinks.youtube} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#1F293D] hover:bg-[#2D3748] rounded-full text-slate-200 transition-colors text-sm">
                    <Play size={16} />
                    <span>YouTube</span>
                  </a>
                )}
              </div>
            </section>

            {/* Credits */}
            <section className="pt-6 border-t border-[#1F293D]">
               <div className="flex items-center gap-2 text-slate-500 mb-2">
                 <Code size={16} />
                 <span className="text-xs font-bold uppercase tracking-widest">Architectural Credits</span>
               </div>
               <p className="text-slate-500 text-sm italic">
                 {config.credits}
               </p>
            </section>
          </div>

          {/* Footer */}
          <div className="p-6 bg-[#0B0F19]/50 border-t border-[#1F293D] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-500 font-medium">Systems Nominal</span>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-[#F59E0B] rounded-lg text-black font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform"
            >
              Back to Arena
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
