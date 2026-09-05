import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

// ============================================================
// In-Memory Mock Store (used when Firebase is not configured)
// ============================================================

const mockStore = {
  users: new Map(),        // uid -> { uid, email, onboardingComplete, ... }
  profiles: new Map(),     // uid -> profile data
  goals: new Map(),        // uid -> [ { id, ... } ]
  transactions: new Map(), // uid -> [ { id, ... } ]
  decisions: new Map(),    // uid -> [ { id, ... } ]
  insights: new Map(),     // uid -> [ { id, ... } ]
  chatHistory: new Map(),  // uid -> [ { id, role, content, ... } ]
  memory: new Map(),       // uid -> [ { id, key, value, source, ... } ]
};

let mockIdCounter = 1;
function mockId() { return `mock-${mockIdCounter++}`; }

/**
 * Ensure a user record exists in the mock store.
 * Called by mock auth on sign-in/sign-up so that getUserData returns
 * the correct onboardingComplete status for returning users.
 * Only used in demo mode.
 */
export function seedMockUser(uid, email) {
  if (isFirebaseConfigured || !db) return;
  if (!mockStore.users.has(uid)) {
    mockStore.users.set(uid, {
      uid,
      email: email || 'demo@lifepilot.local',
      onboardingComplete: false,
      createdAt: Date.now(),
    });
  }
}

/**
 * Seed sample data for a mock user so that dashboard, goals, decisions,
 * insights, chat, and settings pages are populated for development/testing.
 * Only runs in local mock mode and only when no data exists yet.
 */
export function seedSampleData(uid, email) {
  if (isFirebaseConfigured || !db) return;

  // Goals
  if (!mockStore.goals.has(uid) || mockStore.goals.get(uid).length === 0) {
    mockStore.goals.set(uid, [
      {
        id: mockId(),
        title: 'Build Emergency Fund',
        targetAmount: 5000,
        currentAmount: 1200,
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
        priority: 'high',
        category: 'savings',
        status: 'active',
        createdAt: Date.now(),
      },
      {
        id: mockId(),
        title: 'Pay Off Student Loan',
        targetAmount: 12000,
        currentAmount: 3000,
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        priority: 'high',
        category: 'debt',
        status: 'active',
        createdAt: Date.now(),
      },
    ]);
  }

  // Transactions
  if (!mockStore.transactions.has(uid) || mockStore.transactions.get(uid).length === 0) {
    mockStore.transactions.set(uid, [
      { id: mockId(), description: 'Grocery shopping', amount: 120, type: 'expense', category: 'food', date: Date.now() - 1000 * 60 * 60 * 24, createdAt: Date.now() },
      { id: mockId(), description: 'Freelance payment', amount: 800, type: 'income', category: 'income', date: Date.now() - 1000 * 60 * 60 * 48, createdAt: Date.now() },
      { id: mockId(), description: 'Electric bill', amount: 95, type: 'expense', category: 'utilities', date: Date.now() - 1000 * 60 * 60 * 72, createdAt: Date.now() },
    ]);
  }

  // Decisions
  if (!mockStore.decisions.has(uid) || mockStore.decisions.get(uid).length === 0) {
    mockStore.decisions.set(uid, [
      {
        id: mockId(),
        title: 'Buy a car vs. continue using public transport',
        type: 'purchase',
        optionA: { name: 'Buy Car', cost: 15000, benefit: 'Convenience and time savings' },
        optionB: { name: 'Public Transport', cost: 1200, benefit: 'Lower monthly cost' },
        recommendation: 'optionB',
        createdAt: Date.now(),
      },
    ]);
  }

  // Insights
  if (!mockStore.insights.has(uid) || mockStore.insights.get(uid).length === 0) {
    mockStore.insights.set(uid, [
      { id: mockId(), type: 'blind_spot', title: 'No emergency fund', description: 'You have not allocated savings for unexpected expenses.', severity: 'high', acknowledged: false, createdAt: Date.now() },
      { id: mockId(), type: 'opportunity', title: 'Reduce subscription spending', description: 'Review recurring subscriptions to free up monthly cash flow.', severity: 'medium', acknowledged: false, createdAt: Date.now() },
      { id: mockId(), type: 'wellness', title: 'Track daily spending', description: 'Logging small expenses can reveal hidden spending patterns.', severity: 'low', acknowledged: false, createdAt: Date.now() },
    ]);
  }

  // Chat history
  if (!mockStore.chatHistory.has(uid) || mockStore.chatHistory.get(uid).length === 0) {
    mockStore.chatHistory.set(uid, [
      { id: mockId(), role: 'user', content: 'How can I save more money?', createdAt: Date.now() - 1000 * 60 * 60 },
      { id: mockId(), role: 'assistant', content: 'Start by tracking your expenses and setting a realistic savings goal.', createdAt: Date.now() - 1000 * 60 * 59 },
    ]);
  }

  // Memory items
  if (!mockStore.memory.has(uid) || mockStore.memory.get(uid).length === 0) {
    mockStore.memory.set(uid, [
      { id: mockId(), key: 'currency', value: 'USD', source: 'onboarding', createdAt: Date.now() },
      { id: mockId(), key: 'risk_tolerance', value: 'moderate', source: 'onboarding', createdAt: Date.now() },
    ]);
  }
}

// ============================================================
// User Profile
// ============================================================

export async function getUserProfile(uid) {
  if (!isFirebaseConfigured || !db) {
    return mockStore.profiles.get(uid) || null;
  }
  try {
    const docRef = doc(db, 'users', uid);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  } catch (err) {
    console.error('[Firestore] Failed to fetch profile:', err);
    return null;
  }
}

export async function saveUserProfile(uid, profileData) {
  if (!isFirebaseConfigured || !db) {
    const existing = mockStore.profiles.get(uid) || {};
    mockStore.profiles.set(uid, { ...existing, ...profileData, updatedAt: Date.now() });
    return;
  }
  const docRef = doc(db, 'users', uid);
  await setDoc(docRef, { ...profileData, updatedAt: serverTimestamp() }, { merge: true });
}

export async function completeOnboarding(uid) {
  if (!isFirebaseConfigured || !db) {
    const existing = mockStore.users.get(uid) || {};
    mockStore.users.set(uid, { ...existing, onboardingComplete: true, updatedAt: Date.now() });
    return;
  }
  // Use setDoc with merge instead of updateDoc for better resilience.
  // This avoids hanging when the local Firestore cache hasn't fully
  // confirmed the user document created during sign-up.
  const userRef = doc(db, 'users', uid);
  await setDoc(
    userRef,
    { onboardingComplete: true, updatedAt: Date.now() },
    { merge: true }
  );
}

export async function getUserData(uid) {
  if (!isFirebaseConfigured || !db) {
    return mockStore.users.get(uid) || { uid, onboardingComplete: false };
  }
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);
  return snapshot.exists() ? snapshot.data() : null;
}

// ============================================================
// Goals
// ============================================================

export async function getGoals(uid) {
  if (!isFirebaseConfigured || !db) {
    const goals = mockStore.goals.get(uid) || [];
    return [...goals].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
  const q = query(
    collection(db, 'users', uid, 'goals'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function addGoal(uid, goalData) {
  if (!isFirebaseConfigured || !db) {
    const id = mockId();
    const goals = mockStore.goals.get(uid) || [];
    const newGoal = {
      id,
      ...goalData,
      currentAmount: goalData.currentAmount || 0,
      status: 'active',
      createdAt: Date.now(),
    };
    goals.push(newGoal);
    mockStore.goals.set(uid, goals);
    return id;
  }
  const docRef = await addDoc(collection(db, 'users', uid, 'goals'), {
    ...goalData,
    currentAmount: goalData.currentAmount || 0,
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateGoal(uid, goalId, updates) {
  if (!isFirebaseConfigured || !db) {
    const goals = mockStore.goals.get(uid) || [];
    const idx = goals.findIndex((g) => g.id === goalId);
    if (idx !== -1) {
      goals[idx] = { ...goals[idx], ...updates, updatedAt: Date.now() };
    }
    return;
  }
  const docRef = doc(db, 'users', uid, 'goals', goalId);
  await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteGoal(uid, goalId) {
  if (!isFirebaseConfigured || !db) {
    const goals = mockStore.goals.get(uid) || [];
    mockStore.goals.set(uid, goals.filter((g) => g.id !== goalId));
    return;
  }
  await deleteDoc(doc(db, 'users', uid, 'goals', goalId));
}

// ============================================================
// Transactions
// ============================================================

export async function getTransactions(uid, limit = 50) {
  if (!isFirebaseConfigured || !db) {
    const txs = mockStore.transactions.get(uid) || [];
    return [...txs].sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, limit);
  }
  const q = query(
    collection(db, 'users', uid, 'transactions'),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).slice(0, limit);
}

export async function addTransaction(uid, txData) {
  if (!isFirebaseConfigured || !db) {
    const id = mockId();
    const txs = mockStore.transactions.get(uid) || [];
    txs.push({ id, ...txData, createdAt: Date.now() });
    mockStore.transactions.set(uid, txs);
    return id;
  }
  const docRef = await addDoc(collection(db, 'users', uid, 'transactions'), {
    ...txData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ============================================================
// Decisions
// ============================================================

export async function getDecisions(uid) {
  if (!isFirebaseConfigured || !db) {
    const decisions = mockStore.decisions.get(uid) || [];
    return [...decisions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
  const q = query(
    collection(db, 'users', uid, 'decisions'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function saveDecision(uid, decisionData) {
  if (!isFirebaseConfigured || !db) {
    const id = mockId();
    const decisions = mockStore.decisions.get(uid) || [];
    decisions.push({ id, ...decisionData, createdAt: Date.now() });
    mockStore.decisions.set(uid, decisions);
    return id;
  }
  const docRef = await addDoc(collection(db, 'users', uid, 'decisions'), {
    ...decisionData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ============================================================
// Insights
// ============================================================

export async function getInsights(uid, type = null) {
  if (!isFirebaseConfigured || !db) {
    let insights = mockStore.insights.get(uid) || [];
    if (type) {
      insights = insights.filter((i) => i.type === type);
    }
    return [...insights].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
  let q;
  if (type) {
    q = query(
      collection(db, 'users', uid, 'insights'),
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(
      collection(db, 'users', uid, 'insights'),
      orderBy('createdAt', 'desc')
    );
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function saveInsight(uid, insightData) {
  if (!isFirebaseConfigured || !db) {
    const id = mockId();
    const insights = mockStore.insights.get(uid) || [];
    insights.push({ id, ...insightData, acknowledged: false, createdAt: Date.now() });
    mockStore.insights.set(uid, insights);
    return id;
  }
  const docRef = await addDoc(collection(db, 'users', uid, 'insights'), {
    ...insightData,
    acknowledged: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ============================================================
// Chat History
// ============================================================

export async function getChatMessages(uid, limit = 100) {
  if (!isFirebaseConfigured || !db) {
    const messages = mockStore.chatHistory.get(uid) || [];
    return [...messages].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).slice(-limit);
  }
  const q = query(
    collection(db, 'users', uid, 'chatHistory'),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).slice(-limit);
}

export async function saveChatMessage(uid, messageData) {
  if (!isFirebaseConfigured || !db) {
    const id = mockId();
    const messages = mockStore.chatHistory.get(uid) || [];
    messages.push({ id, ...messageData, createdAt: Date.now() });
    mockStore.chatHistory.set(uid, messages);
    return id;
  }
  const docRef = await addDoc(collection(db, 'users', uid, 'chatHistory'), {
    ...messageData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function clearChatHistory(uid) {
  if (!isFirebaseConfigured || !db) {
    mockStore.chatHistory.set(uid, []);
    return;
  }
  const snapshot = await getDocs(collection(db, 'users', uid, 'chatHistory'));
  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}

// ============================================================
// Memory Items
// ============================================================

export async function getMemoryItems(uid) {
  if (!isFirebaseConfigured || !db) {
    const items = mockStore.memory.get(uid) || [];
    return [...items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
  const q = query(
    collection(db, 'users', uid, 'memory'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function saveMemoryItem(uid, memoryData) {
  if (!isFirebaseConfigured || !db) {
    const id = mockId();
    const items = mockStore.memory.get(uid) || [];
    items.push({ id, ...memoryData, createdAt: Date.now() });
    mockStore.memory.set(uid, items);
    return id;
  }
  const docRef = await addDoc(collection(db, 'users', uid, 'memory'), {
    ...memoryData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateMemoryItem(uid, itemId, updates) {
  if (!isFirebaseConfigured || !db) {
    const items = mockStore.memory.get(uid) || [];
    const idx = items.findIndex((m) => m.id === itemId);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates, updatedAt: Date.now() };
    }
    return;
  }
  const docRef = doc(db, 'users', uid, 'memory', itemId);
  await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteMemoryItem(uid, itemId) {
  if (!isFirebaseConfigured || !db) {
    const items = mockStore.memory.get(uid) || [];
    mockStore.memory.set(uid, items.filter((m) => m.id !== itemId));
    return;
  }
  await deleteDoc(doc(db, 'users', uid, 'memory', itemId));
}
