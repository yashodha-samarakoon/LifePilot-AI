import { create } from 'zustand';
import { sendChatMessage } from '@/services/chat.service';
import { buildUserContext } from '@/services/context.service';
import { getChatMessages, saveChatMessage, clearChatHistory } from '@/services/firestore.service';

let messageCounter = 1;
function nextId() {
  return `msg-${messageCounter++}-${Date.now()}`;
}

export const useChatStore = create((set, get) => ({
  messages: [],
  typing: false,
  suggestedActions: [],
  error: null,

  /**
   * Load persisted chat messages for the current user.
   */
  loadMessages: async (uid) => {
    if (!uid) return;
    try {
      const messages = await getChatMessages(uid);
      set({ messages: messages.map(normalizeMessage) });
    } catch (err) {
      console.error('Failed to load chat history:', err.code || err.message, err);
    }
  },

  /**
   * Send a user message and receive an AI response.
   * @param {string} text — User message
   * @param {object} profile — From user.store
   * @param {Array} goals — From user.store
   * @param {Array} decisions — From dashboard.store (optional)
   */
  sendMessage: async (text, profile, goals = [], decisions = [], uid = null) => {
    if (!text.trim()) return;

    console.log('[ChatStore] profile:', profile);
    console.log('[ChatStore] goals:', goals);
    const context = buildUserContext(profile, goals, decisions);
    console.log('[ChatStore] context:', context);

    const trimmed = text.trim();
    const userMsg = {
      id: nextId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      typing: true,
      error: null,
      suggestedActions: [],
    }));

    // Persist the user message.
    if (uid) {
      saveChatMessage(uid, {
        role: 'user',
        content: trimmed,
        createdAt: Date.now(),
      }).catch((err) => console.error('Failed to save user message:', err));
    }

    try {
      const history = get().messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendChatMessage(trimmed, context, history);

      const aiMsg = {
        id: nextId(),
        role: 'assistant',
        content: response.content || '',
        type: response.type || 'text',
        paths: response.paths || null,
        affordabilityScore: response.affordabilityScore,
        riskScore: response.riskScore,
        actions: response.actions || [],
        timestamp: Date.now(),
      };

      set((state) => ({
        messages: [...state.messages, aiMsg],
        typing: false,
        suggestedActions: response.actions || [],
      }));

      // Persist the AI response.
      if (uid) {
        saveChatMessage(uid, {
          role: 'assistant',
          content: aiMsg.content,
          type: aiMsg.type,
          actions: aiMsg.actions,
          createdAt: Date.now(),
        }).catch((err) => console.error('Failed to save AI message:', err));
      }
    } catch (err) {
      console.error('Chat send failed:', err);
      set({
        typing: false,
        error: err.message || 'Something went wrong. Please try again.',
      });
    }
  },

  /**
   * Execute an action from an AI response (e.g. create goal, run decision).
   * This is handled by the ChatPage component which reads the action type
   * and dispatches to the appropriate store / navigation.
   */
  clearActions: () => set({ suggestedActions: [] }),

  /**
   * Add a system message (e.g. after executing an action).
   */
  addSystemMessage: (content) => {
    const msg = {
      id: nextId(),
      role: 'assistant',
      content,
      type: 'system',
      timestamp: Date.now(),
    };
    set((state) => ({ messages: [...state.messages, msg] }));
  },

  /**
   * Clear the local chat and optionally the persisted history.
   */
  clearChat: async (uid = null) => {
    set({ messages: [], suggestedActions: [], error: null });
    if (uid) {
      try {
        await clearChatHistory(uid);
      } catch (err) {
        console.error('Failed to clear chat history:', err);
      }
    }
  },
}));

/**
 * Normalize a Firestore message document for local use.
 */
function normalizeMessage(msg) {
  const createdAt = msg.createdAt?.toMillis ? msg.createdAt.toMillis() : msg.createdAt;
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content || '',
    type: msg.type || 'text',
    paths: msg.paths || null,
    affordabilityScore: msg.affordabilityScore,
    riskScore: msg.riskScore,
    actions: msg.actions || [],
    timestamp: createdAt || Date.now(),
  };
}
