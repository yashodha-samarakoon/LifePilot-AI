import { create } from 'zustand';
import {
  getUserProfile,
  saveUserProfile,
  getGoals,
  addGoal,
  updateGoal,
  deleteGoal,
} from '@/services/firestore.service';

export const useUserStore = create((set, get) => ({
  profile: null,
  goals: [],
  loadingProfile: false,
  loadingGoals: false,

  fetchProfile: async (uid) => {
    set({ loadingProfile: true });
    try {
      const profile = await getUserProfile(uid);
      set({ profile, loadingProfile: false });
      return profile;
    } catch (err) {
      set({ loadingProfile: false });
      console.error('Failed to fetch profile:', err);
      return null;
    }
  },

  updateProfile: async (uid, data) => {
    await saveUserProfile(uid, data);
    set((state) => ({
      profile: { ...state.profile, ...data },
    }));
  },

  fetchGoals: async (uid) => {
    set({ loadingGoals: true });
    try {
      const goals = await getGoals(uid);
      set({ goals, loadingGoals: false });
      return goals;
    } catch (err) {
      set({ loadingGoals: false });
      console.error('Failed to fetch goals:', err);
      return [];
    }
  },

  createGoal: async (uid, goalData) => {
    const id = await addGoal(uid, goalData);
    const newGoal = { id, ...goalData, currentAmount: goalData.currentAmount || 0, status: 'active' };
    set((state) => ({ goals: [newGoal, ...state.goals] }));
    return id;
  },

  editGoal: async (uid, goalId, updates) => {
    await updateGoal(uid, goalId, updates);
    set((state) => ({
      goals: state.goals.map((g) => (g.id === goalId ? { ...g, ...updates } : g)),
    }));
  },

  removeGoal: async (uid, goalId) => {
    await deleteGoal(uid, goalId);
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== goalId),
    }));
  },

  /** Get the user's currency code (defaults to USD). */
  getCurrency: () => {
    const { profile } = get();
    return profile?.currency || 'USD';
  },

  /** Get the user's locale (defaults to en-US). */
  getLocale: () => {
    const { profile } = get();
    return profile?.locale || 'en-US';
  },
}));
