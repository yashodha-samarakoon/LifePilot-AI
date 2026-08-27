import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

/**
 * Build a comprehensive user context from Firestore data.
 * This is shared across all AI function calls.
 */
export async function buildUserContext(uid) {
  // Fetch profile
  const profileDoc = await db.collection('users').doc(uid).collection('profile').doc('main').get();
  const profile = profileDoc.exists ? profileDoc.data() : {};

  // Fetch active goals
  const goalsSnapshot = await db
    .collection('users').doc(uid).collection('goals')
    .where('status', '==', 'active')
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();
  const goals = goalsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Fetch recent decisions
  const decisionsSnapshot = await db
    .collection('users').doc(uid).collection('decisions')
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();
  const recentDecisions = decisionsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Fetch recent transactions
  const txSnapshot = await db
    .collection('users').doc(uid).collection('transactions')
    .orderBy('date', 'desc')
    .limit(30)
    .get();
  const transactions = txSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Calculate transaction summary
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Category breakdown
  const categoryTotals = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (t.amount || 0);
    });
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }));

  return {
    profile: {
      name: profile.name || 'User',
      age: profile.age || null,
      role: profile.role || 'unknown',
      monthlyIncome: profile.monthlyIncome || 0,
      monthlyExpenses: profile.monthlyExpenses || 0,
      totalSavings: profile.totalSavings || 0,
      totalDebt: profile.totalDebt || 0,
      riskTolerance: profile.riskTolerance || 'moderate',
      currency: profile.currency || 'INR',
    },
    goals: goals.map((g) => ({
      title: g.title,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount || 0,
      deadline: g.deadline,
      priority: g.priority,
      category: g.category,
    })),
    recentDecisions: recentDecisions.map((d) => ({
      type: d.type,
      createdAt: d.createdAt,
      affordabilityScore: d.result?.affordabilityScore,
      riskScore: d.result?.riskScore,
    })),
    transactionSummary: {
      totalIncome,
      totalExpenses,
      topCategories,
      transactionCount: transactions.length,
    },
  };
}

/**
 * Check rate limiting: max 1 AI call per feature per 5 minutes per user.
 */
export async function checkRateLimit(uid, feature) {
  const cacheRef = db.collection('_cache').doc(`${uid}_${feature}`);
  const cacheDoc = await cacheRef.get();

  if (cacheDoc.exists) {
    const data = cacheDoc.data();
    const elapsed = Date.now() - (data.timestamp || 0);
    if (elapsed < 5 * 60 * 1000) {
      // Return cached result
      return data.result;
    }
  }
  return null;
}

/**
 * Cache AI result for rate limiting.
 */
export async function cacheResult(uid, feature, result) {
  await db.collection('_cache').doc(`${uid}_${feature}`).set({
    timestamp: Date.now(),
    result,
  });
}
