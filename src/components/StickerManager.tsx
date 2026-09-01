import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Trash2, Plus, RefreshCw } from 'lucide-react';

export const StickerManager: React.FC = () => {
  const [stickers, setStickers] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
      setError('Failed to load stickers');
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleAddSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    
    setSaving(true);
    setError('');
    try {
      const updated = [...stickers, newUrl.trim()];
      await setDoc(doc(db, 'system_configs', 'stickers'), {
        id: 'stickers',
        urls: updated,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setNewUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to add sticker');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSticker = async (indexToRemove: number) => {
    setSaving(true);
    setError('');
    try {
      const updated = stickers.filter((_, i) => i !== indexToRemove);
      await setDoc(doc(db, 'system_configs', 'stickers'), {
        id: 'stickers',
        urls: updated,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err: any) {
      setError(err.message || 'Failed to remove sticker');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center text-[#DFD0B0]/70 text-xs font-bold gap-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Loading Stickers...
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-[#F5C453] mb-1">
            Global Sticker Manager
          </h3>
          <p className="text-xs text-[#DFD0B0]/70">
            Manage the list of sticker URLs available to all users in chat.
          </p>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleAddSticker} className="flex gap-2">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://example.com/sticker.png"
            className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs outline-none focus:border-[#F5C453]"
            required
          />
          <button
            type="submit"
            disabled={saving || !newUrl.trim()}
            className="px-4 py-2 rounded-xl bg-[#52673A] hover:bg-[#637d45] text-white text-xs font-bold shadow disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </form>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-4 border-t border-white/10">
          {stickers.map((url, i) => (
            <div key={i} className="group relative aspect-square rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
              <img src={url} alt={`Sticker ${i}`} className="w-full h-full object-contain p-2" />
              <button
                onClick={() => handleRemoveSticker(i)}
                disabled={saving}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>
          ))}
          {stickers.length === 0 && (
            <div className="col-span-full text-center py-6 text-xs text-[#DFD0B0]/50 font-bold">
              No stickers configured yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
