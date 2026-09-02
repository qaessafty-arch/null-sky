// src/firebase.ts - Singleton Firebase instance with fallback & offline persistence
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  enableIndexedDbPersistence,
  Firestore 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Try loading from environment variables, fallback to local applet config if present
const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let config = envConfig;

// If envConfig is missing apiKey in development, attempt dynamic import fallback
if (!config.apiKey) {
  try {
    // Dynamic check or fallback
    config = {
      apiKey: envConfig.apiKey || "AIzaSyMockKeyForDevOnly_1234567890",
      authDomain: envConfig.authDomain || "chesskys-pro.firebaseapp.com",
      projectId: envConfig.projectId || "ai-studio-chesskyspro-81bf19f6-839d-4d8e-8c71-e9af0de56150",
      storageBucket: envConfig.storageBucket || "chesskys-pro.appspot.com",
      messagingSenderId: envConfig.messagingSenderId || "834574229097",
      appId: envConfig.appId || "1:834574229097:web:96e25544482c3c9780cb03"
    };
  } catch {
    // Keep env config
  }
}

// Singleton pattern: initialize only once
export const app = getApps().length === 0 ? initializeApp(config) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);

// Initialize Firestore with robust connection fallback
let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch {
  dbInstance = getFirestore(app);
}

export const db = dbInstance;

// Enable Offline IndexedDb Persistence safely
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('[Firebase] Multiple tabs open; persistence enabled in first tab only.');
    } else if (err.code === 'unimplemented') {
      console.warn('[Firebase] Current browser does not support IndexedDB persistence.');
    } else {
      console.debug('[Firebase] Persistence status:', err.message);
    }
  });
}

export default { app, auth, db, storage };
