import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Database,
  Pencil,
  Trash2,
  CheckCircle2,
  MessageSquare,
  User,
  Save,
  X,
} from 'lucide-react';

/**
 * MemoryPanel — Displays confirmed facts and conversational context.
 * Each item shows label, value, source, and edit/remove actions.
 */
export function MemoryPanel({ profile, onUpdateProfile }) {
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Build confirmed facts from profile
  const confirmedFacts = buildConfirmedFacts(profile);
  const conversationContext = buildConversationContext(profile);

  const startEdit = (key, currentValue) => {
    setEditingKey(key);
    setEditValue(String(currentValue || ''));
  };

  const saveEdit = (key) => {
    if (onUpdateProfile) {
      onUpdateProfile({ [key]: editValue });
    }
    setEditingKey(null);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  return (
    <div className="space-y-6">
      {/* Confirmed Facts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary-600" />
            <CardTitle>Confirmed Facts</CardTitle>
          </div>
          <CardDescription>
            These facts affect calculations and AI responses. Edit to update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {confirmedFacts.length === 0 ? (
            <p className="text-sm text-slate-400">No confirmed facts yet. Complete onboarding to populate.</p>
          ) : (
            <div className="space-y-2">
              {confirmedFacts.map((fact) => (
                <div key={fact.key} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-slate-500">{fact.label}</span>
                      <Badge variant="outline" className="text-[10px] py-0">
                        {fact.source}
                      </Badge>
                    </div>
                    {editingKey === fact.key ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          className="h-8 text-sm"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(fact.key); if (e.key === 'Escape') cancelEdit(); }}
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => saveEdit(fact.key)}>
                          <Save className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={cancelEdit}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-slate-900">{fact.displayValue || '—'}</p>
                    )}
                  </div>
                  {editingKey !== fact.key && (
                    <button
                      onClick={() => startEdit(fact.key, fact.rawValue)}
                      className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation Context */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            <CardTitle>Conversation Context</CardTitle>
          </div>
          <CardDescription>
            Context derived from your interactions. Improves AI responses but does not affect calculations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversationContext.length === 0 ? (
            <p className="text-sm text-slate-400">No conversation context yet. Chat with AI Companion to build context.</p>
          ) : (
            <div className="space-y-2">
              {conversationContext.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                  <div className="p-1.5 rounded-lg bg-slate-100 flex-shrink-0">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────── */
function buildConfirmedFacts(profile) {
  if (!profile) return [];
  const facts = [];

  const addFact = (key, label, value, source, displayValue) => {
    if (value != null && value !== '' && value !== 0) {
      facts.push({ key, label, rawValue: value, displayValue: displayValue || String(value), source });
    }
  };

  addFact('name', 'Name', profile.name, 'onboarding');
  addFact('age', 'Age Range', profile.age, 'onboarding');
  addFact('role', 'Role', profile.role, 'onboarding', profile.role?.replace('-', ' '));
  addFact('country', 'Country', profile.country, 'onboarding');
  addFact('currency', 'Currency', profile.currency, 'onboarding');
  addFact('monthlyIncome', 'Monthly Income', profile.monthlyIncome, 'onboarding', profile.monthlyIncome ? `${Number(profile.monthlyIncome).toLocaleString()} ${profile.currency || ''}` : null);
  addFact('monthlyExpenses', 'Monthly Expenses', profile.monthlyExpenses, 'onboarding', profile.monthlyExpenses ? `${Number(profile.monthlyExpenses).toLocaleString()} ${profile.currency || ''}` : null);
  addFact('totalSavings', 'Total Savings', profile.totalSavings, 'onboarding', profile.totalSavings ? `${Number(profile.totalSavings).toLocaleString()} ${profile.currency || ''}` : null);
  addFact('totalDebt', 'Total Debt', profile.totalDebt, 'onboarding', profile.totalDebt ? `${Number(profile.totalDebt).toLocaleString()} ${profile.currency || ''}` : null);
  addFact('investments', 'Investments', profile.investments, 'onboarding', profile.investments ? `${Number(profile.investments).toLocaleString()} ${profile.currency || ''}` : null);
  addFact('interactionMode', 'Interaction Mode', profile.interactionMode, 'onboarding', profile.interactionMode?.replace('-', ' '));

  return facts;
}

function buildConversationContext(profile) {
  if (!profile) return [];
  const context = [];

  if (profile.interactionMode) {
    context.push({ label: 'Preferred interaction style', value: profile.interactionMode.replace('-', ' ') });
  }
  if (profile.country) {
    context.push({ label: 'Financial context region', value: profile.country });
  }
  if (profile.role) {
    context.push({ label: 'Professional context', value: profile.role.replace('-', ' ') });
  }

  return context;
}
