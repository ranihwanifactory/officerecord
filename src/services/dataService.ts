import { 
  collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, query, orderBy 
} from 'firebase/firestore';
import { db, getLocalData, setLocalData, initLocalData } from '../firebase';
import { DispatchLog, WorkerMaster, ClientSiteMaster, OfficeSettings } from '../types';
import { DEFAULT_OFFICE_SETTINGS, INITIAL_DISPATCH_LOGS, INITIAL_WORKERS, INITIAL_CLIENTS } from '../constants/defaultData';

const KEYS = {
  LOGS: 'jeolmeun_dispatch_logs_v1',
  WORKERS: 'jeolmeun_workers_v1',
  CLIENTS: 'jeolmeun_clients_v1',
  OFFICE: 'jeolmeun_office_settings_v1',
};

// Initialize default local storage
initLocalData();

// Dispatch Logs
export function subscribeDispatchLogs(onUpdate: (logs: DispatchLog[]) => void): () => void {
  const localLogs = getLocalData<DispatchLog[]>(KEYS.LOGS, INITIAL_DISPATCH_LOGS);
  onUpdate(localLogs);

  try {
    const q = query(collection(db, 'dispatch_logs'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreLogs: DispatchLog[] = [];
        snapshot.forEach((docSnap) => {
          firestoreLogs.push({ id: docSnap.id, ...docSnap.data() } as DispatchLog);
        });
        setLocalData(KEYS.LOGS, firestoreLogs);
        onUpdate(firestoreLogs);
      }
    }, (error) => {
      console.warn('Firestore logs snapshot error (using local cache):', error);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('Firestore subscription unavailable:', err);
    return () => {};
  }
}

export async function saveDispatchLog(log: DispatchLog): Promise<void> {
  // Local write
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

  // Firestore write
  try {
    await setDoc(doc(db, 'dispatch_logs', log.id), log);
  } catch (err) {
    console.warn('Firestore save failed (saved locally):', err);
  }
}

export async function deleteDispatchLog(id: string): Promise<void> {
  const currentLogs = getLocalData<DispatchLog[]>(KEYS.LOGS, []);
  const updatedLogs = currentLogs.filter((l) => l.id !== id);
  setLocalData(KEYS.LOGS, updatedLogs);

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

  try {
    const unsubscribe = onSnapshot(collection(db, 'workers'), (snapshot) => {
      if (!snapshot.empty) {
        const list: WorkerMaster[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as WorkerMaster);
        });
        setLocalData(KEYS.WORKERS, list);
        onUpdate(list);
      }
    }, (err) => {
      console.warn('Firestore workers snapshot error:', err);
    });
    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

export async function saveWorker(worker: WorkerMaster): Promise<void> {
  const current = getLocalData<WorkerMaster[]>(KEYS.WORKERS, INITIAL_WORKERS);
  const idx = current.findIndex((w) => w.id === worker.id);
  const updated = idx >= 0 ? current.map((w) => w.id === worker.id ? worker : w) : [...current, worker];
  setLocalData(KEYS.WORKERS, updated);

  try {
    await setDoc(doc(db, 'workers', worker.id), worker);
  } catch (err) {
    console.warn('Firestore save worker error:', err);
  }
}

export async function deleteWorker(id: string): Promise<void> {
  const current = getLocalData<WorkerMaster[]>(KEYS.WORKERS, []);
  const updated = current.filter((w) => w.id !== id);
  setLocalData(KEYS.WORKERS, updated);

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

  try {
    const unsubscribe = onSnapshot(collection(db, 'clients'), (snapshot) => {
      if (!snapshot.empty) {
        const list: ClientSiteMaster[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ClientSiteMaster);
        });
        setLocalData(KEYS.CLIENTS, list);
        onUpdate(list);
      }
    }, (err) => {
      console.warn('Firestore clients snapshot error:', err);
    });
    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

export async function saveClient(client: ClientSiteMaster): Promise<void> {
  const current = getLocalData<ClientSiteMaster[]>(KEYS.CLIENTS, INITIAL_CLIENTS);
  const idx = current.findIndex((c) => c.id === client.id);
  const updated = idx >= 0 ? current.map((c) => c.id === client.id ? client : c) : [...current, client];
  setLocalData(KEYS.CLIENTS, updated);

  try {
    await setDoc(doc(db, 'clients', client.id), client);
  } catch (err) {
    console.warn('Firestore save client error:', err);
  }
}

export async function deleteClient(id: string): Promise<void> {
  const current = getLocalData<ClientSiteMaster[]>(KEYS.CLIENTS, []);
  const updated = current.filter((c) => c.id !== id);
  setLocalData(KEYS.CLIENTS, updated);

  try {
    await deleteDoc(doc(db, 'clients', id));
  } catch (err) {
    console.warn('Firestore delete client error:', err);
  }
}

// Office Settings
export function subscribeOfficeSettings(onUpdate: (settings: OfficeSettings) => void): () => void {
  const localSettings = getLocalData<OfficeSettings>(KEYS.OFFICE, DEFAULT_OFFICE_SETTINGS);
  onUpdate(localSettings);

  try {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'office_info'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as OfficeSettings;
        setLocalData(KEYS.OFFICE, data);
        onUpdate(data);
      }
    }, (err) => {
      console.warn('Firestore settings snapshot error:', err);
    });
    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

export async function saveOfficeSettings(settings: OfficeSettings): Promise<void> {
  setLocalData(KEYS.OFFICE, settings);
  try {
    await setDoc(doc(db, 'settings', 'office_info'), settings);
  } catch (err) {
    console.warn('Firestore save settings error:', err);
  }
}
