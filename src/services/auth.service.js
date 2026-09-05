import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  getAdditionalUserInfo,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { seedMockUser, seedSampleData } from './firestore.service';

// ============================================================
// Mock Auth System (used when Firebase is not configured)
// ============================================================

const MOCK_EMAIL = 'demo@lifepilot.local';

let mockAuthState = { user: null };
let mockAuthListeners = new Set();

function notifyMockListeners() {
  mockAuthListeners.forEach((cb) => cb(mockAuthState.user));
}

/**
 * Generate a stable mock UID for a given email so that signing in with the
 * same email returns the same local data.
 */
function getMockUid(email) {
  // Normalize to lowercase so different cases of the same email map to the
  // same local user and data.
  const input = (email || MOCK_EMAIL).toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `mock-${Math.abs(hash).toString(16)}`;
}

function createMockUser(email) {
  const uid = getMockUid(email);
  return {
    uid,
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
    seedSampleData(user.uid, email); // Seed sample data for a richer first experience
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

export async function signInWithGoogle() {
  if (!isFirebaseConfigured || !auth) {
    const user = createMockUser('demo-google@lifepilot.local');
    seedMockUser(user.uid, user.email);
    mockAuthState.user = user;
    notifyMockListeners();
    return user;
  }

  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const additionalInfo = getAdditionalUserInfo(result);

  // Create the user document for brand-new Google users so onboarding can run.
  if (additionalInfo?.isNewUser) {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        onboardingComplete: false,
      },
      { merge: true }
    );
  }

  return user;
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
