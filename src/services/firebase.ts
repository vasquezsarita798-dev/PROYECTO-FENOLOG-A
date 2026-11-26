import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  serverTimestamp,
  setDoc,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import { STORAGE_KEY_APIKEY } from '../data/defaults';
import type { AppState } from '../types/phenology';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAHa7VagCe3BNRkJSh3SNgfYzCRF64KBMQ',
  authDomain: 'do-proyecto-fenologia.firebaseapp.com',
  projectId: 'do-proyecto-fenologia',
  storageBucket: 'do-proyecto-fenologia.firebasestorage.app',
  messagingSenderId: '923279603998',
  appId: '1:923279603998:web:c8053f551e3848c601710f',
  measurementId: 'G-NGXGMMETT6',
};

let firestoreDb: Firestore | null = null;
let currentApiKey = DEFAULT_FIREBASE_CONFIG.apiKey;

export function getActiveFirebaseApiKey(): string {
  const stored = localStorage.getItem(STORAGE_KEY_APIKEY);
  return stored || DEFAULT_FIREBASE_CONFIG.apiKey;
}

export function initFirestoreClient(): {
  db: Firestore | null;
  online: boolean;
  statusText: string;
} {
  try {
    const storedApiKey = localStorage.getItem(STORAGE_KEY_APIKEY);
    currentApiKey = storedApiKey || DEFAULT_FIREBASE_CONFIG.apiKey;

    const config = {
      ...DEFAULT_FIREBASE_CONFIG,
      apiKey: currentApiKey,
    };

    let app: FirebaseApp;
    if (!getApps().length) {
      app = initializeApp(config);
      try {
        firestoreDb = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
      } catch {
        firestoreDb = getFirestore(app);
      }
    } else {
      app = getApps()[0];
      firestoreDb = getFirestore(app);
    }

    return {
      db: firestoreDb,
      online: true,
      statusText: 'Conectado',
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn('Inicialización Firestore:', e);
    return {
      db: null,
      online: false,
      statusText: `Error: ${message}`,
    };
  }
}

export function subscribeToEvaluationDoc(
  onData: (state: Partial<AppState>) => void,
  onMissing: () => void,
  onStatus: (online: boolean, text: string) => void,
): Unsubscribe | null {
  if (!firestoreDb) return null;

  try {
    const docRef = doc(firestoreDb, 'evaluaciones', 'reiter_fenologia');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          onData(snap.data() as Partial<AppState>);
          onStatus(true, 'Sincronizado');
        } else {
          onMissing();
        }
      },
      (err) => {
        console.warn('Listener Firestore:', err);
        let errDesc = 'Sin conexión';
        if (err.code === 'permission-denied') {
          errDesc = "Permiso denegado (Revisa pestaña 'Reglas' en Firebase Console)";
        }
        onStatus(false, errDesc);
      },
    );
  } catch (err) {
    console.error('Error al suscribirse a Firestore:', err);
    return null;
  }
}

export async function saveStateToFirestore(state: AppState): Promise<{
  ok: boolean;
  statusText: string;
  errorMessage?: string;
}> {
  if (!firestoreDb) {
    return { ok: false, statusText: 'Modo Local' };
  }

  try {
    const evalDocRef = doc(firestoreDb, 'evaluaciones', 'reiter_fenologia');
    await setDoc(
      evalDocRef,
      {
        ...state,
        ultimaActualizacion: serverTimestamp(),
      },
      { merge: true },
    );

    if (state.activeWeek) {
      const histCollection = collection(firestoreDb, 'evaluaciones_historicas');
      const histDocRef = doc(histCollection, state.activeWeek);
      await setDoc(
        histDocRef,
        {
          semana: state.activeWeek,
          valves: state.valves,
          fecha: new Date().toISOString(),
          fundo: state.fundo,
          modulo: state.modulo,
        },
        { merge: true },
      );
    }

    return { ok: true, statusText: 'Sincronizado' };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    console.warn('Firestore error al guardar:', err);
    let errText = 'Error al guardar';
    if (err.code === 'permission-denied') {
      errText = 'Permiso denegado (revisa Reglas en Firebase Console)';
    } else if (err.code === 'unauthenticated') {
      errText = 'API Key no autorizada';
    }
    return {
      ok: false,
      statusText: errText,
      errorMessage: err.message || errText,
    };
  }
}

export async function reloadStateFromFirestore(): Promise<{
  exists: boolean;
  data?: Partial<AppState>;
  error?: string;
}> {
  if (!firestoreDb) {
    return { exists: false, error: 'Firestore no está inicializado.' };
  }
  try {
    const docRef = doc(firestoreDb, 'evaluaciones', 'reiter_fenologia');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { exists: true, data: snap.data() as Partial<AppState> };
    }
    return { exists: false };
  } catch (e: unknown) {
    return {
      exists: false,
      error: e instanceof Error ? e.message : 'Error desconocido al consultar Firestore',
    };
  }
}

export async function deleteEvaluationDocFromFirestore(): Promise<void> {
  if (!firestoreDb) return;
  try {
    const docRef = doc(firestoreDb, 'evaluaciones', 'reiter_fenologia');
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Error al eliminar documento en Firestore:', e);
  }
}

export function extractAndSaveCustomFirebaseKey(rawInput: string): {
  saved: boolean;
  key?: string;
} {
  let val = rawInput.trim();
  if (!val) {
    localStorage.removeItem(STORAGE_KEY_APIKEY);
    return { saved: false };
  }
  const matchKey = val.match(/["']?apiKey["']?\s*:\s*["']([^"']+)["']/);
  if (matchKey) {
    val = matchKey[1];
  }
  try {
    const parsed = JSON.parse(val);
    if (parsed.apiKey) val = parsed.apiKey;
  } catch {
    // Plain API key string
  }
  localStorage.setItem(STORAGE_KEY_APIKEY, val);
  return { saved: true, key: val };
}

export function hasConfiguredFirebaseKey(): boolean {
  return Boolean(currentApiKey);
}
