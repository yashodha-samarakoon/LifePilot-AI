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
  Map,
  MessageSquare,
  Sparkles,
  Car,
  Home,
  Umbrella,
  TrendingUp,
} from 'lucide-react';
import { ROLES, RISK_TOLERANCE, INTERACTION_PREFERENCES, APP_NAME } from '@/lib/constants';
import { COUNTRIES, getCurrencyForCountry } from '@/lib/countries';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils';
import { cn } from '@/lib/utils';

const roleIcons = { GraduationCap, Briefcase, Laptop, Building2, Store };
const prefIcons = { Map, MessageSquare, Compass };

const MAIN_GOALS = [
  { value: 'save-money', label: 'Save Money', icon: PiggyBank, category: 'savings' },
  { value: 'buy-vehicle', label: 'Buy a Vehicle', icon: Car, category: 'purchase' },
  { value: 'buy-house', label: 'Buy a House', icon: Home, category: 'purchase' },
  { value: 'emergency-fund', label: 'Emergency Fund', icon: Umbrella, category: 'emergency-fund' },
  { value: 'investing', label: 'Investing', icon: TrendingUp, category: 'investment' },
  { value: '', label: 'Skip for now', icon: CheckCircle2, category: '' },
];

const STEPS = [
  { title: 'About You', icon: User, description: 'Let\'s start with the basics' },
  { title: 'Your Profile', icon: Briefcase, description: 'Tell us about yourself' },
  { title: 'Income', icon: Wallet, description: 'Optional — you can add this later' },
  { title: 'Main Goal', icon: Target, description: 'What are you working toward?' },
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
    riskTolerance: 'moderate',
    interactionMode: 'undecided',
    mainGoal: '',
  });

  const updateField = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'country') {
        const info = getCurrencyForCountry(value);
        next.currency = info.currency;
        next.locale = info.locale;
      }
      return next;
    });
  };

  const canProceed = () => {
    switch (step) {
      case 0: return formData.name.trim().length > 0 && formData.age !== '';
      case 1: return !!formData.role && !!formData.country;
      case 2: return true; // Income is optional
      case 3: return true; // Goal is optional
      case 4: return !!formData.interactionMode;
      case 5: return true;
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

      await saveUserProfile(uid, {
        name: formData.name,
        age: Number(formData.age) || null,
        role: formData.role,
        occupation: formData.role,
        country: formData.country,
        currency: formData.currency,
        locale: formData.locale,
        monthlyIncome: formData.monthlyIncome ? Number(formData.monthlyIncome) : null,
        riskTolerance: formData.riskTolerance,
        interactionMode: formData.interactionMode,
        mainGoal: formData.mainGoal,
        financialGoal: formData.mainGoal,
        onboardingComplete: true,
      });

      // Create a starter goal if the user selected one.
      if (formData.mainGoal) {
        const goalConfig = MAIN_GOALS.find((g) => g.value === formData.mainGoal);
        const defaultTargets = {
          'save-money': 100000,
          'buy-vehicle': 800000,
          'buy-house': 5000000,
          'emergency-fund': formData.monthlyIncome ? Number(formData.monthlyIncome) * 3 : 100000,
          'investing': 100000,
        };
        await addGoal(uid, {
          title: goalConfig.label,
          targetAmount: defaultTargets[formData.mainGoal] || 100000,
          currentAmount: 0,
          deadline: null,
          priority: 'medium',
          category: goalConfig.category,
        });
      }

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
              {step === 1 && <StepProfile formData={formData} updateField={updateField} />}
              {step === 2 && <StepIncome formData={formData} updateField={updateField} currencySymbol={currencySymbol} />}
              {step === 3 && <StepMainGoal formData={formData} updateField={updateField} />}
              {step === 4 && <StepPreference formData={formData} updateField={updateField} />}
              {step === 5 && <StepSummary formData={formData} currencySymbol={currencySymbol} />}
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
        <Label htmlFor="age">Age</Label>
        <Input
          id="age"
          type="number"
          min={13}
          max={120}
          placeholder="25"
          value={formData.age}
          onChange={(e) => updateField('age', e.target.value)}
        />
        <p className="text-xs text-slate-400">We use this to personalise guidance for your life stage.</p>
      </div>
    </div>
  );
}

/* ─── Step 2: Your Profile ───────────────────────────── */
function StepProfile({ formData, updateField }) {
  const selectedCurrency = getCurrencyForCountry(formData.country);
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>What best describes you?</Label>
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
      </div>

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
        <div className="bg-primary-50 rounded-xl p-4 space-y-1">
          <p className="text-sm font-medium text-primary-800">
            Currency: <span className="font-bold">{selectedCurrency.currency}</span> ({selectedCurrency.symbol})
          </p>
          <p className="text-xs text-primary-600">
            You can change this later in Settings.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Risk Tolerance</Label>
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

/* ─── Step 3: Income ─────────────────────────────────── */
function StepIncome({ formData, updateField, currencySymbol }) {
  return (
    <div className="space-y-4">
      <div className="bg-primary-50 rounded-xl p-4">
        <p className="text-sm text-primary-800">
          This is optional. You can add or update your income anytime from Settings.
        </p>
      </div>
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
    </div>
  );
}

/* ─── Step 4: Main Goal ───────────────────────────────── */
function StepMainGoal({ formData, updateField }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Select your main financial focus. You can change or add more goals later.
      </p>
      <div className="grid grid-cols-1 gap-3">
        {MAIN_GOALS.map((goal) => {
          const Icon = goal.icon;
          const isSelected = formData.mainGoal === goal.value;
          return (
            <button
              key={goal.value || 'skip'}
              type="button"
              onClick={() => updateField('mainGoal', goal.value)}
              className={cn(
                'flex items-center gap-3 w-full text-left p-4 rounded-xl border-2 transition-all',
                isSelected
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <div className={cn(
                'p-2 rounded-lg',
                isSelected ? 'bg-primary-100' : 'bg-slate-100'
              )}>
                <Icon className={cn(
                  'w-5 h-5',
                  isSelected ? 'text-primary-700' : 'text-slate-500'
                )} />
              </div>
              <span className="font-medium text-slate-900">{goal.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step 5: Interaction Preference ─────────────────── */
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

/* ─── Step 6: Summary ────────────────────────────────── */
function StepSummary({ formData, currencySymbol }) {
  const country = COUNTRIES.find((c) => c.code === formData.country);
  const prefLabel = INTERACTION_PREFERENCES.find((p) => p.value === formData.interactionMode)?.label;
  const mainGoalLabel = MAIN_GOALS.find((g) => g.value === formData.mainGoal)?.label;

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
          <span className="font-medium">
            {formData.monthlyIncome
              ? formatCurrency(Number(formData.monthlyIncome), formData.currency)
              : 'Not set yet'}
          </span>
          <span className="text-slate-500">Risk Tolerance</span>
          <Badge variant={formData.riskTolerance === 'aggressive' ? 'danger' : formData.riskTolerance === 'conservative' ? 'success' : 'warning'}>
            {formData.riskTolerance}
          </Badge>
          {mainGoalLabel && mainGoalLabel !== 'Skip for now' && (
            <>
              <span className="text-slate-500">Main Goal</span>
              <span className="font-medium">{mainGoalLabel}</span>
            </>
          )}
        </div>
      </div>

      <div className="bg-accent-50 rounded-xl p-4">
        <h4 className="font-semibold text-accent-900">LifePilot Mode</h4>
        <p className="text-sm text-accent-700 mt-1">{prefLabel}</p>
        <p className="text-xs text-accent-500 mt-1">You can switch between modes anytime from Settings.</p>
      </div>

      <div className="text-center text-sm text-slate-500 pt-2">
        Click <strong>{formData.interactionMode === 'decision' ? 'Start Chatting' : 'Launch My Dashboard'}</strong> to begin your personalised financial experience.
      </div>
    </div>
  );
}
