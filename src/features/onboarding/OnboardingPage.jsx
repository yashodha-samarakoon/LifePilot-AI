import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { saveUserProfile, addGoal, completeOnboarding } from '@/services/firestore.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  User,
  Briefcase,
  GraduationCap,
  Laptop,
  Building2,
  Store,
  Globe,
  Wallet,
  PiggyBank,
  Target,
  CheckCircle2,
  Plus,
  Trash2,
  Map,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import {
  ROLES,
  AGE_RANGES,
  RISK_TOLERANCE,
  GOAL_CATEGORIES,
  INTERACTION_PREFERENCES,
  APP_NAME,
} from '@/lib/constants';
import { COUNTRIES, getCurrencyForCountry } from '@/lib/countries';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils';
import { cn } from '@/lib/utils';

const roleIcons = { GraduationCap, Briefcase, Laptop, Building2, Store };
const prefIcons = { Map, MessageSquare, Compass };

const STEPS = [
  { title: 'About You', icon: User, description: 'Tell us about yourself' },
  { title: 'Your Role', icon: Briefcase, description: 'What best describes you?' },
  { title: 'Location', icon: Globe, description: 'Where are you based?' },
  { title: 'Finances', icon: Wallet, description: 'Your financial starting point' },
  { title: 'Goals', icon: Target, description: 'Set your financial goals' },
  { title: 'Preference', icon: Sparkles, description: 'How should LifePilot help you?' },
  { title: 'Summary', icon: CheckCircle2, description: 'Review and get started' },
];

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const { user, updateUserData } = useAuthStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    role: '',
    country: '',
    currency: 'USD',
    locale: 'en-US',
    monthlyIncome: '',
    monthlyExpenses: '',
    totalSavings: '',
    totalDebt: '',
    investments: '',
    riskTolerance: 'moderate',
    interactionMode: 'undecided',
  });

  const [goals, setGoals] = useState([
    { title: '', targetAmount: '', deadline: '', deadlineMonth: '', deadlineYear: '', dateType: 'exact', priority: 'medium', category: 'savings' },
  ]);

  const updateField = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-assign currency when country changes
      if (field === 'country') {
        const info = getCurrencyForCountry(value);
        next.currency = info.currency;
        next.locale = info.locale;
      }
      return next;
    });
  };

  const addGoalItem = () => {
    if (goals.length < 3) {
      setGoals([...goals, { title: '', targetAmount: '', deadline: '', deadlineMonth: '', deadlineYear: '', dateType: 'exact', priority: 'medium', category: 'savings' }]);
    }
  };

  const removeGoalItem = (index) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const updateGoal = (index, field, value) => {
    const updated = [...goals];
    updated[index][field] = value;
    setGoals(updated);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return formData.name.trim().length > 0;
      case 1: return !!formData.role;
      case 2: return !!formData.country;
      case 3: return !!formData.monthlyIncome;
      case 4: return true; // Goals are optional
      case 5: return !!formData.interactionMode;
      case 6: return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const uid = user.uid;

      // Save profile with onboarding flag as a fallback source of truth.
      await saveUserProfile(uid, {
        name: formData.name,
        age: formData.age,
        role: formData.role,
        country: formData.country,
        currency: formData.currency,
        locale: formData.locale,
        monthlyIncome: Number(formData.monthlyIncome) || 0,
        monthlyExpenses: Number(formData.monthlyExpenses) || 0,
        totalSavings: Number(formData.totalSavings) || 0,
        totalDebt: Number(formData.totalDebt) || 0,
        investments: Number(formData.investments) || 0,
        riskTolerance: formData.riskTolerance,
        interactionMode: formData.interactionMode,
        onboardingComplete: true,
      });

      for (const goal of goals) {
        if (goal.title && goal.targetAmount) {
          await addGoal(uid, {
            title: goal.title,
            targetAmount: Number(goal.targetAmount),
            currentAmount: 0,
            deadline: resolveDeadline(goal),
            priority: goal.priority,
            category: goal.category,
          });
        }
      }

      // Best-effort update of the user document. The profile document already
      // carries onboardingComplete as the fallback source of truth, so we do
      // not block the UI on this write.
      completeOnboarding(uid).catch((err) =>
        console.warn('[Onboarding] user doc update failed, using profile fallback:', err)
      );

      updateUserData({ onboardingComplete: true });
      navigate('/dashboard');
    } catch (err) {
      console.error('Onboarding failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const currencySymbol = getCurrencySymbol(formData.currency);

  // Resolve a flexible deadline into an actual Date. Exact dates cannot be in
  // the past; month/year-only choices map to the last day of that month or year.
  const resolveDeadline = (goal) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (goal.dateType === 'year' && goal.deadlineYear) {
      const year = Number(goal.deadlineYear);
      return new Date(Math.max(year, today.getFullYear()), 11, 31);
    }
    if (goal.dateType === 'month' && goal.deadlineMonth) {
      const [year, month] = goal.deadlineMonth.split('-').map(Number);
      const candidate = new Date(year, month, 0);
      return candidate < today ? new Date(today.getFullYear(), today.getMonth() + 1, 0) : candidate;
    }
    if (goal.deadline) {
      const date = new Date(goal.deadline);
      return date < today ? today : date;
    }
    return null;
  };

  const todayString = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-primary">
          <Compass className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg">{APP_NAME}</span>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-8">
        <div className="flex items-center gap-2 mb-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-full h-1.5 rounded-full transition-colors',
                  i <= step ? 'bg-primary-600' : 'bg-slate-200'
                )}
              />
              <span className={cn(
                'text-[10px] font-medium',
                i <= step ? 'text-primary-600' : 'text-slate-400'
              )}>
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 pt-8 pb-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">{STEPS[step].title}</h2>
            <p className="text-slate-500 mt-1">{STEPS[step].description}</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              {step === 0 && <StepAboutYou formData={formData} updateField={updateField} />}
              {step === 1 && <StepRole formData={formData} updateField={updateField} />}
              {step === 2 && <StepLocation formData={formData} updateField={updateField} />}
              {step === 3 && <StepFinances formData={formData} updateField={updateField} currencySymbol={currencySymbol} />}
              {step === 4 && (
                <StepGoals
                  goals={goals}
                  updateGoal={updateGoal}
                  addGoalItem={addGoalItem}
                  removeGoalItem={removeGoalItem}
                  currencySymbol={currencySymbol}
                  todayString={todayString}
                  currentYear={currentYear}
                />
              )}
              {step === 5 && <StepPreference formData={formData} updateField={updateField} />}
              {step === 6 && <StepSummary formData={formData} goals={goals} currencySymbol={currencySymbol} />}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleBack} disabled={step === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={saving || !canProceed()}>
                {saving ? 'Setting up...' : formData.interactionMode === 'decision' ? 'Start Chatting' : 'Launch My Dashboard'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 1: About You ──────────────────────────────── */
function StepAboutYou({ formData, updateField }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          placeholder="Enter your name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Age Range</Label>
        <div className="grid grid-cols-5 gap-2">
          {AGE_RANGES.map((range) => (
            <button
              key={range.value}
              type="button"
              onClick={() => updateField('age', range.value)}
              className={cn(
                'p-3 rounded-xl border-2 text-center text-sm font-medium transition-all',
                formData.age === range.value
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2: Your Role ──────────────────────────────── */
function StepRole({ formData, updateField }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {ROLES.map((role) => {
          const Icon = roleIcons[role.icon] || Briefcase;
          return (
            <button
              key={role.value}
              type="button"
              onClick={() => updateField('role', role.value)}
              className={cn(
                'flex items-center gap-3 w-full text-left p-4 rounded-xl border-2 transition-all',
                formData.role === role.value
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <div className={cn(
                'p-2 rounded-lg',
                formData.role === role.value ? 'bg-primary-100' : 'bg-slate-100'
              )}>
                <Icon className={cn(
                  'w-5 h-5',
                  formData.role === role.value ? 'text-primary-700' : 'text-slate-500'
                )} />
              </div>
              <span className="font-medium text-slate-900">{role.label}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-2">
        <Label className="mb-2 block">Risk Tolerance</Label>
        <div className="grid grid-cols-3 gap-2">
          {RISK_TOLERANCE.map((risk) => (
            <button
              key={risk.value}
              type="button"
              onClick={() => updateField('riskTolerance', risk.value)}
              className={cn(
                'p-3 rounded-xl border-2 text-center transition-all',
                formData.riskTolerance === risk.value
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <span className="text-sm font-medium block">{risk.label}</span>
              <span className="text-[11px] text-slate-500 mt-1 block">{risk.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 3: Location ───────────────────────────────── */
function StepLocation({ formData, updateField }) {
  const selectedCurrency = getCurrencyForCountry(formData.country);
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Country / Region</Label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-300 bg-white text-sm appearance-none"
            value={formData.country}
            onChange={(e) => updateField('country', e.target.value)}
          >
            <option value="">Select your country</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {formData.country && (
        <div className="bg-primary-50 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium text-primary-800">
            Currency: <span className="font-bold">{selectedCurrency.currency}</span> ({selectedCurrency.symbol})
          </p>
          <p className="text-xs text-primary-600">
            All financial values will be displayed in {selectedCurrency.currency}. You can change this later in Settings.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Step 4: Finances ───────────────────────────────── */
function StepFinances({ formData, updateField, currencySymbol }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="income">Monthly Income ({currencySymbol})</Label>
        <Input
          id="income"
          type="number"
          placeholder="50000"
          min="0"
          value={formData.monthlyIncome}
          onChange={(e) => updateField('monthlyIncome', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="expenses">Monthly Expenses ({currencySymbol})</Label>
        <Input
          id="expenses"
          type="number"
          placeholder="30000"
          min="0"
          value={formData.monthlyExpenses}
          onChange={(e) => updateField('monthlyExpenses', e.target.value)}
        />
      </div>
      {formData.monthlyIncome && formData.monthlyExpenses && (
        <div className="bg-primary-50 rounded-xl p-4">
          <p className="text-sm text-primary-700 font-medium">
            Monthly Capacity: {formatCurrency(Number(formData.monthlyIncome) - Number(formData.monthlyExpenses), formData.currency)}
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="savings">Total Savings ({currencySymbol})</Label>
          <Input
            id="savings"
            type="number"
            placeholder="100000"
            min="0"
            value={formData.totalSavings}
            onChange={(e) => updateField('totalSavings', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="debt">Total Debt ({currencySymbol})</Label>
          <Input
            id="debt"
            type="number"
            placeholder="0"
            min="0"
            value={formData.totalDebt}
            onChange={(e) => updateField('totalDebt', e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="investments">Investments ({currencySymbol})</Label>
        <Input
          id="investments"
          type="number"
          placeholder="0"
          min="0"
          value={formData.investments}
          onChange={(e) => updateField('investments', e.target.value)}
        />
        <p className="text-xs text-slate-400">Stocks, bonds, mutual funds, crypto, etc.</p>
      </div>
    </div>
  );
}

/* ─── Step 5: Goals ──────────────────────────────────── */
function StepGoals({ goals, updateGoal, addGoalItem, removeGoalItem, currencySymbol, todayString, currentYear }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-500">Add up to 3 financial goals.</p>
        <p className="text-sm text-primary-600 mt-1">
          You can skip this part and continue.
        </p>
      </div>
      {goals.map((goal, index) => (
        <div key={index} className="border border-slate-200 rounded-xl p-4 space-y-3 relative">
          {goals.length > 1 && (
            <button
              onClick={() => removeGoalItem(index)}
              className="absolute top-3 right-3 text-slate-400 hover:text-rose-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <Input
            placeholder="Goal title (e.g., Emergency Fund)"
            value={goal.title}
            onChange={(e) => updateGoal(index, 'title', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Target Amount ({currencySymbol})</Label>
              <Input
                type="number"
                placeholder="100000"
                value={goal.targetAmount}
                onChange={(e) => updateGoal(index, 'targetAmount', e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">When?</Label>
              <select
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                value={goal.dateType}
                onChange={(e) => updateGoal(index, 'dateType', e.target.value)}
              >
                <option value="exact">Exact date</option>
                <option value="month">Month &amp; year</option>
                <option value="year">Year only</option>
              </select>
            </div>
          </div>
          {goal.dateType === 'exact' && (
            <div>
              <Label className="text-xs">Target Date</Label>
              <Input
                type="date"
                min={todayString}
                value={goal.deadline}
                onChange={(e) => updateGoal(index, 'deadline', e.target.value)}
              />
            </div>
          )}
          {goal.dateType === 'month' && (
            <div>
              <Label className="text-xs">Target Month</Label>
              <Input
                type="month"
                min={todayString.slice(0, 7)}
                value={goal.deadlineMonth}
                onChange={(e) => updateGoal(index, 'deadlineMonth', e.target.value)}
              />
            </div>
          )}
          {goal.dateType === 'year' && (
            <div>
              <Label className="text-xs">Target Year</Label>
              <Input
                type="number"
                min={currentYear}
                placeholder={String(currentYear)}
                value={goal.deadlineYear}
                onChange={(e) => updateGoal(index, 'deadlineYear', e.target.value)}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <select
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                value={goal.category}
                onChange={(e) => updateGoal(index, 'category', e.target.value)}
              >
                {GOAL_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Priority</Label>
              <select
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                value={goal.priority}
                onChange={(e) => updateGoal(index, 'priority', e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>
      ))}

      {goals.length < 3 && (
        <Button variant="outline" className="w-full" onClick={addGoalItem}>
          <Plus className="w-4 h-4 mr-2" /> Add Another Goal
        </Button>
      )}
    </div>
  );
}

/* ─── Step 6: Interaction Preference ─────────────────── */
function StepPreference({ formData, updateField }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 mb-1">
        Choose how you'd like LifePilot to help you. You can switch anytime.
      </p>
      {INTERACTION_PREFERENCES.map((pref) => {
        const Icon = prefIcons[pref.icon] || Sparkles;
        return (
          <button
            key={pref.value}
            type="button"
            onClick={() => updateField('interactionMode', pref.value)}
            className={cn(
              'w-full text-left p-5 rounded-xl border-2 transition-all',
              formData.interactionMode === pref.value
                ? 'border-primary-600 bg-primary-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'p-2 rounded-lg mt-0.5',
                formData.interactionMode === pref.value ? 'bg-primary-100' : 'bg-slate-100'
              )}>
                <Icon className={cn(
                  'w-5 h-5',
                  formData.interactionMode === pref.value ? 'text-primary-700' : 'text-slate-500'
                )} />
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">{pref.label}</span>
                <span className="text-sm text-slate-500 mt-1 block">{pref.description}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Step 7: Summary ────────────────────────────────── */
function StepSummary({ formData, goals, currencySymbol }) {
  const validGoals = goals.filter((g) => g.title && g.targetAmount);
  const country = COUNTRIES.find((c) => c.code === formData.country);
  const prefLabel = INTERACTION_PREFERENCES.find((p) => p.value === formData.interactionMode)?.label;

  const formatGoalDeadline = (goal) => {
    if (goal.dateType === 'year' && goal.deadlineYear) return goal.deadlineYear;
    if (goal.dateType === 'month' && goal.deadlineMonth) {
      const [year, month] = goal.deadlineMonth.split('-');
      return `${new Date(Number(year), Number(month) - 1).toLocaleString(undefined, { month: 'short' })} ${year}`;
    }
    if (goal.deadline) {
      const d = new Date(goal.deadline);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return 'No target date';
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-slate-900">Your Profile</h4>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-slate-500">Name</span>
          <span className="font-medium">{formData.name}</span>
          <span className="text-slate-500">Age</span>
          <span className="font-medium">{formData.age}</span>
          <span className="text-slate-500">Role</span>
          <span className="font-medium capitalize">{formData.role?.replace('-', ' ')}</span>
          <span className="text-slate-500">Country</span>
          <span className="font-medium">{country?.name || '—'}</span>
          <span className="text-slate-500">Currency</span>
          <Badge variant="secondary">{formData.currency} ({currencySymbol})</Badge>
          <span className="text-slate-500">Monthly Income</span>
          <span className="font-medium">{formatCurrency(Number(formData.monthlyIncome) || 0, formData.currency)}</span>
          <span className="text-slate-500">Monthly Expenses</span>
          <span className="font-medium">{formatCurrency(Number(formData.monthlyExpenses) || 0, formData.currency)}</span>
          <span className="text-slate-500">Total Savings</span>
          <span className="font-medium">{formatCurrency(Number(formData.totalSavings) || 0, formData.currency)}</span>
          <span className="text-slate-500">Total Debt</span>
          <span className="font-medium">{formatCurrency(Number(formData.totalDebt) || 0, formData.currency)}</span>
          {formData.investments && (
            <>
              <span className="text-slate-500">Investments</span>
              <span className="font-medium">{formatCurrency(Number(formData.investments) || 0, formData.currency)}</span>
            </>
          )}
          <span className="text-slate-500">Risk Tolerance</span>
          <Badge variant={formData.riskTolerance === 'aggressive' ? 'danger' : formData.riskTolerance === 'conservative' ? 'success' : 'warning'}>
            {formData.riskTolerance}
          </Badge>
        </div>
      </div>

      {validGoals.length > 0 && (
        <div className="bg-primary-50 rounded-xl p-4 space-y-2">
          <h4 className="font-semibold text-primary-900">Your Goals</h4>
          {validGoals.map((goal, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex flex-col">
                <span className="text-primary-800">{goal.title}</span>
                <span className="text-xs text-primary-600/70">{formatGoalDeadline(goal)}</span>
              </div>
              <span className="font-medium">{formatCurrency(Number(goal.targetAmount), formData.currency)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-accent-50 rounded-xl p-4">
        <h4 className="font-semibold text-accent-900">LifePilot Mode</h4>
        <p className="text-sm text-accent-700 mt-1">{prefLabel}</p>
        <p className="text-xs text-accent-500 mt-1">You can switch between modes anytime from Settings.</p>
      </div>

      <div className="text-center text-sm text-slate-500 pt-2">
        Click <strong>{formData.interactionMode === 'decision' ? 'Start Chatting' : 'Launch My Dashboard'}</strong> to begin your personalized financial experience.
      </div>
    </div>
  );
}
