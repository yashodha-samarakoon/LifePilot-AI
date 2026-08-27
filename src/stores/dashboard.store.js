import { create } from 'zustand';
import { getTransactions, getDecisions, getInsights } from '@/services/firestore.service';

export const useDashboardStore = create((set) => ({
  transactions: [],
  decisions: [],
  insights: [],
  healthScore: 0,
  loading: false,

  fetchTransactions: async (uid) => {
    try {
      const transactions = await getTransactions(uid);
      set({ transactions });
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  },

  fetchDecisions: async (uid) => {
    try {
      const decisions = await getDecisions(uid);
      set({ decisions });
    } catch (err) {
      console.error('Failed to fetch decisions:', err);
    }
  },

  fetchInsights: async (uid, type = null) => {
    try {
      const insights = await getInsights(uid, type);
      set({ insights });
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    }
  },

  setHealthScore: (score) => set({ healthScore: score }),
  setLoading: (loading) => set({ loading }),
}));
