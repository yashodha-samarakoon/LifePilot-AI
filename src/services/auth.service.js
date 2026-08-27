import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { seedMockUser } from './firestore.service';

// ============================================================
// Mock Auth System (used when Firebase is not configured)
// ============================================================

const MOCK_UID = 'demo-user-uid-001';
const MOCK_EMAIL = 'demo@lifepilot.local';

let mockAuthState = { user: null };
let mockAuthListeners = new Set();

function notifyMockListeners() {
  mockAuthListeners.forEach((cb) => cb(mockAuthState.user));
}

function createMockUser(email) {
  return {
    uid: MOCK_UID,
    email: email || MOCK_EMAIL,
    displayName: 'Demo User',
    isMock: true,
  };
}

// ============================================================
// Auth Service (Firebase or Mock)
// ============================================================

export async function signUp(email, password) {
  if (!isFirebaseConfigured || !auth) {
    const user = createMockUser(email);
    seedMockUser(user.uid, email); // Create user record in mock store
    mockAuthState.user = user;
    notifyMockListeners();
    return user;
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Create user document in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    onboardingComplete: false,
  });

  return user;
}

export async function signIn(email, password) {
  if (!isFirebaseConfigured || !auth) {
    const user = createMockUser(email);
    seedMockUser(user.uid, email); // Ensure user record exists (preserves onboardingComplete)
    mockAuthState.user = user;
    notifyMockListeners();
    return user;
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function logOut() {
  if (!isFirebaseConfigured || !auth) {
    mockAuthState.user = null;
    notifyMockListeners();
    return;
  }

  await signOut(auth);
}

export function onAuthChange(callback) {
  if (!isFirebaseConfigured || !auth) {
    // Mock auth state listener
    mockAuthListeners.add(callback);
    // Fire immediately with current state
    callback(mockAuthState.user);
    return () => mockAuthListeners.delete(callback);
  }

  return onAuthStateChanged(auth, callback);
}
