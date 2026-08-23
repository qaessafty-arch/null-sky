import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Star, Send, CheckCircle2, X, Sparkles, Bug, Lightbulb, Compass, ShieldCheck } from 'lucide-react';
import { UserFeedback } from '../types/chess';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { profile, user, submitFeedback } = useAuth();

  const [category, setCategory] = useState<UserFeedback['category']>('feature');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || profile?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const categories: { id: UserFeedback['category']; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'feature', label: 'Feature Request', icon: <Lightbulb className="w-4 h-4 text-amber-400" />, desc: 'Suggest new chess modes, puzzles, or visual tools' },
    { id: 'bug', label: 'Bug Report', icon: <Bug className="w-4 h-4 text-red-400" />, desc: 'Report gameplay glitches, move rule issues, or UI bugs' },
    { id: 'chess_engine', label: 'Engine & Analysis', icon: <Compass className="w-4 h-4 text-sky-400" />, desc: 'Feedback on Stockfish AI depth, tactics, or evaluation' },
    { id: 'theme_lore', label: 'Kurdish Lore & Themes', icon: <Sparkles className="w-4 h-4 text-[#F5C453]" />, desc: 'UKH Citadel, Peshmerga lore, audio, and custom themes' },
    { id: 'general', label: 'General Feedback', icon: <MessageSquare className="w-4 h-4 text-emerald-400" />, desc: 'General thoughts, praise, or questions for the developer' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      await submitFeedback({
        category,
        rating,
        title: title.trim(),
        message: message.trim(),
        userName: profile?.displayName || user?.displayName || 'Peshmerga Tactician',
        userEmail: contactEmail.trim() || undefined,
        userBadge: profile?.badgeNumber !== undefined ? `#${profile.badgeNumber}` : undefined,
        status: 'pending'
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setTitle('');
        setMessage('');
      }, 2200);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 p-4">
      <div className="relative glass-panel rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-[#F5C453]/30 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-[#F5C453]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#52673A]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#8C2425] to-[#52673A] border border-[#F5C453]/40 text-[#F5C453] shadow-md">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#FDFCF7] tracking-tight flex items-center gap-2">
              <span>Send Developer Feedback</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5C453]/20 text-[#F5C453] border border-[#F5C453]/40 font-bold">
                Direct to Developer
              </span>
            </h2>
            <p className="text-xs text-[#DFD0B0]/70">
              Your feedback is sent directly to the developer panel (q.brz)
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-10 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-lg font-black text-white">Feedback Dispatched to Developer!</h3>
            <p className="text-xs text-[#DFD0B0]/80 max-w-sm mx-auto">
              Thank you for honoring the Peshmerga chessboard. Your thoughts will be reviewed by the creator.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Experience Rating */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#F5C453] mb-1.5">
                Rating & Experience
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        (hoverRating || rating) >= star
                          ? 'fill-[#F5C453] text-[#F5C453] drop-shadow-[0_0_8px_rgba(245,196,83,0.5)]'
                          : 'text-white/20'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-bold text-white/90">
                  {rating === 5 ? '⭐⭐⭐⭐⭐ Supreme (5/5)' :
                   rating === 4 ? '⭐⭐⭐⭐ Great (4/5)' :
                   rating === 3 ? '⭐⭐⭐ Good (3/5)' :
                   rating === 2 ? '⭐⭐ Needs Work (2/5)' : '⭐ Critical Fixes (1/5)'}
                </span>
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#F5C453] mb-1.5">
                Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                      category === cat.id
                        ? 'bg-[#52673A]/40 border-[#F5C453] shadow-md shadow-[#F5C453]/10 ring-1 ring-[#F5C453]/50'
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="mt-0.5">{cat.icon}</div>
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">{cat.label}</div>
                      <div className="text-[10px] text-[#DFD0B0]/60 line-clamp-1">{cat.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#F5C453] mb-1">
                Summary / Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Add Kurdish traditional music option or fix en passant visual"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs placeholder:text-white/30 focus:border-[#F5C453] outline-none transition-colors"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#F5C453] mb-1">
                Detailed Feedback / Suggestions
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your suggestion, encountered bug, or thoughts for the developer in detail..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs placeholder:text-white/30 focus:border-[#F5C453] outline-none transition-colors resize-none"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#DFD0B0]/70 mb-1">
                Your Email (Optional, for Developer reply)
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your.email@domain.com"
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs placeholder:text-white/30 focus:border-[#F5C453] outline-none transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim() || !message.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#52673A] to-[#8C2425] hover:from-[#5f7743] hover:to-[#a12b2c] text-white text-xs font-black shadow-lg border border-[#F5C453]/50 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-[#F5C453]" />
                <span>{submitting ? 'Sending...' : 'Transmit Feedback'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
