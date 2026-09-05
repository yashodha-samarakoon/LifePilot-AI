import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useUserStore } from '@/stores/user.store';
import { useChatStore } from '@/stores/chat.store';
import { ChatMessage } from './ChatMessage';
import { ActionCard } from './ActionCard';
import { Button } from '@/components/ui/Button';
import {
  Send,
  Sparkles,
  MessageSquare,
  Trash2,
  Target,
  FlaskConical,
  TrendingUp,
} from 'lucide-react';

const QUICK_ACTIONS = [
  { label: 'Can I afford a vehicle?', icon: 'Car' },
  { label: 'How is my financial health?', icon: 'TrendingUp' },
  { label: 'Help me plan my goals', icon: 'Target' },
  { label: 'Should I invest?', icon: 'FlaskConical' },
];

export function ChatPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile, goals, fetchProfile, fetchGoals } = useUserStore();
  const { messages, typing, error, sendMessage, clearChat, addSystemMessage, loadMessages } = useChatStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (user?.uid) {
      loadMessages(user.uid);
      fetchProfile(user.uid);
      fetchGoals(user.uid);
    }
  }, [user, loadMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = async (text) => {
    const message = text || input.trim();
    if (!message) return;
    setInput('');
    await sendMessage(message, profile, goals, [], user?.uid);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAction = (action) => {
    switch (action.type) {
      case 'run_decision':
        navigate('/decisions');
        break;
      case 'create_goal':
        navigate('/goals');
        break;
      case 'view_insights':
        navigate('/insights');
        break;
      case 'update_profile':
        navigate('/settings');
        break;
      default:
        addSystemMessage(`Action "${action.label}" acknowledged. This will be available when connected to a backend.`);
        break;
    }
  };

  const handleClear = () => {
    clearChat(user?.uid);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary-50">
            <MessageSquare className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">AI Companion</h1>
            <p className="text-xs text-slate-500">
              {profile?.name
                ? `Personalized for ${profile.name} — understands your financial context`
                : 'Your personalized AI financial assistant'}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <Trash2 className="w-4 h-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4">
        {messages.length === 0 && (
          <WelcomeScreen
            name={profile?.name}
            onQuickAction={(label) => handleSend(label)}
          />
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} profile={profile} onAction={handleAction} />
        ))}

        {typing && <TypingIndicator />}

        {error && (
          <div className="flex justify-center">
            <div className="bg-rose-50 text-rose-600 text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 pt-4 pb-2">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything — say hi, ask about your finances, or tell me a goal..."
              rows={1}
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || typing}
            className="h-12 w-12 p-0 rounded-xl flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-[11px] text-slate-400 text-center mt-2">
          LifePilot AI provides guidance based on your profile. Always verify important financial decisions.
        </p>
      </div>
    </div>
  );
}

/* ─── Welcome Screen ──────────────────────────────────── */
function WelcomeScreen({ name, onQuickAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-2xl bg-primary-50 mb-6">
        <Sparkles className="w-8 h-8 text-primary-600" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">
        {name ? `Hello, ${name}!` : 'Welcome to LifePilot AI'}
      </h2>
      <p className="text-slate-500 max-w-md mb-8">
        I understand your personal financial situation and can help you make better decisions. Try asking:
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onQuickAction(action.label)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-all"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Typing Indicator ────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 max-w-2xl">
      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 text-primary-600" />
      </div>
      <div className="chat-bubble-ai flex items-center gap-1.5 py-4">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}
