import { create } from 'zustand';
import { signIn, signUp, logOut, onAuthChange } from '@/services/auth.service';
import { getUserData } from '@/services/firestore.service';
import { isFirebaseConfigured } from '@/services/firebase';

export const useAuthStore = create((set, get) => ({
  user: null,
  userData: null,
  loading: true,
  error: null,
  isDemoMode: !isFirebaseConfigured,

  initAuth: () => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        try {
          const userData = await getUserData(user.uid);
          set({ user, userData, loading: false, error: null });
        } catch (err) {
          // Provide default userData if fetch fails
          set({
            user,
            userData: { uid: user.uid, onboardingComplete: false },
            loading: false,
            error: null,
          });
        }
      } else {
        set({ user: null, userData: null, loading: false, error: null });
      }
    });
    return unsubscribe;
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signIn(email, password);
      set({ loading: false });
    } catch (err) {
      const message = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : err.message;
      set({ error: message, loading: false });
      throw err;
    }
  },

  signup: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signUp(email, password);
      set({ loading: false });
    } catch (err) {
      const message = err.code === 'auth/email-already-in-use'
        ? 'Email is already registered'
        : err.message;
      set({ error: message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    await logOut();
    set({ user: null, userData: null });
  },

  /**
   * Re-fetch userData from the backend (Firestore or mock store).
   * Called when ProtectedRoute detects potentially stale state.
   */
  refreshUserData: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const userData = await getUserData(user.uid);
      if (userData) {
        set({ userData });
      }
    } catch {
      // Keep existing userData on failure
    }
  },

  /**
   * Immediately update userData in the store (no backend call).
   * Used after onboarding completion to prevent stale-state redirects.
   */
  updateUserData: (updates) => {
    const { userData } = get();
    set({ userData: { ...userData, ...updates } });
  },

  clearError: () => set({ error: null }),
}));
