import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocFromServer,
  query,
  orderBy
} from 'firebase/firestore';
import { DispatchLog, WorkerMaster, ClientSiteMaster, OfficeSettings } from './types';
import { DEFAULT_OFFICE_SETTINGS, INITIAL_DISPATCH_LOGS, INITIAL_WORKERS, INITIAL_CLIENTS } from './constants/defaultData';

export const firebaseConfig = {
  apiKey: "AIzaSyA9nFlpvct-o2F48Ow1WLozSsORrWd4YJI",
  authDomain: "dangchat.firebaseapp.com",
  projectId: "dangchat",
  storageBucket: "dangchat.firebasestorage.app",
  messagingSenderId: "260697349202",
  appId: "1:260697349202:web:fdeb3c7aba87b87d33138b"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const googleProvider = new GoogleAuthProvider();

// Test Connection Helper
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'test'));
    return true;
  } catch (err) {
    console.warn('Firestore server connection check:', err);
    return false;
  }
}

// Local Storage Fallback Keys
const STORAGE_KEYS = {
  LOGS: 'jeolmeun_dispatch_logs_v1',
  WORKERS: 'jeolmeun_workers_v1',
  CLIENTS: 'jeolmeun_clients_v1',
  OFFICE: 'jeolmeun_office_settings_v1',
};

// Local storage helpers
export function getLocalData<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    console.error('LocalStorage read error:', e);
    return defaultVal;
  }
}

export function setLocalData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

// Initialize seed data if LocalStorage is empty
export function initLocalData() {
  if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
    setLocalData(STORAGE_KEYS.LOGS, INITIAL_DISPATCH_LOGS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.WORKERS)) {
    setLocalData(STORAGE_KEYS.WORKERS, INITIAL_WORKERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
    setLocalData(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.OFFICE)) {
    setLocalData(STORAGE_KEYS.OFFICE, DEFAULT_OFFICE_SETTINGS);
  }
}

// Firebase Auth Helpers
export async function loginWithGoogle(): Promise<User | null> {
  try {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Auth Error:', error);
    throw error;
  }
}

export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Signout Error:', error);
  }
}

export { onAuthStateChanged, type User };
