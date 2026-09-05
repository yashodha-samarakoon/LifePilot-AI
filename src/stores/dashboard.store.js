import { create } from 'zustand';
import { getTransactions, addTransaction, getDecisions, getInsights } from '@/services/firestore.service';

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

  addTransaction: async (uid, txData) => {
    try {
      const id = await addTransaction(uid, txData);
      set((state) => ({
        transactions: [{ id, ...txData, createdAt: Date.now() }, ...state.transactions],
      }));
      return id;
    } catch (err) {
      console.error('Failed to add transaction:', err);
      throw err;
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
