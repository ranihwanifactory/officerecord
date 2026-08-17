import { 
  collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, query, orderBy 
} from 'firebase/firestore';
import { db, getLocalData, setLocalData, initLocalData } from '../firebase';
import { DispatchLog, WorkerMaster, ClientSiteMaster, OfficeSettings } from '../types';
import { DEFAULT_OFFICE_SETTINGS, DEFAULT_OFFICE_PROFILES, INITIAL_DISPATCH_LOGS, INITIAL_WORKERS, INITIAL_CLIENTS } from '../constants/defaultData';

const KEYS = {
  LOGS: 'jeolmeun_dispatch_logs_v1',
  WORKERS: 'jeolmeun_workers_v1',
  CLIENTS: 'jeolmeun_clients_v1',
  OFFICE: 'jeolmeun_office_settings_v1',
  OFFICE_PROFILES: 'jeolmeun_office_profiles_v2',
  ACTIVE_OFFICE_ID: 'jeolmeun_active_office_id_v2',
};

// Initialize default local storage
initLocalData();

/**
 * In-memory listener registries for zero-latency instant UI updates.
 * Whenever any write, edit, or delete happens, all listeners across the app
 * are immediately and synchronously invoked with the latest dataset.
 */
let logsListeners: ((logs: DispatchLog[]) => void)[] = [];
let workersListeners: ((workers: WorkerMaster[]) => void)[] = [];
let clientsListeners: ((clients: ClientSiteMaster[]) => void)[] = [];
let officeProfilesListeners: ((profiles: OfficeSettings[], activeId: string) => void)[] = [];
let officeSettingsListeners: ((settings: OfficeSettings) => void)[] = [];
let activeOfficeListeners: ((id: string) => void)[] = [];

function dispatchDataChangeEvent(type: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('jeolmeun-data-change', { detail: { type } }));
  }
}

function notifyLogsListeners(logs: DispatchLog[]) {
  logsListeners.forEach((cb) => {
    try { cb(logs); } catch (e) { console.error('logs listener error:', e); }
  });
  dispatchDataChangeEvent('logs');
}

function notifyWorkersListeners(workers: WorkerMaster[]) {
  workersListeners.forEach((cb) => {
    try { cb(workers); } catch (e) { console.error('workers listener error:', e); }
  });
  dispatchDataChangeEvent('workers');
}

function notifyClientsListeners(clients: ClientSiteMaster[]) {
  clientsListeners.forEach((cb) => {
    try { cb(clients); } catch (e) { console.error('clients listener error:', e); }
  });
  dispatchDataChangeEvent('clients');
}

function notifyOfficeProfilesListeners(profiles: OfficeSettings[], activeId: string) {
  officeProfilesListeners.forEach((cb) => {
    try { cb(profiles, activeId); } catch (e) { console.error('profiles listener error:', e); }
  });
  const active = profiles.find((p) => p.id === activeId) || profiles.find((p) => p.isDefault) || profiles[0] || DEFAULT_OFFICE_SETTINGS;
  officeSettingsListeners.forEach((cb) => {
    try { cb(active); } catch (e) { console.error('settings listener error:', e); }
  });
  dispatchDataChangeEvent('office_profiles');
}

function notifyActiveOfficeListeners(id: string) {
  activeOfficeListeners.forEach((cb) => {
    try { cb(id); } catch (e) { console.error('activeOffice listener error:', e); }
  });
  const profiles = getLocalData<OfficeSettings[]>(KEYS.OFFICE_PROFILES, DEFAULT_OFFICE_PROFILES);
  notifyOfficeProfilesListeners(profiles, id);
}

// Cross-tab and window event listener for instant multi-window synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!e.key) return;
    if (e.key === KEYS.LOGS) {
      const logs = getLocalData<DispatchLog[]>(KEYS.LOGS, INITIAL_DISPATCH_LOGS);
      notifyLogsListeners(logs);
    } else if (e.key === KEYS.WORKERS) {
      const workers = getLocalData<WorkerMaster[]>(KEYS.WORKERS, INITIAL_WORKERS);
      notifyWorkersListeners(workers);
    } else if (e.key === KEYS.CLIENTS) {
      const clients = getLocalData<ClientSiteMaster[]>(KEYS.CLIENTS, INITIAL_CLIENTS);
      notifyClientsListeners(clients);
    } else if (e.key === KEYS.OFFICE_PROFILES || e.key === KEYS.OFFICE) {
      const profiles = getLocalData<OfficeSettings[]>(KEYS.OFFICE_PROFILES, DEFAULT_OFFICE_PROFILES);
      notifyOfficeProfilesListeners(profiles, getActiveOfficeProfileId());
    } else if (e.key === KEYS.ACTIVE_OFFICE_ID) {
      const activeId = getActiveOfficeId();
      notifyActiveOfficeListeners(activeId);
    }
  });
}

/**
 * Recursively removes undefined fields from objects before saving to Firestore.
 * Firestore throws an error if any field is `undefined`.
 */
function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  return JSON.parse(JSON.stringify(data));
}

// Dispatch Logs
export function subscribeDispatchLogs(onUpdate: (logs: DispatchLog[]) => void): () => void {
  const localLogs = getLocalData<DispatchLog[]>(KEYS.LOGS, INITIAL_DISPATCH_LOGS);
  onUpdate(localLogs);
  logsListeners.push(onUpdate);

  let unsubscribeFirestore: () => void = () => {};

  try {
    const q = query(collection(db, 'dispatch_logs'), orderBy('date', 'desc'));
    unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreLogs: DispatchLog[] = [];
        snapshot.forEach((docSnap) => {
          firestoreLogs.push({ id: docSnap.id, ...docSnap.data() } as DispatchLog);
        });
        setLocalData(KEYS.LOGS, firestoreLogs);
        notifyLogsListeners(firestoreLogs);
      }
    }, (error) => {
      console.warn('Firestore logs snapshot error (using local cache):', error);
    });
  } catch (err) {
    console.warn('Firestore subscription unavailable:', err);
  }

  return () => {
    logsListeners = logsListeners.filter((cb) => cb !== onUpdate);
    unsubscribeFirestore();
  };
}

export async function saveDispatchLog(log: DispatchLog): Promise<void> {
  // 1. Instant local update and synchronous UI broadcast
  const currentLogs = getLocalData<DispatchLog[]>(KEYS.LOGS, INITIAL_DISPATCH_LOGS);
  const existingIdx = currentLogs.findIndex((l) => l.id === log.id);
  let updatedLogs: DispatchLog[];
  if (existingIdx >= 0) {
    updatedLogs = [...currentLogs];
    updatedLogs[existingIdx] = log;
  } else {
    updatedLogs = [log, ...currentLogs];
  }
  // Sort by date desc
  updatedLogs.sort((a, b) => b.date.localeCompare(a.date));
  setLocalData(KEYS.LOGS, updatedLogs);
  notifyLogsListeners(updatedLogs);

  // 2. Background Firestore write
  try {
    await setDoc(doc(db, 'dispatch_logs', log.id), sanitizeForFirestore(log));
  } catch (err) {
    console.warn('Firestore save failed (saved locally):', err);
  }
}

export async function deleteDispatchLog(id: string): Promise<void> {
  // 1. Instant local update and synchronous UI broadcast
  const currentLogs = getLocalData<DispatchLog[]>(KEYS.LOGS, []);
  const updatedLogs = currentLogs.filter((l) => l.id !== id);
  setLocalData(KEYS.LOGS, updatedLogs);
  notifyLogsListeners(updatedLogs);

  // 2. Background Firestore delete
  try {
    await deleteDoc(doc(db, 'dispatch_logs', id));
  } catch (err) {
    console.warn('Firestore delete failed:', err);
  }
}

// Workers Master
export function subscribeWorkers(onUpdate: (workers: WorkerMaster[]) => void): () => void {
  const localWorkers = getLocalData<WorkerMaster[]>(KEYS.WORKERS, INITIAL_WORKERS);
  onUpdate(localWorkers);
  workersListeners.push(onUpdate);

  let unsubscribeFirestore: () => void = () => {};

  try {
    unsubscribeFirestore = onSnapshot(collection(db, 'workers'), (snapshot) => {
      if (!snapshot.empty) {
        const list: WorkerMaster[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as WorkerMaster);
        });
        setLocalData(KEYS.WORKERS, list);
        notifyWorkersListeners(list);
      }
    }, (err) => {
      console.warn('Firestore workers snapshot error:', err);
    });
  } catch (err) {
    console.warn('Firestore workers subscription error:', err);
  }

  return () => {
    workersListeners = workersListeners.filter((cb) => cb !== onUpdate);
    unsubscribeFirestore();
  };
}

export async function saveWorker(worker: WorkerMaster): Promise<void> {
  const current = getLocalData<WorkerMaster[]>(KEYS.WORKERS, INITIAL_WORKERS);
  const idx = current.findIndex((w) => w.id === worker.id);
  const updated = idx >= 0 ? current.map((w) => w.id === worker.id ? worker : w) : [...current, worker];
  setLocalData(KEYS.WORKERS, updated);
  notifyWorkersListeners(updated);

  try {
    await setDoc(doc(db, 'workers', worker.id), sanitizeForFirestore(worker));
  } catch (err) {
    console.warn('Firestore save worker error:', err);
  }
}

export async function deleteWorker(id: string): Promise<void> {
  const current = getLocalData<WorkerMaster[]>(KEYS.WORKERS, []);
  const updated = current.filter((w) => w.id !== id);
  setLocalData(KEYS.WORKERS, updated);
  notifyWorkersListeners(updated);

  try {
    await deleteDoc(doc(db, 'workers', id));
  } catch (err) {
    console.warn('Firestore delete worker error:', err);
  }
}

// Clients Master
export function subscribeClients(onUpdate: (clients: ClientSiteMaster[]) => void): () => void {
  const localClients = getLocalData<ClientSiteMaster[]>(KEYS.CLIENTS, INITIAL_CLIENTS);
  onUpdate(localClients);
  clientsListeners.push(onUpdate);

  let unsubscribeFirestore: () => void = () => {};

  try {
    unsubscribeFirestore = onSnapshot(collection(db, 'clients'), (snapshot) => {
      if (!snapshot.empty) {
        const list: ClientSiteMaster[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ClientSiteMaster);
        });
        setLocalData(KEYS.CLIENTS, list);
        notifyClientsListeners(list);
      }
    }, (err) => {
      console.warn('Firestore clients snapshot error:', err);
    });
  } catch (err) {
    console.warn('Firestore clients subscription error:', err);
  }

  return () => {
    clientsListeners = clientsListeners.filter((cb) => cb !== onUpdate);
    unsubscribeFirestore();
  };
}

export async function saveClient(client: ClientSiteMaster): Promise<void> {
  const current = getLocalData<ClientSiteMaster[]>(KEYS.CLIENTS, INITIAL_CLIENTS);
  const idx = current.findIndex((c) => c.id === client.id);
  const updated = idx >= 0 ? current.map((c) => c.id === client.id ? client : c) : [...current, client];
  setLocalData(KEYS.CLIENTS, updated);
  notifyClientsListeners(updated);

  try {
    await setDoc(doc(db, 'clients', client.id), sanitizeForFirestore(client));
  } catch (err) {
    console.warn('Firestore save client error:', err);
  }
}

export async function deleteClient(id: string): Promise<void> {
  const current = getLocalData<ClientSiteMaster[]>(KEYS.CLIENTS, []);
  const updated = current.filter((c) => c.id !== id);
  setLocalData(KEYS.CLIENTS, updated);
  notifyClientsListeners(updated);

  try {
    await deleteDoc(doc(db, 'clients', id));
  } catch (err) {
    console.warn('Firestore delete client error:', err);
  }
}

// Office Profiles & Settings
export function getActiveOfficeId(): string {
  return localStorage.getItem(KEYS.ACTIVE_OFFICE_ID) || 'default';
}

export function getActiveOfficeProfileId(): string {
  return getActiveOfficeId();
}

export function setActiveOfficeId(id: string): void {
  localStorage.setItem(KEYS.ACTIVE_OFFICE_ID, id);
  notifyActiveOfficeListeners(id);
}

export function setActiveOfficeProfileId(id: string): void {
  setActiveOfficeId(id);
}

export function subscribeActiveOfficeId(onUpdate: (activeId: string) => void): () => void {
  onUpdate(getActiveOfficeId());
  activeOfficeListeners.push(onUpdate);
  return () => {
    activeOfficeListeners = activeOfficeListeners.filter((cb) => cb !== onUpdate);
  };
}

export function subscribeOfficeProfiles(
  onUpdate: (profiles: OfficeSettings[], activeId: string) => void
): () => void {
  let localProfiles = getLocalData<OfficeSettings[]>(KEYS.OFFICE_PROFILES, []);
  if (!localProfiles || localProfiles.length === 0) {
    const oldSettings = getLocalData<OfficeSettings | null>(KEYS.OFFICE, null);
    if (oldSettings && oldSettings.officeName) {
      localProfiles = [
        {
          id: 'default',
          profileName: oldSettings.profileName || `${oldSettings.officeName} (본점)`,
          officeName: oldSettings.officeName,
          phone1: oldSettings.phone1 || '',
          phone2: oldSettings.phone2 || '',
          address: oldSettings.address || '',
          bankAccount: oldSettings.bankAccount || '',
          adminEmails: oldSettings.adminEmails || ['acehwan69@gmail.com'],
          isDefault: true,
        },
      ];
    } else {
      localProfiles = DEFAULT_OFFICE_PROFILES;
    }
    setLocalData(KEYS.OFFICE_PROFILES, localProfiles);
  }

  const activeId = getActiveOfficeProfileId();
  onUpdate(localProfiles, activeId);
  officeProfilesListeners.push(onUpdate);

  let unsubscribeFirestore: () => void = () => {};

  try {
    unsubscribeFirestore = onSnapshot(collection(db, 'office_profiles'), async (snapshot) => {
      if (!snapshot.empty) {
        const firestoreProfiles: OfficeSettings[] = [];
        snapshot.forEach((docSnap) => {
          firestoreProfiles.push({ id: docSnap.id, ...docSnap.data() } as OfficeSettings);
        });
        setLocalData(KEYS.OFFICE_PROFILES, firestoreProfiles);
        const currentActiveId = getActiveOfficeProfileId();
        notifyOfficeProfilesListeners(firestoreProfiles, currentActiveId);
      } else {
        // If Firestore is empty, upload initial default profiles to Firestore
        const currentToUpload = getLocalData<OfficeSettings[]>(KEYS.OFFICE_PROFILES, DEFAULT_OFFICE_PROFILES);
        for (const p of currentToUpload) {
          const pId = p.id || 'default';
          try {
            await setDoc(doc(db, 'office_profiles', pId), sanitizeForFirestore(p));
          } catch (e) {
            console.warn('Initial office profile sync error:', e);
          }
        }
      }
    }, (err) => {
      console.warn('Firestore office_profiles snapshot error (using local cache):', err);
    });
  } catch (err) {
    console.warn('Firestore office_profiles subscription error:', err);
  }

  return () => {
    officeProfilesListeners = officeProfilesListeners.filter((cb) => cb !== onUpdate);
    unsubscribeFirestore();
  };
}

export async function saveOfficeProfile(profile: OfficeSettings): Promise<void> {
  const profileId = profile.id || `office_${Date.now()}`;
  const profileToSave: OfficeSettings = {
    ...profile,
    id: profileId,
    profileName: profile.profileName || profile.officeName,
  };

  const currentProfiles = getLocalData<OfficeSettings[]>(KEYS.OFFICE_PROFILES, DEFAULT_OFFICE_PROFILES);
  const idx = currentProfiles.findIndex((p) => p.id === profileId);

  let updatedProfiles: OfficeSettings[];
  if (profileToSave.isDefault) {
    updatedProfiles = currentProfiles.map((p) => ({ ...p, isDefault: false }));
  } else {
    updatedProfiles = [...currentProfiles];
  }

  if (idx >= 0) {
    updatedProfiles[idx] = profileToSave;
  } else {
    updatedProfiles.push(profileToSave);
  }

  if (!updatedProfiles.some((p) => p.isDefault) && updatedProfiles.length > 0) {
    updatedProfiles[0].isDefault = true;
  }

  setLocalData(KEYS.OFFICE_PROFILES, updatedProfiles);

  const defaultProfile = updatedProfiles.find((p) => p.isDefault) || updatedProfiles[0];
  if (defaultProfile) {
    setLocalData(KEYS.OFFICE, defaultProfile);
  }

  const activeId = getActiveOfficeProfileId();
  notifyOfficeProfilesListeners(updatedProfiles, activeId);

  try {
    await setDoc(doc(db, 'office_profiles', profileId), sanitizeForFirestore(profileToSave));
    if (defaultProfile) {
      await setDoc(doc(db, 'settings', 'office_info'), sanitizeForFirestore(defaultProfile));
    }
  } catch (err) {
    console.warn('Firestore saveOfficeProfile error:', err);
  }
}

export async function deleteOfficeProfile(id: string): Promise<void> {
  const currentProfiles = getLocalData<OfficeSettings[]>(KEYS.OFFICE_PROFILES, []);
  const updatedProfiles = currentProfiles.filter((p) => p.id !== id);
  if (updatedProfiles.length > 0 && !updatedProfiles.some((p) => p.isDefault)) {
    updatedProfiles[0].isDefault = true;
  }
  setLocalData(KEYS.OFFICE_PROFILES, updatedProfiles);

  const defaultProfile = updatedProfiles.find((p) => p.isDefault) || updatedProfiles[0];
  if (defaultProfile) {
    setLocalData(KEYS.OFFICE, defaultProfile);
  }

  const activeId = getActiveOfficeProfileId();
  notifyOfficeProfilesListeners(updatedProfiles, activeId);

  try {
    await deleteDoc(doc(db, 'office_profiles', id));
  } catch (err) {
    console.warn('Firestore deleteOfficeProfile error:', err);
  }
}

// Legacy Backward Compatibility
export function subscribeOfficeSettings(onUpdate: (settings: OfficeSettings) => void): () => void {
  const unsub = subscribeOfficeProfiles((profiles, activeId) => {
    const active = profiles.find((p) => p.id === activeId) || profiles.find((p) => p.isDefault) || profiles[0] || DEFAULT_OFFICE_SETTINGS;
    onUpdate(active);
  });
  officeSettingsListeners.push(onUpdate);
  return () => {
    officeSettingsListeners = officeSettingsListeners.filter((cb) => cb !== onUpdate);
    unsub();
  };
}

export async function saveOfficeSettings(settings: OfficeSettings): Promise<void> {
  await saveOfficeProfile({
    ...settings,
    id: settings.id || 'default',
  });
}

// ==========================================================
// DATABASE BACKUP & RESTORE UTILITIES
// ==========================================================

export interface DatabaseBackupResult {
  logsCount: number;
  workersCount: number;
  clientsCount: number;
  officeProfilesCount: number;
}

import { DatabaseBackupData } from '../types';

/**
 * Exports all database records into a standardized JSON backup object.
 */
export function exportDatabaseBackup(exportedByEmail?: string): DatabaseBackupData {
  const logs = getLocalData<DispatchLog[]>(KEYS.LOGS, INITIAL_DISPATCH_LOGS);
  const workers = getLocalData<WorkerMaster[]>(KEYS.WORKERS, INITIAL_WORKERS);
  const clients = getLocalData<ClientSiteMaster[]>(KEYS.CLIENTS, INITIAL_CLIENTS);
  const officeProfiles = getLocalData<OfficeSettings[]>(KEYS.OFFICE_PROFILES, DEFAULT_OFFICE_PROFILES);
  const activeOfficeId = getActiveOfficeId();

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    exportedByEmail: exportedByEmail || 'admin',
    dispatchLogs: logs,
    workers: workers,
    clients: clients,
    officeProfiles: officeProfiles,
    activeOfficeId: activeOfficeId,
    summary: {
      logsCount: logs.length,
      workersCount: workers.length,
      clientsCount: clients.length,
      officeProfilesCount: officeProfiles.length,
    },
  };
}

/**
 * Triggers a one-click browser download of the full database backup as a JSON file.
 */
export function downloadDatabaseBackup(exportedByEmail?: string): void {
  const backup = exportDatabaseBackup(exportedByEmail);
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const link = document.createElement('a');
  link.href = url;
  link.download = `jeolmeun_database_backup_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates a parsed backup object or JSON string.
 */
export function validateBackupFile(fileContent: string): { isValid: boolean; data?: DatabaseBackupData; error?: string } {
  try {
    const parsed = JSON.parse(fileContent) as Partial<DatabaseBackupData>;
    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, error: '올바른 JSON 파일 형식이 아닙니다.' };
    }

    const hasLogs = Array.isArray(parsed.dispatchLogs);
    const hasWorkers = Array.isArray(parsed.workers);
    const hasClients = Array.isArray(parsed.clients);
    const hasProfiles = Array.isArray(parsed.officeProfiles);

    if (!hasLogs && !hasWorkers && !hasClients && !hasProfiles) {
      return { isValid: false, error: '유효한 인력관리 백업 데이터 필드가 포함되어 있지 않습니다.' };
    }

    const validData: DatabaseBackupData = {
      version: parsed.version || '1.0',
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      exportedByEmail: parsed.exportedByEmail || 'unknown',
      dispatchLogs: parsed.dispatchLogs || [],
      workers: parsed.workers || [],
      clients: parsed.clients || [],
      officeProfiles: parsed.officeProfiles || [],
      activeOfficeId: parsed.activeOfficeId || 'default',
      summary: {
        logsCount: (parsed.dispatchLogs || []).length,
        workersCount: (parsed.workers || []).length,
        clientsCount: (parsed.clients || []).length,
        officeProfilesCount: (parsed.officeProfiles || []).length,
      },
    };

    return { isValid: true, data: validData };
  } catch (err: any) {
    return { isValid: false, error: `파일 분석 오류: ${err.message || 'JSON 구문 오류'}` };
  }
}

/**
 * Restores all database collections from a validated backup dataset.
 * Supports 'overwrite' (complete replace) and 'merge' (upsert / append).
 */
export async function restoreDatabaseFromBackup(
  backup: DatabaseBackupData,
  mode: 'overwrite' | 'merge' = 'overwrite'
): Promise<DatabaseBackupResult> {
  // 1. Dispatch Logs Restore
  let finalLogs: DispatchLog[] = [];
  if (mode === 'overwrite') {
    finalLogs = backup.dispatchLogs || [];
  } else {
    const existing = getLocalData<DispatchLog[]>(KEYS.LOGS, []);
    const map = new Map<string, DispatchLog>();
    existing.forEach((l) => map.set(l.id, l));
    (backup.dispatchLogs || []).forEach((l) => map.set(l.id, l));
    finalLogs = Array.from(map.values());
  }
  finalLogs.sort((a, b) => b.date.localeCompare(a.date));
  setLocalData(KEYS.LOGS, finalLogs);

  for (const log of finalLogs) {
    try {
      await setDoc(doc(db, 'dispatch_logs', log.id), sanitizeForFirestore(log));
    } catch (e) {
      console.warn('Firestore restore log error:', e);
    }
  }

  // 2. Workers Master Restore
  let finalWorkers: WorkerMaster[] = [];
  if (mode === 'overwrite') {
    finalWorkers = backup.workers || [];
  } else {
    const existing = getLocalData<WorkerMaster[]>(KEYS.WORKERS, []);
    const map = new Map<string, WorkerMaster>();
    existing.forEach((w) => map.set(w.id, w));
    (backup.workers || []).forEach((w) => map.set(w.id, w));
    finalWorkers = Array.from(map.values());
  }
  setLocalData(KEYS.WORKERS, finalWorkers);

  for (const w of finalWorkers) {
    try {
      await setDoc(doc(db, 'workers', w.id), sanitizeForFirestore(w));
    } catch (e) {
      console.warn('Firestore restore worker error:', e);
    }
  }

  // 3. Clients Master Restore
  let finalClients: ClientSiteMaster[] = [];
  if (mode === 'overwrite') {
    finalClients = backup.clients || [];
  } else {
    const existing = getLocalData<ClientSiteMaster[]>(KEYS.CLIENTS, []);
    const map = new Map<string, ClientSiteMaster>();
    existing.forEach((c) => map.set(c.id, c));
    (backup.clients || []).forEach((c) => map.set(c.id, c));
    finalClients = Array.from(map.values());
  }
  setLocalData(KEYS.CLIENTS, finalClients);

  for (const c of finalClients) {
    try {
      await setDoc(doc(db, 'clients', c.id), sanitizeForFirestore(c));
    } catch (e) {
      console.warn('Firestore restore client error:', e);
    }
  }

  // 4. Office Profiles Restore
  let finalProfiles: OfficeSettings[] = [];
  if (mode === 'overwrite') {
    finalProfiles = backup.officeProfiles && backup.officeProfiles.length > 0
      ? backup.officeProfiles
      : DEFAULT_OFFICE_PROFILES;
  } else {
    const existing = getLocalData<OfficeSettings[]>(KEYS.OFFICE_PROFILES, []);
    const map = new Map<string, OfficeSettings>();
    existing.forEach((p) => map.set(p.id || 'default', p));
    (backup.officeProfiles || []).forEach((p) => map.set(p.id || 'default', p));
    finalProfiles = Array.from(map.values());
  }

  if (!finalProfiles.some((p) => p.isDefault) && finalProfiles.length > 0) {
    finalProfiles[0].isDefault = true;
  }
  setLocalData(KEYS.OFFICE_PROFILES, finalProfiles);

  const defaultProfile = finalProfiles.find((p) => p.isDefault) || finalProfiles[0];
  if (defaultProfile) {
    setLocalData(KEYS.OFFICE, defaultProfile);
  }

  for (const p of finalProfiles) {
    const pId = p.id || 'default';
    try {
      await setDoc(doc(db, 'office_profiles', pId), sanitizeForFirestore(p));
    } catch (e) {
      console.warn('Firestore restore office profile error:', e);
    }
  }

  if (backup.activeOfficeId) {
    setActiveOfficeId(backup.activeOfficeId);
  }

  // Synchronously notify all in-memory UI listeners immediately
  notifyLogsListeners(finalLogs);
  notifyWorkersListeners(finalWorkers);
  notifyClientsListeners(finalClients);
  notifyOfficeProfilesListeners(finalProfiles, backup.activeOfficeId || getActiveOfficeProfileId());

  return {
    logsCount: finalLogs.length,
    workersCount: finalWorkers.length,
    clientsCount: finalClients.length,
    officeProfilesCount: finalProfiles.length,
  };
}
