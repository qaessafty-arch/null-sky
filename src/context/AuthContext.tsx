import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  deleteUser,
  linkWithPopup,
  unlink,
  EmailAuthProvider,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  sendPasswordResetEmail,
  OAuthProvider,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../utils/firebase';
import { RespectLeaderboardEntry, UserRole, UserFeedback, UserPermissions } from '../types/chess';
import { getHonorRank } from '../utils/respectSystem';

export const DEVELOPER_EMAILS = [
  'qayssafty@gmail.com',
  'qaessafty@gmail.com',
  'dev@chessky.local',
  'sky@chessky.local'
];

export const SPECIAL_DEV_SKY_PASSWORD = '[q.brz]+[BLUEBERRY]';

export function isSpecialDevSkyPassword(input?: string): boolean {
  if (!input) return false;
  const trimmed = input.trim();
  if (trimmed === SPECIAL_DEV_SKY_PASSWORD) return true;
  const normalized = trimmed.toLowerCase().replace(/\s+/g, '');
  return (
    normalized === '[q.brz]+[blueberry]' ||
    normalized === 'q.brz+blueberry' ||
    normalized === '[q.brz][blueberry]' ||
    normalized === 'q.brzblueberry' ||
    normalized === '[q.brz]+blueberry' ||
    normalized === 'q.brz+[blueberry]'
  );
}

export const DEV_PASSKEYS = [
  SPECIAL_DEV_SKY_PASSWORD,
  'q.brz+BLUEBERRY',
  'q.brz+blueberry',
  '[q.brz]+[blueberry]',
  'q.brz',
  'qbrz',
  'qayssafty',
  'qaessafty',
  'peshmerga_dev',
  'founder#0',
  'QAESS_MASTER_2026',
  'dev2026'
];

export const PRESET_BADGES = [
  { id: 'founder_0', label: '👑 OWNER #0', role: 'owner' as UserRole, badgeNumber: 0, desc: 'Supreme Founder & Architect' },
  { id: 'sky_celestial', label: '🦋 CELESTIAL IMMORTAL', role: 'grandmaster' as UserRole, badgeNumber: 999, desc: 'Infinite Celestial Master' },
  { id: 'admin_1', label: '🛡️ CHIEF ADMIN #1', role: 'admin' as UserRole, badgeNumber: 1, desc: 'Supreme Security Sentinel' },
  { id: 'admin_vip', label: '🛡️ VIP ADMIN #2', role: 'admin' as UserRole, badgeNumber: 2, desc: 'Executive Realm Moderator' },
  { id: 'gm_sun', label: '☀️ SUPREME GRANDMASTER', role: 'grandmaster' as UserRole, badgeNumber: 7, desc: '21-Ray Kurdish Sun Bearer' },
  { id: 'mountain_lion', label: '⚔️ MOUNTAIN LION TACTICIAN', role: 'member' as UserRole, badgeNumber: 10, desc: 'Zagros Peak Conqueror' },
  { id: 'erbil_eagle', label: '🦅 ERBIL FORTRESS EAGLE', role: 'member' as UserRole, badgeNumber: 11, desc: 'Citadel Vanguard' },
  { id: 'citadel_diamond', label: '💎 CITADEL DIAMOND CHAMPION', role: 'grandmaster' as UserRole, badgeNumber: 12, desc: 'Forged in Diamond Precision' },
  { id: 'immortal_flame', label: '🔥 IMMORTAL FLAME GUARDIAN', role: 'member' as UserRole, badgeNumber: 15, desc: 'Everlasting Peshmerga Spirit' },
  { id: 'blitz_hawk', label: '⚡ BLITZ HAWK STRIKER', role: 'member' as UserRole, badgeNumber: 21, desc: 'Lightning Speed Grandmaster' },
  { id: 'ukh_chancellor', label: '🏰 UKH CITADEL CHANCELLOR', role: 'admin' as UserRole, badgeNumber: 3, desc: 'Chancellor of Kurdistan Hewlêr' }
];

export const PRESET_STATUSES = [
  '👑 Peshmerga Chess Architect & Master of the Realm',
  '🦋 Free as the azure wind, eternal infinite mastery.',
  '☀️ Defending the mountain passes with honor and glory.',
  '🛡️ Citadel Sentinel • Grandmaster of the Kurdish Sun',
  '⚔️ No friends but the mountains, no defeat on the board.',
  '🦅 Erbil Fortress Vanguard • Undefeated tactician',
  '💎 Mountain diamond forged under supreme pressure.',
  '🔥 Undying Peshmerga spirit on every square.',
  '⚡ Swift as lightning, calculated to the final endgame.',
  '🏰 Standing guard over the Citadel of Erbil.'
];

export interface UserProfileData {
  uid: string;
  displayName: string;
  username?: string;
  email: string | null;
  photoURL: string | null;
  country: string;
  flag: string;
  elo: number | string;
  respectPoints: number | string;
  executions: number | string;
  merciesGranted: number | string;
  gamesPlayed: number;
  wins: number;
  honorRank: string;
  rankBadge: string;
  role: UserRole;
  badgeNumber: number;
  customBadge?: string;
  customStatus?: string;
  isPublic?: boolean;
  isOwner?: boolean;
  isAdmin?: boolean;
  isDeveloper?: boolean;
  isGuest?: boolean;
  createdAt?: any;
  updatedAt?: any;
  permissions?: UserPermissions;
}

export function isSuperAdmin(profile: UserProfileData | null): boolean {
  if (!profile) return false;
  // Designated Developer/Owner UID or explicitly set role
  const SUPER_ADMIN_UIDS = ['developer_qayssafty_uid', 'U0X0X0X0X0X0X0X0X0X0X0X0X0X0']; 
  return (
    profile.role === 'super_admin' || 
    profile.role === 'owner' ||
    DEVELOPER_EMAILS.includes(profile.email || '') ||
    SUPER_ADMIN_UIDS.includes(profile.uid)
  );
}

interface AuthContextType {
  user: User | null;
  profile: UserProfileData | null;
  loading: boolean;
  isSkyAccount: boolean;
  isGuest: boolean;
  isDeveloper: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  devModeUnlocked: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInAsGuest: (guestName?: string, country?: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signInAsSky: (passkey?: string) => Promise<boolean>;
  signInAsDeveloper: () => Promise<void>;
  signInWithDeveloperPasskey: (key: string) => boolean;
  toggleDevModeUnlocked: (key?: string) => boolean;
  setOwnerBadgeAndStatus: (updates: { customBadge?: string; customStatus?: string; badgeNumber?: number;
  isPublic?: boolean; role?: UserRole }) => Promise<void>;
  signOut: () => Promise<void>;
  updateRespectMetrics: (delta: {
    respectPoints?: number;
    elo?: number;
    executions?: number;
    merciesGranted?: number;
    wins?: number;
    gamesPlayed?: number;
  }) => Promise<void>;
  updateProfileDetails: (details: { displayName?: string; username?: string; country?: string; flag?: string; customStatus?: string; photoURL?: string; customBadge?: string; badgeNumber?: number }) => Promise<void>;
  updateProfilePhoto: (photoURL: string) => Promise<void>;
  deleteAccount: (confirmText: string) => Promise<void>;
  linkProvider: (providerId: string) => Promise<void>;
  unlinkProvider: (providerId: string) => Promise<void>;
  updatePrivacy: (isPublic: boolean) => Promise<void>;
  syncWithCloudLeaderboard: (sortBy?: 'respect' | 'elo') => Promise<RespectLeaderboardEntry[]>;
  // Feedback Operations
  submitFeedback: (feedback: Omit<UserFeedback, 'id' | 'createdAt'>) => Promise<string>;
  getFeedbacksList: () => Promise<UserFeedback[]>;
  updateFeedbackStatus: (feedbackId: string, status: 'pending' | 'reviewed' | 'resolved', note?: string) => Promise<void>;
  deleteFeedbackItem: (feedbackId: string) => Promise<void>;
  // Dev & Admin Operations
  getAllUserProfiles: () => Promise<UserProfileData[]>;
  updateUserRoleAndBadge: (targetUid: string, updates: { role?: UserRole; badgeNumber?: number;
  isPublic?: boolean; customBadge?: string; customStatus?: string; elo?: number; respectPoints?: number }) => Promise<void>;
}

export const SKY_PROFILE_DEFAULT: UserProfileData = {
  uid: 'sky_celestial_account_uid',
  displayName: 'sky',
  username: 'sky',
  email: 'sky.celestial@chesskys.pro',
  photoURL: 'https://images.unsplash.com/photo-1557925923-cd4648e211a0?w=200&auto=format&fit=crop&q=80',
  country: 'Kurdistan / Sky Realm',
  flag: '🦋',
  elo: '∞ (Celestial)',
  respectPoints: '∞',
  executions: '∞',
  merciesGranted: '∞',
  gamesPlayed: 9999,
  wins: 9999,
  honorRank: 'CELESTIAL IMMORTAL 🦋',
  rankBadge: '🦋',
  role: 'grandmaster',
  badgeNumber: 999,
  customBadge: '🦋 CELESTIAL',
  customStatus: '🦋 Free as the azure wind, eternal infinite mastery.',
  isDeveloper: true,
  isOwner: true
};

export const DEVELOPER_PROFILE_DEFAULT: UserProfileData = {
  uid: 'developer_qayssafty_uid',
  displayName: 'q.brz',
  username: 'q.brz',
  email: 'qayssafty@gmail.com',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  country: 'Kurdistan',
  flag: '👑',
  elo: 3000,
  respectPoints: 5000,
  executions: 500,
  merciesGranted: 250,
  gamesPlayed: 800,
  wins: 750,
  honorRank: 'SUPREME OWNER & CREATOR 👑',
  rankBadge: '👑',
  role: 'owner',
  badgeNumber: 0,
  customBadge: '👑 FOUNDER #0',
  customStatus: '👑 Peshmerga Chess Architect & Master of the Realm',
  isOwner: true,
  isAdmin: true,
  isDeveloper: true
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSkyAccount, setIsSkyAccount] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [devModeUnlocked, setDevModeUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('chess_dev_unlocked') === 'true';
  });

  const isEmailDeveloper = (emailStr?: string | null) => {
    if (!emailStr) return false;
    const lower = emailStr.toLowerCase().trim();
    return DEVELOPER_EMAILS.some(e => e.toLowerCase() === lower);
  };

  const isValidDevKey = (key?: string) => {
    if (!key) return false;
    const cleanKey = key.trim().toLowerCase();
    return DEV_PASSKEYS.some(k => k.toLowerCase() === cleanKey);
  };

  const isDeveloper = isEmailDeveloper(user?.email) || 
                      isEmailDeveloper(profile?.email) || 
                      profile?.role === 'owner' || 
                      profile?.role === 'developer' || 
                      devModeUnlocked;

  const isOwner = isDeveloper || profile?.role === 'owner' || profile?.badgeNumber === 0;
  const isAdmin = isOwner || profile?.role === 'admin';
  const isSuperAdminValue = isSuperAdmin(profile);

  // Seed Sky and Dev profiles
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accountParam = params.get('account') || params.get('user') || params.get('login');
    const storedSky = localStorage.getItem('chess_active_account') === 'sky';
    const storedDev = localStorage.getItem('chess_active_account') === 'dev';
    const storedGuest = localStorage.getItem('chess_active_account') === 'guest';

    // Sky account is strictly restricted to developer/owner session
    const hasDevPrivilege = devModeUnlocked || storedDev;

    if ((accountParam?.toLowerCase() === 'sky' || storedSky) && hasDevPrivilege) {
      activateSkyProfile();
    } else if (accountParam?.toLowerCase() === 'dev' || storedDev) {
      activateDevProfile();
    } else if (storedGuest) {
      const savedGuest = localStorage.getItem('chess_guest_profile');
      if (savedGuest) {
        try {
          const parsed = JSON.parse(savedGuest);
          setProfile(parsed);
          setIsGuest(true);
        } catch {
          activateGuestProfile();
        }
      } else {
        activateGuestProfile();
      }
      setLoading(false);
    }

    const seedDefaultDocs = async () => {
      try {
        if (!auth.currentUser) return;
        const skyDocRef = doc(db, 'users', SKY_PROFILE_DEFAULT.uid);
        const skySnap = await getDoc(skyDocRef);
        if (!skySnap.exists()) {
          await setDoc(skyDocRef, {
            ...SKY_PROFILE_DEFAULT,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, 'users');
        // Silent catch for background seeding
      }
    };
    seedDefaultDocs();
  }, []);

  const activateSkyProfile = () => {
    setIsSkyAccount(true);
    setIsGuest(false);
    localStorage.setItem('chess_active_account', 'sky');
    const cachedSkyAvatar = localStorage.getItem('chess_sky_avatar');
    setProfile({
      ...SKY_PROFILE_DEFAULT,
      photoURL: cachedSkyAvatar || SKY_PROFILE_DEFAULT.photoURL
    });
    setLoading(false);
  };

  const activateDevProfile = () => {
    setIsSkyAccount(false);
    setIsGuest(false);
    localStorage.setItem('chess_active_account', 'dev');
    localStorage.setItem('chess_dev_unlocked', 'true');
    setDevModeUnlocked(true);
    const cachedDevAvatar = localStorage.getItem('chess_dev_avatar');
    setProfile({
      ...DEVELOPER_PROFILE_DEFAULT,
      photoURL: cachedDevAvatar || DEVELOPER_PROFILE_DEFAULT.photoURL
    });
    setLoading(false);
  };

  const activateGuestProfile = (customName?: string, customCountry?: string) => {
    setIsSkyAccount(false);
    setIsGuest(true);
    localStorage.setItem('chess_active_account', 'guest');

    const cachedGuest = localStorage.getItem('chess_guest_profile');
    let existingPhoto: string | null = null;
    if (cachedGuest) {
      try {
        const parsed = JSON.parse(cachedGuest);
        if (parsed.photoURL) existingPhoto = parsed.photoURL;
      } catch {}
    }

    const randId = Math.floor(100 + Math.random() * 900);
    const guestName = customName?.trim() || `Guest Peshmerga #${randId}`;
    const guestBadge = 10 + Math.floor(Math.random() * 50);

    const guestProf: UserProfileData = {
      uid: `guest_${Date.now()}_${randId}`,
      displayName: guestName,
      email: null,
      photoURL: existingPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60',
      country: customCountry || 'Kurdistan',
      flag: '☀️',
      elo: 1200,
      respectPoints: 100,
      executions: 0,
      merciesGranted: 0,
      gamesPlayed: 0,
      wins: 0,
      honorRank: 'Peshmerga Recruit',
      rankBadge: '🛡️',
      role: 'member',
      badgeNumber: guestBadge,
      customBadge: `#${guestBadge}`,
      customStatus: 'Exploring the chess battlefield as a guest warrior',
      isGuest: true
    };

    localStorage.setItem('chess_guest_profile', JSON.stringify(guestProf));
    setProfile(guestProf);
    setLoading(false);
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsSkyAccount(false);
        setIsGuest(false);
        localStorage.removeItem('chess_guest_profile');
        if (localStorage.getItem('chess_active_account') === 'sky') {
          localStorage.removeItem('chess_active_account');
        }

        const userDocRef = doc(db, 'users', currentUser.uid);
        const cachedUserAvatar = localStorage.getItem('chess_user_avatar_' + currentUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          const isDev = isEmailDeveloper(currentUser.email);

          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfileData;
            const rank = isDev 
              ? { title: 'SUPREME OWNER & CREATOR 👑', badge: '👑' }
              : getHonorRank(typeof data.respectPoints === 'number' ? data.respectPoints : 100);

            const effectiveRole = isDev ? 'owner' : (data.role || 'member');
            const effectiveBadgeNumber = isDev ? 0 : (data.badgeNumber !== undefined ? data.badgeNumber : 10);
            const effectivePhoto = data.photoURL || cachedUserAvatar || currentUser.photoURL || (isDev ? DEVELOPER_PROFILE_DEFAULT.photoURL : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60');

            const updatedProfile: UserProfileData = {
              ...data,
              photoURL: effectivePhoto,
              honorRank: rank.title,
              rankBadge: rank.badge,
              role: effectiveRole,
              badgeNumber: effectiveBadgeNumber,
              isOwner: isDev || effectiveRole === 'owner',
              isAdmin: isDev || effectiveRole === 'owner' || effectiveRole === 'admin',
              isDeveloper: isDev
            };

            if (effectivePhoto) {
              localStorage.setItem('chess_user_avatar_' + currentUser.uid, effectivePhoto);
            }

            setProfile(updatedProfile);
          } else {
            // New user registration - calculate badge number
            const isDev = isEmailDeveloper(currentUser.email);
            const rank = isDev 
              ? { title: 'SUPREME OWNER & CREATOR 👑', badge: '👑' }
              : getHonorRank(100);

            // Assign badge number: 0 for developer/owner, otherwise sequential badge #10+
            let assignedBadgeNumber = 10;
            if (isDev) {
              assignedBadgeNumber = 0;
            } else {
              try {
                const usersCountSnap = await getDocs(collection(db, 'users'));
                assignedBadgeNumber = 10 + Math.max(0, usersCountSnap.size - 2);
              } catch {
                assignedBadgeNumber = 10 + Math.floor(Math.random() * 20);
              }
            }

            const initialPhoto = currentUser.photoURL || cachedUserAvatar || (isDev ? DEVELOPER_PROFILE_DEFAULT.photoURL : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60');

            const newProfile: UserProfileData = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || (isDev ? 'q.brz' : 'Peshmerga Warrior'),
              email: currentUser.email || null,
              photoURL: initialPhoto,
              country: 'Kurdistan',
              flag: isDev ? '👑' : '☀️',
              elo: isDev ? 3000 : 800,
              respectPoints: isDev ? 5000 : 100,
              executions: isDev ? 500 : 0,
              merciesGranted: isDev ? 250 : 0,
              gamesPlayed: isDev ? 800 : 0,
              wins: isDev ? 750 : 0,
              honorRank: rank.title,
              rankBadge: rank.badge,
              role: isDev ? 'owner' : 'member',
              badgeNumber: assignedBadgeNumber,
              customBadge: isDev ? '👑 FOUNDER #0' : `#${assignedBadgeNumber}`,
              customStatus: isDev ? '👑 Peshmerga Chess Architect & Master of the Realm' : 'Defending the mountain passes with honor',
              isOwner: isDev,
              isAdmin: isDev,
              isDeveloper: isDev,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };

            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (err: any) {
          handleFirestoreError(err, OperationType.GET, 'users');
          console.warn('Firestore user profile fetch notice (operating with resilient profile):', err);
          const isDev = isEmailDeveloper(currentUser.email);
          const rank = isDev 
            ? { title: 'SUPREME OWNER & CREATOR 👑', badge: '👑' }
            : getHonorRank(100);
          
          const fallbackProfile: UserProfileData = {
            uid: currentUser.uid,
            displayName: currentUser.displayName || (isDev ? 'q.brz' : 'Peshmerga Warrior'),
            email: currentUser.email || null,
            photoURL: currentUser.photoURL || cachedUserAvatar || (isDev ? DEVELOPER_PROFILE_DEFAULT.photoURL : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'),
            country: 'Kurdistan',
            flag: isDev ? '👑' : '☀️',
            elo: isDev ? 3000 : 1200,
            respectPoints: isDev ? 5000 : 100,
            executions: isDev ? 500 : 0,
            merciesGranted: isDev ? 250 : 0,
            gamesPlayed: 0,
            wins: 0,
            honorRank: rank.title,
            rankBadge: rank.badge,
            role: isDev ? 'owner' : 'member',
            badgeNumber: isDev ? 0 : 10,
            customBadge: isDev ? '👑 FOUNDER #0' : '#10',
            customStatus: isDev ? '👑 Peshmerga Chess Architect' : 'Defending the realm with honor',
            isOwner: isDev,
            isAdmin: isDev,
            isDeveloper: isDev
          };
          setProfile(fallbackProfile);
        }
      } else {
        const storedAct = localStorage.getItem('chess_active_account');
        if (storedAct === 'sky' && (devModeUnlocked || isDeveloper)) {
          activateSkyProfile();
        } else if (storedAct === 'dev') {
          activateDevProfile();
        } else if (storedAct === 'guest') {
          const savedGuest = localStorage.getItem('chess_guest_profile');
          if (savedGuest) {
            try {
              setProfile(JSON.parse(savedGuest));
              setIsGuest(true);
            } catch {
              setProfile(null);
            }
          }
        } else {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setIsSkyAccount(false);
      setIsGuest(false);
      localStorage.removeItem('chess_active_account');
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user') {
        // Silent catch for user cancellation to prevent console noise and unhandled rejections
        return;
      }
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  };

  const signInWithApple = async () => {
    try {
      setIsSkyAccount(false);
      setIsGuest(false);
      localStorage.removeItem('chess_active_account');
      const appleProvider = new OAuthProvider('apple.com');
      appleProvider.addScope('email');
      appleProvider.addScope('name');
      await signInWithPopup(auth, appleProvider);
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user') {
        // Silent catch for user cancellation
        return;
      }
      console.warn('Apple Sign-In note:', error);
      // Fallback guest activation if Apple ID provider not configured in project console
      activateGuestProfile('Apple Player', 'Kurdistan');
    }
  };

  const signInAsGuest = async (guestName?: string, country?: string) => {
    try {
      if (user) {
        await firebaseSignOut(auth);
      }
      activateGuestProfile(guestName, country);
    } catch (e) {
      console.warn('Guest login notice:', e);
      activateGuestProfile(guestName, country);
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid email address.');
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error: any) {
      console.warn('Password reset notice:', error);
      // Friendly simulation if email is not yet registered in Firebase auth
      if (error?.code === 'auth/user-not-found') {
        throw new Error('No registered account was found with this email.');
      }
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const cleanId = email.trim().toLowerCase();
    
    // Map custom usernames to actual dev emails
    let targetEmail = email.trim();
    let isDevLogin = false;
    
    if (cleanId === 'dev') {
      targetEmail = 'dev@chessky.local';
      isDevLogin = true;
    } else if (cleanId === 'sky' || cleanId === 'sky one') {
      targetEmail = 'sky@chessky.local';
      isDevLogin = true;
    }

    try {
      setIsSkyAccount(false);
      setIsGuest(false);
      localStorage.removeItem('chess_active_account');
      await signInWithEmailAndPassword(auth, targetEmail, pass);
    } catch (error: any) {
      console.warn('Firebase email login notice:', error);
      // Auto-create dev accounts if they don't exist yet
      if (isDevLogin && (error?.code === 'auth/invalid-credential' || error?.code === 'auth/user-not-found')) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, targetEmail, pass);
          if (userCredential.user) {
            await firebaseUpdateProfile(userCredential.user, { displayName: cleanId === 'dev' ? 'dev' : 'sky' });
            // Save admin role in Firestore so security rules can grant access
            const userDocRef = doc(db, 'users', userCredential.user.uid);
            await setDoc(userDocRef, {
              uid: userCredential.user.uid,
              displayName: cleanId === 'dev' ? 'dev' : 'sky',
              username: cleanId === 'dev' ? 'dev' : 'sky',
              email: targetEmail,
              role: cleanId === 'dev' ? 'owner' : 'admin',
              isDeveloper: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
          return;
        } catch (createErr) {
          console.error('Failed to auto-create dev account', createErr);
          throw createErr;
        }
      }
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName?: string) => {
    try {
      setIsSkyAccount(false);
      setIsGuest(false);
      localStorage.removeItem('chess_active_account');
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (displayName && userCredential.user) {
        await firebaseUpdateProfile(userCredential.user, { displayName });
      }
    } catch (error: any) {
      console.warn('Firebase email signup notice:', error);
      if (isEmailDeveloper(email)) {
        if (isSpecialDevSkyPassword(pass)) {
          activateDevProfile();
          return;
        }
      }
      throw error;
    }
  };

  const signInAsSky = async (passkey?: string): Promise<boolean> => {
    // If passkey provided, enforce special password
    if (passkey) {
      if (isSpecialDevSkyPassword(passkey) || isValidDevKey(passkey)) {
        if (user) {
          try { await firebaseSignOut(auth); } catch {}
        }
        activateSkyProfile();
        return true;
      }
      throw new Error('Access Denied: The Celestial [sky] account requires its special and only password [q.brz]+[BLUEBERRY].');
    }

    // Only Developer & Founder can switch to Sky without passkey
    const isAuthorized = isDeveloper || isOwner || devModeUnlocked;
    if (!isAuthorized) {
      throw new Error('Access Denied: The Celestial [sky] account requires its special and only password [q.brz]+[BLUEBERRY].');
    }

    try {
      if (user) {
        await firebaseSignOut(auth);
      }
      activateSkyProfile();
      return true;
    } catch (error: any) {
      console.error('Sky login failed:', error);
      return false;
    }
  };

  const signInAsDeveloper = async () => {
    try {
      if (user) {
        await firebaseSignOut(auth);
      }
      activateDevProfile();
    } catch (error: any) {
      console.error('Developer login failed:', error);
    }
  };

  const signInWithDeveloperPasskey = (key: string): boolean => {
    if (isSpecialDevSkyPassword(key) || isValidDevKey(key)) {
      activateDevProfile();
      return true;
    }
    return false;
  };

  const toggleDevModeUnlocked = (key?: string): boolean => {
    if (devModeUnlocked) {
      setDevModeUnlocked(false);
      localStorage.removeItem('chess_dev_unlocked');
      return false;
    }
    if (!key || isValidDevKey(key)) {
      setDevModeUnlocked(true);
      localStorage.setItem('chess_dev_unlocked', 'true');
      return true;
    }
    return false;
  };

  const setOwnerBadgeAndStatus = async (updates: {
    customBadge?: string;
    customStatus?: string;
    badgeNumber?: number;
  isPublic?: boolean;
    role?: UserRole;
  }) => {
    if (!profile) return;
    const targetUid = profile.uid;
    const updated = {
      ...profile,
      ...updates
    };
    setProfile(updated);

    if (profile.isGuest) {
      localStorage.setItem('chess_guest_profile', JSON.stringify(updated));
    }

    try {
      const userDocRef = doc(db, 'users', targetUid);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, 'users');
      console.warn('Owner badge/status cloud sync notice:', e);
    }
  };

  const deleteAccount = async (confirmText: string) => {
    if (confirmText !== 'DELETE') throw new Error('Confirmation text did not match');
    if (!auth.currentUser) throw new Error('Not logged in');
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' });
      await deleteDoc(doc(db, 'users', auth.currentUser.uid));
      await deleteUser(auth.currentUser);
      setUser(null);
      setProfile(null);
    } catch (err) {
      throw err;
    }
  };

  const linkProvider = async (providerId: string) => {
    if (!auth.currentUser) return;
    try {
      const provider = providerId === 'google.com' ? googleProvider : new OAuthProvider(providerId);
      await linkWithPopup(auth.currentUser, provider);
    } catch (err) {
      throw err;
    }
  };

  const unlinkProvider = async (providerId: string) => {
    if (!auth.currentUser) return;
    try {
      await unlink(auth.currentUser, providerId);
    } catch (err) {
      throw err;
    }
  };

  const updatePrivacy = async (isPublic: boolean) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { isPublic });
      if (profile) setProfile({ ...profile, isPublic });
    } catch (err) {
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' });
    } catch (err) {
      console.warn('Session logout failed', err);
    }
    await firebaseSignOut(auth);
  };

  const updateRespectMetrics = async (delta: {
    respectPoints?: number;
    elo?: number;
    executions?: number;
    merciesGranted?: number;
    wins?: number;
    gamesPlayed?: number;
  }) => {
    if (!profile) return;
    if (isSkyAccount) return; // Celestial stats remain infinite

    const targetUid = profile.uid;
    const currentRespect = typeof profile.respectPoints === 'number' ? profile.respectPoints : 100;
    const currentElo = typeof profile.elo === 'number' ? profile.elo : 1200;
    const currentExecutions = typeof profile.executions === 'number' ? profile.executions : 0;
    const currentMercies = typeof profile.merciesGranted === 'number' ? profile.merciesGranted : 0;

    const newRespect = Math.max(0, currentRespect + (delta.respectPoints || 0));
    const newElo = Math.max(100, currentElo + (delta.elo || 0));
    const newExecutions = currentExecutions + (delta.executions || 0);
    const newMercies = currentMercies + (delta.merciesGranted || 0);
    const newWins = (profile.wins || 0) + (delta.wins || 0);
    const newGames = (profile.gamesPlayed || 0) + (delta.gamesPlayed || 0);

    const rank = profile.isOwner 
      ? { title: 'SUPREME OWNER & CREATOR 👑', badge: '👑' } 
      : getHonorRank(newRespect);

    const updatedProfile: UserProfileData = {
      ...profile,
      respectPoints: newRespect,
      elo: newElo,
      executions: newExecutions,
      merciesGranted: newMercies,
      wins: newWins,
      gamesPlayed: newGames,
      honorRank: rank.title,
      rankBadge: rank.badge
    };

    setProfile(updatedProfile);

    if (profile.isGuest) {
      localStorage.setItem('chess_guest_profile', JSON.stringify(updatedProfile));
    }

    try {
      const userDocRef = doc(db, 'users', targetUid);
      await updateDoc(userDocRef, {
        respectPoints: newRespect,
        elo: newElo,
        executions: newExecutions,
        merciesGranted: newMercies,
        wins: newWins,
        gamesPlayed: newGames,
        honorRank: rank.title,
        rankBadge: rank.badge,
        updatedAt: serverTimestamp()
      });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, 'users');
      console.warn('Profile metric sync notice:', e);
    }
  };

  const updateProfileDetails = async (details: {
    displayName?: string;
    country?: string;
    flag?: string;
    customStatus?: string;
    photoURL?: string;
    customBadge?: string;
    badgeNumber?: number;
  isPublic?: boolean;
  }) => {
    if (!profile) return;
    const targetUid = profile.uid;

    const updated = {
      ...profile,
      ...details
    };
    setProfile(updated);

    // Save avatar to persistent caches
    if (details.photoURL) {
      localStorage.setItem('chess_user_avatar_' + targetUid, details.photoURL);
      localStorage.setItem('chess_current_avatar', details.photoURL);
      if (isSkyAccount || targetUid === SKY_PROFILE_DEFAULT.uid) {
        localStorage.setItem('chess_sky_avatar', details.photoURL);
      }
      if (isDeveloper || targetUid === DEVELOPER_PROFILE_DEFAULT.uid) {
        localStorage.setItem('chess_dev_avatar', details.photoURL);
      }
      if (auth.currentUser) {
        try {
          await firebaseUpdateProfile(auth.currentUser, {
            photoURL: details.photoURL,
            ...(details.displayName ? { displayName: details.displayName } : {})
          });
        } catch (authErr) {
          console.warn('Firebase Auth photoURL update notice:', authErr);
        }
      }
    }

    if (profile.isGuest) {
      localStorage.setItem('chess_guest_profile', JSON.stringify(updated));
    }

    try {
      const userDocRef = doc(db, 'users', targetUid);
      await setDoc(userDocRef, {
        ...details,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, 'users');
      console.warn('Profile detail update notice:', e);
    }
  };

  const updateProfilePhoto = async (photoURL: string) => {
    if (!photoURL) return;
    await updateProfileDetails({ photoURL });
  };

  const syncWithCloudLeaderboard = async (sortBy: 'respect' | 'elo' = 'respect'): Promise<RespectLeaderboardEntry[]> => {
    try {
      const orderField = sortBy === 'elo' ? 'elo' : 'respectPoints';
      const q = query(collection(db, 'users'), orderBy(orderField, 'desc'), limit(50));
      const querySnap = await getDocs(q);
      const cloudEntries: RespectLeaderboardEntry[] = [];

      let index = 0;
      querySnap.forEach((docSnap) => {
        const d = docSnap.data() as UserProfileData;
        const currentActiveUid = profile?.uid;
        cloudEntries.push({
          id: d.uid,
          rank: index + 3,
          username: d.displayName || 'Peshmerga Tactician',
          title: d.uid === SKY_PROFILE_DEFAULT.uid ? 'CELESTIAL IMMORTAL 🦋' : (d.honorRank || undefined),
          country: d.country || 'Kurdistan',
          flag: d.flag || '☀️',
          respectPoints: d.respectPoints,
          elo: d.elo,
          executions: d.executions,
          mercies: d.merciesGranted,
          avatar: d.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60',
          isCurrentUser: currentActiveUid ? d.uid === currentActiveUid : false,
          role: d.role,
          badgeNumber: d.badgeNumber,
          badgeTag: d.role === 'owner' ? '👑 OWNER #0' : (d.role === 'admin' ? `🛡️ ADMIN #${d.badgeNumber}` : undefined)
        });
        index++;
      });

      return cloudEntries;
    } catch (e) {
      console.warn('Cloud leaderboard fallback:', e);
      return [];
    }
  };

  // Feedback Operations
  const submitFeedback = async (fbData: Omit<UserFeedback, 'id' | 'createdAt'>): Promise<string> => {
    const feedbackDoc = {
      ...fbData,
      userId: profile?.uid || 'guest',
      userEmail: profile?.email || fbData.userEmail || null,
      userName: profile?.displayName || fbData.userName || 'Anonymous Warrior',
      userBadge: profile?.badgeNumber !== undefined ? `#${profile.badgeNumber}` : 'Guest',
      status: 'pending',
      createdAt: serverTimestamp()
    };

    try {
      const docRef = await addDoc(collection(db, 'feedbacks'), feedbackDoc);
      // Save local backup copy for offline reliability
      const localFeedbacks = JSON.parse(localStorage.getItem('chess_user_feedbacks') || '[]');
      localFeedbacks.unshift({ ...feedbackDoc, id: docRef.id, createdAt: new Date().toISOString() });
      localStorage.setItem('chess_user_feedbacks', JSON.stringify(localFeedbacks));
      return docRef.id;
    } catch (err) {
      console.warn('Firestore feedback submission fallback to local:', err);
      const fallbackId = `fb-${Date.now()}`;
      const localFeedbacks = JSON.parse(localStorage.getItem('chess_user_feedbacks') || '[]');
      localFeedbacks.unshift({ ...feedbackDoc, id: fallbackId, createdAt: new Date().toISOString() });
      localStorage.setItem('chess_user_feedbacks', JSON.stringify(localFeedbacks));
      return fallbackId;
    }
  };

  const getFeedbacksList = async (): Promise<UserFeedback[]> => {
    try {
      const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'), limit(100));
      const querySnap = await getDocs(q);
      const list: UserFeedback[] = [];
      querySnap.forEach(docSnap => {
        list.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<UserFeedback, 'id'>)
        });
      });
      if (list.length > 0) return list;
    } catch (e) {
      console.warn('Cloud feedback retrieval notice:', e);
    }
    // Fallback to local storage
    return JSON.parse(localStorage.getItem('chess_user_feedbacks') || '[]');
  };

  const updateFeedbackStatus = async (feedbackId: string, status: 'pending' | 'reviewed' | 'resolved', note?: string) => {
    try {
      const fbRef = doc(db, 'feedbacks', feedbackId);
      await updateDoc(fbRef, {
        status,
        ...(note ? { developerNote: note } : {}),
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Cloud feedback status update:', e);
    }
    // Also update local list
    const localFeedbacks: UserFeedback[] = JSON.parse(localStorage.getItem('chess_user_feedbacks') || '[]');
    const updated = localFeedbacks.map(f => f.id === feedbackId ? { ...f, status, developerNote: note || f.developerNote } : f);
    localStorage.setItem('chess_user_feedbacks', JSON.stringify(updated));
  };

  const deleteFeedbackItem = async (feedbackId: string) => {
    try {
      const fbRef = doc(db, 'feedbacks', feedbackId);
      await deleteDoc(fbRef);
    } catch (e) {
      console.warn('Cloud feedback delete:', e);
    }
    const localFeedbacks: UserFeedback[] = JSON.parse(localStorage.getItem('chess_user_feedbacks') || '[]');
    const filtered = localFeedbacks.filter(f => f.id !== feedbackId);
    localStorage.setItem('chess_user_feedbacks', JSON.stringify(filtered));
  };

  // Developer & Admin Operations
  const getAllUserProfiles = async (): Promise<UserProfileData[]> => {
    try {
      const q = query(collection(db, 'users'), limit(100));
      const querySnap = await getDocs(q);
      const list: UserProfileData[] = [];
      querySnap.forEach(docSnap => {
        list.push(docSnap.data() as UserProfileData);
      });
      return list;
    } catch (e) {
      console.warn('Get all users cloud fallback:', e);
      return [
        DEVELOPER_PROFILE_DEFAULT,
        SKY_PROFILE_DEFAULT,
        ...(profile ? [profile] : [])
      ];
    }
  };

  const updateUserRoleAndBadge = async (
    targetUid: string, 
    updates: { 
      role?: UserRole; 
      badgeNumber?: number;
  isPublic?: boolean; 
      customBadge?: string; 
      customStatus?: string; 
      elo?: number; 
      respectPoints?: number;
    }
  ) => {
    try {
      const userRef = doc(db, 'users', targetUid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Update user role/badge cloud fallback:', e);
    }

    if (profile && profile.uid === targetUid) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isSkyAccount,
        isGuest,
        isDeveloper,
        isOwner,
        isAdmin,
        isSuperAdmin: isSuperAdminValue,
        devModeUnlocked,
        signInWithGoogle,
        signInWithApple,
        signInAsGuest,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        signInAsSky,
        signInAsDeveloper,
        signInWithDeveloperPasskey,
        toggleDevModeUnlocked,
        setOwnerBadgeAndStatus,
        signOut,
        updateRespectMetrics,
        updateProfileDetails,
        updateProfilePhoto,
        deleteAccount,
        linkProvider,
        unlinkProvider,
        updatePrivacy,
        syncWithCloudLeaderboard,
        submitFeedback,
        getFeedbacksList,
        updateFeedbackStatus,
        deleteFeedbackItem,
        getAllUserProfiles,
        updateUserRoleAndBadge
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

