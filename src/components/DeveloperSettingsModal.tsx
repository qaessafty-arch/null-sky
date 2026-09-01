import React, { useState, useEffect } from 'react';
import { useAuth, UserProfileData, DEVELOPER_PROFILE_DEFAULT, SKY_PROFILE_DEFAULT } from '../context/AuthContext';
import { 
  Shield, 
  Crown, 
  Sparkles, 
  X, 
  MessageSquare, 
  Users, 
  Zap, 
  Check, 
  Trash2, 
  Edit3, 
  Award, 
  Star, 
  Search, 
  RefreshCw,
  Sliders,
  CheckCircle2,
  Lock,
  Unlock,
  ExternalLink,
  Flame,
  BadgeAlert,
  Database,
  Globe,
  Heart
} from 'lucide-react';
import { UserRole, UserFeedback, AboutUsConfig, SystemConfig } from '../types/chess';
import { DatabaseView } from './DatabaseView';
import { StickerManager } from './StickerManager';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { sanitizeChatText } from '../utils/security';

interface DeveloperSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperSettingsModal: React.FC<DeveloperSettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    user, 
    profile, 
    isDeveloper, 
    isOwner, 
    devModeUnlocked,
    toggleDevModeUnlocked,
    signInAsDeveloper,
    signInAsSky,
    getFeedbacksList,
    updateFeedbackStatus,
    deleteFeedbackItem,
    getAllUserProfiles,
    updateUserRoleAndBadge
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'permissions' | 'about_us_cms' | 'maintenance'>('permissions');
  const [maintenanceSubTab, setMaintenanceSubTab] = useState<'feedback' | 'database' | 'switcher' | 'stickers'>('feedback');
  
  // CMS State
  const [aboutUsData, setAboutUsData] = useState<AboutUsConfig | null>(null);
  const [isCmsLoading, setIsCmsLoading] = useState(false);
  const [isCmsSaving, setIsCmsSaving] = useState(false);

  // Data states
  const [usersList, setUsersList] = useState<UserProfileData[]>([]);
  const [feedbacksList, setFeedbacksList] = useState<UserFeedback[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');

  // Role & Badge Edit Modal/Form State
  const [selectedUser, setSelectedUser] = useState<UserProfileData | null>(null);
  const [targetUid, setTargetUid] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('member');
  const [editBadgeNumber, setEditBadgeNumber] = useState<number>(10);
  const [editCustomBadge, setEditCustomBadge] = useState('');
  const [editElo, setEditElo] = useState<number>(1200);
  const [editRespect, setEditRespect] = useState<number>(100);
  const [editStatus, setEditStatus] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Feedback note state
  const [replyNote, setReplyNote] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadAllData();
      loadAboutUsCms();
    }
  }, [isOpen]);

  const loadAboutUsCms = async () => {
    setIsCmsLoading(true);
    try {
      const configRef = doc(db, 'system_configs', 'aboutUs');
      const snap = await getDoc(configRef);
      if (snap.exists()) {
        setAboutUsData(snap.data() as AboutUsConfig);
      } else {
        // Fallback matching types/chess.ts
        setAboutUsData({
          appName: "Chesskys PRO",
          tagline: "The Ultimate Kurdish Chess Experience",
          founderNote: "Forged in the heart of the Zagros mountains...",
          visionParagraphs: "Our vision is to unite the global Kurdish diaspora...",
          credits: "Developed by Qays Safty",
          announcementBanner: "Welcome to the Arena!",
          socialLinks: { discord: "", twitter: "", github: "", telegram: "" }
        });
      }
    } catch (err) {
      console.error("CMS Load error:", err);
    } finally {
      setIsCmsLoading(false);
    }
  };

  const handleSaveAboutUs = async () => {
    if (!aboutUsData) return;
    setIsCmsSaving(true);
    try {
      // Sanitize inputs
      const sanitized = {
        ...aboutUsData,
        appName: sanitizeChatText(aboutUsData.appName || ""),
        tagline: sanitizeChatText(aboutUsData.tagline || ""),
        founderNote: sanitizeChatText(aboutUsData.founderNote || ""),
        visionParagraphs: sanitizeChatText(aboutUsData.visionParagraphs || ""),
        credits: sanitizeChatText(aboutUsData.credits || ""),
        announcementBanner: sanitizeChatText(aboutUsData.announcementBanner || ""),
        lastUpdated: new Date().toISOString()
      };

      const configRef = doc(db, 'system_configs', 'aboutUs');
      await setDoc(configRef, sanitized);
      showSuccess("About Us CMS Published Successfully!");
    } catch (err) {
      console.error("CMS Save error:", err);
    } finally {
      setIsCmsSaving(false);
    }
  };

  const loadAllData = async () => {
    setLoadingUsers(true);
    setLoadingFeedbacks(true);
    try {
      const [uList, fbList] = await Promise.all([
        getAllUserProfiles(),
        getFeedbacksList()
      ]);
      setUsersList(uList);
      setFeedbacksList(fbList);
    } catch (e) {
      console.warn('Error loading dev data:', e);
    } finally {
      setLoadingUsers(false);
      setLoadingFeedbacks(false);
    }
  };

  if (!isOpen) return null;

  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 3000);
  };

  const handleSelectUserForEdit = (u: UserProfileData) => {
    setSelectedUser(u);
    setTargetUid(u.uid);
    setEditRole(u.role || 'member');
    setEditBadgeNumber(u.badgeNumber !== undefined ? u.badgeNumber : 10);
    setEditCustomBadge(u.customBadge || '');
    setEditElo(typeof u.elo === 'number' ? u.elo : 1500);
    setEditRespect(typeof u.respectPoints === 'number' ? u.respectPoints : 200);
    setEditStatus(u.customStatus || '');
  };

  const handleSaveUserModifications = async () => {
    if (!targetUid) return;
    try {
      await updateUserRoleAndBadge(targetUid, {
        role: editRole,
        badgeNumber: Number(editBadgeNumber),
        customBadge: editCustomBadge.trim() || undefined,
        customStatus: editStatus.trim() || undefined,
        elo: Number(editElo),
        respectPoints: Number(editRespect)
      });
      showSuccess(`Profile [${selectedUser?.displayName || targetUid}] updated with Role: ${editRole.toUpperCase()} & Badge #${editBadgeNumber}!`);
      loadAllData();
      setSelectedUser(null);
    } catch (e) {
      console.error('Failed to update user:', e);
    }
  };

  const handleQuickGrantAdmin = async (u: UserProfileData, badgeNum: number = 1) => {
    try {
      await updateUserRoleAndBadge(u.uid, {
        role: 'admin',
        badgeNumber: badgeNum,
        customBadge: `🛡️ ADMIN #${badgeNum}`
      });
      showSuccess(`Promoted ${u.displayName} to Admin with Badge #${badgeNum}!`);
      loadAllData();
    } catch (e) {
      console.error('Quick admin failed:', e);
    }
  };

  const handleUpdateFeedback = async (id: string, status: 'pending' | 'reviewed' | 'resolved') => {
    const note = replyNote[id];
    await updateFeedbackStatus(id, status, note);
    showSuccess(`Feedback marked as ${status.toUpperCase()}`);
    loadAllData();
  };

  const handleDeleteFeedback = async (id: string) => {
    if (confirm('Are you sure you want to delete this feedback?')) {
      await deleteFeedbackItem(id);
      showSuccess('Feedback deleted from database');
      loadAllData();
    }
  };

  const filteredUsers = usersList.filter(u => 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.uid?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFeedbacks = feedbacksList.filter(fb => {
    if (feedbackFilter === 'all') return true;
    return fb.status === feedbackFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-200 p-3 sm:p-5">
      <div className="relative glass-panel rounded-3xl p-5 sm:p-7 max-w-4xl w-full shadow-2xl border border-[#F5C453]/40 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#52673A]/25 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-600 via-[#8C2425] to-[#52673A] border-2 border-[#F5C453] text-[#F5C453] shadow-lg shadow-[#F5C453]/20">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Developer Command Center <span className="text-[#F5C453] font-mono">[Dev Set]</span>
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-400/40 uppercase">
                  👑 Founder #0 Access
                </span>
              </div>
              <p className="text-xs text-[#DFD0B0]/70">
                Owner Account: <span className="text-[#F5C453] font-mono font-bold">qayssafty@gmail.com</span> • Roles & Badge Number Engine (#0 Dev, #1-#9 VIP/Admin, #10+ Users)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllData}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#DFD0B0] text-xs font-bold border border-white/10 flex items-center gap-1.5 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Cloud</span>
            </button>
          </div>
        </div>

        {/* Success Toast Banner */}
        {actionSuccessMsg && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pt-4 pb-3 border-b border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === 'permissions'
                ? 'bg-gradient-to-r from-amber-500/20 to-red-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                : 'bg-[#111827] text-slate-400 border-[#1F293D] hover:text-slate-200 hover:bg-[#1F293D]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>1. User Permissions & Roles</span>
          </button>

          <button
            onClick={() => setActiveTab('about_us_cms')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === 'about_us_cms'
                ? 'bg-gradient-to-r from-amber-500/20 to-red-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                : 'bg-[#111827] text-slate-400 border-[#1F293D] hover:text-slate-200 hover:bg-[#1F293D]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>2. About Us CMS</span>
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === 'maintenance'
                ? 'bg-gradient-to-r from-amber-500/20 to-red-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                : 'bg-[#111827] text-slate-400 border-[#1F293D] hover:text-slate-200 hover:bg-[#1F293D]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>3. System & Maintenance</span>
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-6">
          {/* ========================================================
              TAB 1: PERMISSIONS & USER LIST
              ======================================================== */}
          {activeTab === 'permissions' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Badge Hierarchy Explainer Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-black/40 to-slate-900/50 border border-[#F5C453]/40 space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#F5C453]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#F5C453]">
                    Official Badge Number & Role Protocol
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <span>👑 Badge #0</span>
                      <span className="text-[10px] px-1.5 rounded bg-amber-400/20 text-amber-300">LOCKED</span>
                    </div>
                    <p className="text-[11px] text-[#DFD0B0]/70 mt-0.5">
                      Reserved exclusively for Founder & Developer (<span className="text-[#F5C453] font-mono font-bold">qayssafty@gmail.com</span>). Complete master control.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <div className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                      <span>🛡️ Badges #1 to #9</span>
                      <span className="text-[10px] px-1.5 rounded bg-purple-400/20 text-purple-300">DEV ASSIGNED</span>
                    </div>
                    <p className="text-[11px] text-[#DFD0B0]/70 mt-0.5">
                      Elite Admin & VIP slots that the developer can grant to trusted admins, grandmasters, or champions.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30">
                    <div className="text-xs font-black text-sky-300 flex items-center gap-1.5">
                      <span>☀️ Badges #10 to ∞</span>
                      <span className="text-[10px] px-1.5 rounded bg-sky-400/20 text-sky-300">AUTO-INCREMENT</span>
                    </div>
                    <p className="text-[11px] text-[#DFD0B0]/70 mt-0.5">
                      All new accounts automatically receive sequential warrior badges (#10, #11, #12...) upon joining.
                    </p>
                  </div>
                </div>
              </div>

              {/* Edit Modal / Form if a user is selected */}
              {selectedUser && (
                <div className="p-4 rounded-2xl bg-black/60 border-2 border-[#F5C453] space-y-3 shadow-xl animate-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-[#F5C453]" />
                      <h4 className="text-sm font-black text-white">
                        Configure Permissions for: <span className="text-[#F5C453]">{selectedUser.displayName}</span>
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="text-white/60 hover:text-white text-xs font-bold px-2 py-1 rounded-lg bg-white/10"
                    >
                      Close Form
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-[#DFD0B0]/80 font-bold block mb-1">
                        Role Assignment
                      </label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold outline-none focus:border-[#F5C453]"
                      >
                        <option value="owner" className="bg-[#161c12]">👑 Owner (Founder / Supreme)</option>
                        <option value="admin" className="bg-[#161c12]">🛡️ Admin (System Moderator)</option>
                        <option value="grandmaster" className="bg-[#161c12]">⚡ Grandmaster / Champion</option>
                        <option value="moderator" className="bg-[#161c12]">⚔️ Moderator</option>
                        <option value="member" className="bg-[#161c12]">☀️ Member / Warrior</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-[#DFD0B0]/80 font-bold block mb-1">
                        Badge Number (0=Owner, 1-9=VIP, 10+=User)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="999999"
                        value={editBadgeNumber}
                        onChange={(e) => setEditBadgeNumber(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold outline-none focus:border-[#F5C453]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-[#DFD0B0]/80 font-bold block mb-1">
                        Custom Badge Tag (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 🛡️ CHIEF ADMIN or ⚡ GM"
                        value={editCustomBadge}
                        onChange={(e) => setEditCustomBadge(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs outline-none focus:border-[#F5C453]"
                      />
                    </div>
                  </div>

                  {/* Preset Buttons for Badges #1 to #9 */}
                  <div className="pt-1">
                    <label className="text-[10px] text-[#DFD0B0]/60 font-bold uppercase block mb-1">
                      Quick Grant Reserved VIP/Admin Badges (#1 to #9):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setEditBadgeNumber(num);
                            setEditRole('admin');
                            setEditCustomBadge(`🛡️ ADMIN #${num}`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black border transition-all ${
                            editBadgeNumber === num
                              ? 'bg-amber-500 text-black border-amber-300 shadow-md scale-105'
                              : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/15'
                          }`}
                        >
                          #{num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveUserModifications}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-[#52673A] hover:from-emerald-500 text-white text-xs font-bold border border-emerald-400 shadow-md flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Commit Permissions & Badge</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Users Search Bar */}
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/[0.03] border border-white/10">
                <Search className="w-4 h-4 text-[#DFD0B0]/60 ml-2" />
                <input
                  type="text"
                  placeholder="Search players by name, email, or UID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-white text-xs outline-none placeholder:text-white/30"
                />
              </div>

              {/* Users Table */}
              <div className="border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-white">
                    <thead className="bg-white/5 uppercase text-[10px] text-[#DFD0B0]/70 font-bold border-b border-white/10">
                      <tr>
                        <th className="p-3">Player / Identity</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Badge Number</th>
                        <th className="p-3">Rating / Respect</th>
                        <th className="p-3 text-right">Developer Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-[#DFD0B0]/60">
                            No registered player records found.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const isDevAccount = u.email?.toLowerCase() === 'qayssafty@gmail.com' || u.badgeNumber === 0;
                          const isAdminAccount = u.role === 'admin' || (u.badgeNumber !== undefined && u.badgeNumber >= 1 && u.badgeNumber <= 9);

                          return (
                            <tr key={u.uid} className="hover:bg-white/[0.03] transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={u.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=60'}
                                    alt={u.displayName}
                                    className="w-8 h-8 rounded-xl object-cover border border-white/20"
                                  />
                                  <div>
                                    <div className="font-black text-white flex items-center gap-1.5">
                                      <span>{u.displayName || 'Anonymous Warrior'}</span>
                                      {isDevAccount && (
                                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-400/40">
                                          👑 OWNER #0
                                        </span>
                                      )}
                                      {isAdminAccount && !isDevAccount && (
                                        <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-black border border-purple-400/40">
                                          🛡️ ADMIN
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-[#DFD0B0]/60 font-mono">
                                      {u.email || u.uid}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                  u.role === 'owner' ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' :
                                  u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border-purple-400/40' :
                                  u.role === 'grandmaster' ? 'bg-sky-500/20 text-sky-300 border-sky-400/40' :
                                  'bg-white/10 text-white/80 border-white/20'
                                }`}>
                                  {u.role || 'member'}
                                </span>
                              </td>

                              <td className="p-3 font-mono font-bold">
                                {u.badgeNumber === 0 ? (
                                  <span className="text-amber-400 font-black">👑 #0 (Founder)</span>
                                ) : u.badgeNumber !== undefined && u.badgeNumber >= 1 && u.badgeNumber <= 9 ? (
                                  <span className="text-purple-300 font-black">🛡️ #{u.badgeNumber} (VIP)</span>
                                ) : (
                                  <span className="text-sky-300">#{u.badgeNumber ?? 10}</span>
                                )}
                              </td>

                              <td className="p-3">
                                <span className="font-bold text-white">⚔️ {u.elo ?? 1200}</span>
                                <span className="text-[#DFD0B0]/60 ml-2">✊ {u.respectPoints ?? 100}</span>
                              </td>

                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {!isDevAccount && (
                                    <button
                                      onClick={() => handleQuickGrantAdmin(u, 1)}
                                      className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-[11px] font-bold transition-all"
                                    >
                                      🛡️ Grant Admin
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleSelectUserForEdit(u)}
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3 h-3 text-[#F5C453]" />
                                    <span>Edit</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: DYNAMIC "ABOUT US" CMS
              ======================================================== */}
          {activeTab === 'about_us_cms' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-5 rounded-3xl bg-[#111827] border border-[#1F293D] shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-[#1F293D] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">System Lore Engine</h3>
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">Dynamic About Us Editor</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSaveAboutUs}
                    disabled={isCmsSaving || !aboutUsData}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-[#F59E0B] rounded-xl text-black font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isCmsSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Publish Changes</span>
                  </button>
                </div>

                {!aboutUsData || isCmsLoading ? (
                  <div className="py-20 text-center space-y-3">
                    <RefreshCw className="w-10 h-10 text-amber-500/30 animate-spin mx-auto" />
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Hydrating CMS Schema...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Editor Side */}
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Primary Identity</h4>
                        <div className="space-y-3">
                           <input
                            type="text"
                            placeholder="App Name"
                            value={aboutUsData.appName}
                            onChange={(e) => setAboutUsData({...aboutUsData, appName: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl bg-[#0B0F19] border border-[#1F293D] text-white text-sm font-black focus:border-amber-500/50 outline-none transition-all"
                          />
                          <input
                            type="text"
                            placeholder="Tagline"
                            value={aboutUsData.tagline}
                            onChange={(e) => setAboutUsData({...aboutUsData, tagline: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl bg-[#0B0F19] border border-[#1F293D] text-slate-300 text-xs font-bold focus:border-amber-500/50 outline-none transition-all"
                          />
                          <input
                            type="text"
                            placeholder="Announcement Banner"
                            value={aboutUsData.announcementBanner || ""}
                            onChange={(e) => setAboutUsData({...aboutUsData, announcementBanner: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-500 text-xs font-bold focus:border-amber-500/50 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Story & Vision</h4>
                        <div className="space-y-3">
                          <textarea
                            placeholder="Founder's Note"
                            value={aboutUsData.founderNote}
                            onChange={(e) => setAboutUsData({...aboutUsData, founderNote: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl bg-[#0B0F19] border border-[#1F293D] text-slate-400 text-xs min-h-[80px] focus:border-amber-500/50 outline-none transition-all"
                          />
                          <textarea
                            placeholder="Vision Paragraphs (Separate with New Lines)"
                            value={aboutUsData.visionParagraphs}
                            onChange={(e) => setAboutUsData({...aboutUsData, visionParagraphs: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl bg-[#0B0F19] border border-[#1F293D] text-slate-400 text-xs min-h-[120px] focus:border-amber-500/50 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Credits & Socials</h4>
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Architectural Credits"
                            value={aboutUsData.credits}
                            onChange={(e) => setAboutUsData({...aboutUsData, credits: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl bg-[#0B0F19] border border-[#1F293D] text-slate-500 text-xs focus:border-amber-500/50 outline-none transition-all"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Discord URL"
                              value={aboutUsData.socialLinks.discord || ""}
                              onChange={(e) => setAboutUsData({...aboutUsData, socialLinks: {...aboutUsData.socialLinks, discord: e.target.value}})}
                              className="w-full px-4 py-2 rounded-xl bg-[#0B0F19] border border-[#1F293D] text-white text-[10px] font-mono focus:border-amber-500/50 outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Twitter URL"
                              value={aboutUsData.socialLinks.twitter || ""}
                              onChange={(e) => setAboutUsData({...aboutUsData, socialLinks: {...aboutUsData.socialLinks, twitter: e.target.value}})}
                              className="w-full px-4 py-2 rounded-xl bg-[#0B0F19] border border-[#1F293D] text-white text-[10px] font-mono focus:border-amber-500/50 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Preview Side */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Preview Context</h4>
                      <div className="rounded-3xl bg-[#0B0F19] border border-[#F59E0B]/20 p-6 shadow-2xl relative overflow-hidden pointer-events-none scale-[0.85] origin-top">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[60px] rounded-full" />
                        <div className="relative space-y-6">
                          <div className="text-center space-y-2">
                            <h2 className="text-2xl font-black text-white tracking-tighter italic">{aboutUsData.appName}</h2>
                            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                              {aboutUsData.tagline}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="p-3 border-l-2 border-amber-500 bg-amber-500/5 text-[10px] text-slate-400 italic">
                              {aboutUsData.founderNote}
                            </div>
                            <div className="text-slate-500 text-[10px] leading-relaxed line-clamp-3">
                              {aboutUsData.visionParagraphs}
                            </div>
                          </div>
                          <div className="pt-4 border-t border-[#1F293D] flex items-center justify-between">
                            <span className="text-[9px] font-mono text-slate-600 uppercase tracking-[0.2em]">CMS ACTIVE</span>
                            <div className="flex gap-2 text-slate-700">
                              <Globe size={14} />
                              <Heart size={14} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: SYSTEM MAINTENANCE
              ======================================================== */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Maintenance Sub-Tabs */}
              <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-[#111827] border border-[#1F293D]">
                <button
                  onClick={() => setMaintenanceSubTab('feedback')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    maintenanceSubTab === 'feedback' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  User Feedback
                </button>
                <button
                  onClick={() => setMaintenanceSubTab('database')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    maintenanceSubTab === 'database' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Cloud DB Explorer
                </button>
                <button
                  onClick={() => setMaintenanceSubTab('switcher')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    maintenanceSubTab === 'switcher' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Persona Switcher
                </button>
                <button
                  onClick={() => setMaintenanceSubTab('stickers')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    maintenanceSubTab === 'stickers' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Stickers
                </button>
              </div>

              {maintenanceSubTab === 'feedback' && (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                  {/* Feedback Inbox Content */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="text-xs text-[#DFD0B0]/80">
                      Total Submissions: <span className="font-bold text-white">{feedbacksList.length}</span> • Pending Review: <span className="font-bold text-amber-400">{feedbacksList.filter(f => f.status === 'pending').length}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(['all', 'pending', 'reviewed', 'resolved'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setFeedbackFilter(st)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                            feedbackFilter === st
                              ? 'bg-[#52673A] text-white border border-[#F5C453]/50'
                              : 'bg-white/5 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredFeedbacks.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/10 space-y-2 mt-4">
                      <MessageSquare className="w-8 h-8 mx-auto text-[#DFD0B0]/40" />
                      <p className="text-xs text-[#DFD0B0]/60">No feedback submissions found in this category.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-4">
                      {filteredFeedbacks.map((fb) => (
                        <div
                          key={fb.id}
                          className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-white">{fb.title}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                  fb.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                                  fb.status === 'reviewed' ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' :
                                  'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                                }`}>
                                  {fb.status}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/60 text-[10px] font-mono">
                                  {fb.category}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#DFD0B0]/70 mt-0.5">
                                From: <span className="font-bold text-white">{fb.userName}</span> {fb.userEmail ? `(${fb.userEmail})` : ''} • Badge: <span className="text-[#F5C453]">{fb.userBadge || 'Member'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < fb.rating ? 'fill-[#F5C453] text-[#F5C453]' : 'text-white/20'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Message Content */}
                          <p className="text-xs text-white/90 bg-black/30 p-3 rounded-xl border border-white/5 whitespace-pre-wrap">
                            {fb.message}
                          </p>

                          {/* Developer Note (if any) */}
                          {fb.developerNote && (
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                              <span className="font-black">👑 Developer Note:</span> {fb.developerNote}
                            </div>
                          )}

                          {/* Developer Status Actions */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
                            <div className="flex items-center gap-2 flex-1 max-w-sm">
                              <input
                                type="text"
                                placeholder="Add developer response note..."
                                value={replyNote[fb.id] || ''}
                                onChange={(e) => setReplyNote({ ...replyNote, [fb.id]: e.target.value })}
                                className="w-full px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-[11px] outline-none focus:border-[#F5C453]"
                              />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleUpdateFeedback(fb.id, 'reviewed')}
                                className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[11px] font-bold transition-all"
                              >
                                Mark Reviewed
                              </button>
                              <button
                                onClick={() => handleUpdateFeedback(fb.id, 'resolved')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all"
                              >
                                Mark Resolved
                              </button>
                              <button
                                onClick={() => handleDeleteFeedback(fb.id)}
                                className="p-1 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                                title="Delete Feedback"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {maintenanceSubTab === 'database' && (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                  <DatabaseView />
                </div>
              )}

              {maintenanceSubTab === 'switcher' && (
                <div className="animate-in fade-in zoom-in-95 duration-200 space-y-6">
                  {/* Stats Overrider */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#F5C453]">
                      Direct Rating & Honor Modifier
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-[#DFD0B0]/80 font-bold block mb-1">Select Target Player</label>
                        <select
                          value={targetUid}
                          onChange={(e) => {
                            const uid = e.target.value;
                            setTargetUid(uid);
                            const found = usersList.find(u => u.uid === uid);
                            if (found) handleSelectUserForEdit(found);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold outline-none focus:border-[#F5C453]"
                        >
                          <option value="">-- Choose User --</option>
                          {usersList.map(u => (
                            <option key={u.uid} value={u.uid} className="bg-[#161c12]">
                              {u.displayName || 'Warrior'} ({u.email || u.uid})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-[#DFD0B0]/80 font-bold block mb-1">ELO</label>
                          <input
                            type="number"
                            value={editElo}
                            onChange={(e) => setEditElo(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold outline-none focus:border-[#F5C453]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[#DFD0B0]/80 font-bold block mb-1">Respect</label>
                          <input
                            type="number"
                            value={editRespect}
                            onChange={(e) => setEditRespect(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold outline-none focus:border-[#F5C453]"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                       <button
                        onClick={handleSaveUserModifications}
                        disabled={!targetUid}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-black border border-amber-400/40 shadow-lg disabled:opacity-40"
                      >
                        Apply Stats Override
                      </button>
                    </div>
                  </div>

                  {/* Persona Switcher */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#F5C453]">
                      One-Click Persona Switcher
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Founder & Developer Persona */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 to-black/60 border border-amber-400/50 space-y-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={DEVELOPER_PROFILE_DEFAULT.photoURL!}
                            alt="Owner"
                            className="w-11 h-11 rounded-xl object-cover border-2 border-[#F5C453]"
                          />
                          <div>
                            <h4 className="text-sm font-black text-amber-300">q.brz (Founder)</h4>
                            <p className="text-[11px] text-[#DFD0B0]/70">OWNER #0</p>
                          </div>
                        </div>
                        <button
                          onClick={signInAsDeveloper}
                          className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-all shadow-lg shadow-amber-500/20"
                        >
                          Switch to Founder
                        </button>
                      </div>

                      {/* Celestial [sky] Persona */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/60 to-black/60 border border-sky-400/50 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(56,189,248,0.4)]">
                            🦋
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-sky-200">[sky] Account</h4>
                            <p className="text-[11px] text-sky-200/70">CELESTIAL IMMORTAL</p>
                          </div>
                        </div>
                        <button
                          onClick={signInAsSky}
                          className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs transition-all shadow-lg shadow-sky-500/20"
                        >
                          Switch to [sky]
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {maintenanceSubTab === 'stickers' && (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                  <StickerManager />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest">
              Security Protocol Level 4 Active
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-[#111827] border border-[#1F293D] text-slate-300 text-xs font-black uppercase tracking-widest hover:text-white hover:bg-[#1F293D] transition-all"
          >
            Exit Console
          </button>
        </div>
      </div>
    </div>
  );
};
