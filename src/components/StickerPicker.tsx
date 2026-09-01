import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StickerPickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export const StickerPicker: React.FC<StickerPickerProps> = ({ onSelect, onClose }) => {
  const [stickers, setStickers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_configs', 'stickers'), (docSnap) => {
      if (docSnap.exists()) {
        setStickers(docSnap.data().urls || []);
      } else {
        setStickers([]);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="absolute bottom-full mb-3 right-0 bg-[#0B0F19] border border-[#1F293D] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] w-72 h-80 overflow-hidden flex flex-col z-50 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F293D] bg-[#111827]">
        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] opacity-80">Sticker Arsenal</span>
        <button 
          type="button" 
          onClick={onClose} 
          className="text-[#94A3B8] hover:text-[#F59E0B] transition-all text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-[#0B0F19] border border-[#1F293D] active:scale-95 cursor-pointer"
        >
          Hide
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {loading ? (
           <div className="flex items-center justify-center h-full text-[#F59E0B] gap-2">
             <RefreshCw className="w-5 h-5 animate-spin" />
           </div>
        ) : stickers.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {stickers.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelect(url);
                  onClose();
                }}
                className="aspect-square p-2 rounded-xl bg-[#111827] hover:bg-[#1F293D] border border-[#1F293D] hover:border-[#F59E0B]/30 transition-all cursor-pointer active:scale-90 flex items-center justify-center group"
              >
                <img 
                  src={url} 
                  alt="Sticker" 
                  className="w-full h-full object-contain filter group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.4)] transition-all" 
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-[10px] text-[#94A3B8] font-black uppercase tracking-widest text-center opacity-40 leading-relaxed">
            Arsenal Empty.<br/>Upload in Profile.
          </div>
        )}
      </div>
    </motion.div>
  );
};
