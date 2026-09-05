import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// ============================================================
// Firebase integration toggle
// ============================================================
// Set this to true to reconnect Firebase. While false, the app runs entirely
// in local mock mode with in-memory data stores. No Firebase services are
// initialized, so Firebase configuration is not required.
export const USE_FIREBASE = true;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/**
 * Whether Firebase credentials are properly configured.
 * When false, the app runs in demo mode with mock auth and in-memory storage.
 */
export const isFirebaseConfigured = USE_FIREBASE && Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your_api_key_here' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'your_project_id'
);

/**
 * True when Firebase is intentionally paused and the app is running locally.
 */
export const isLocalMode = !isFirebaseConfigured;

let app = null;
export let auth = null;
export let db = null;
export let functions = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Use initializeFirestore to disable offline persistence.
    // This prevents "client is offline" errors when the Firestore cache
    // gets stuck after a failed or interrupted write.
    try {
      db = initializeFirestore(app, { localCache: undefined });
    } catch {
      // initializeFirestore throws if getFirestore was already called in the
      // same app context (e.g. hot reload). Fall back to getFirestore.
      db = getFirestore(app);
    }

    functions = getFunctions(app);
    console.info('[LifePilot] Firebase initialized for project:', firebaseConfig.projectId);
  } catch (err) {
    console.warn('[LifePilot] Firebase initialization failed, running in demo mode:', err.message);
  }
} else {
  console.info(
    '[LifePilot] Firebase integration paused. Running in local mode with mock authentication.\n' +
    'Set USE_FIREBASE = true in src/services/firebase.js to reconnect Firebase.'
  );
}

export default app;
