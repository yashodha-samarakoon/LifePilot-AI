import { create } from 'zustand';
import { sendChatMessage } from '@/services/chat.service';
import { buildUserContext } from '@/services/context.service';

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
   * Send a user message and receive an AI response.
   * @param {string} text — User message
   * @param {object} profile — From user.store
   * @param {Array} goals — From user.store
   * @param {Array} decisions — From dashboard.store (optional)
   */
  sendMessage: async (text, profile, goals = [], decisions = []) => {
    if (!text.trim()) return;

    const context = buildUserContext(profile, goals, decisions);
    const userMsg = {
      id: nextId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      typing: true,
      error: null,
      suggestedActions: [],
    }));

    try {
      const history = get().messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendChatMessage(text, context, history);

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
    } catch (err) {
      console.error('Chat send failed:', err);
      set({
        typing: false,
        error: 'Something went wrong. Please try again.',
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

  clearChat: () => set({ messages: [], suggestedActions: [], error: null }),
}));
