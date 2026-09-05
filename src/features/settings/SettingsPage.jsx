import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useUserStore } from '@/stores/user.store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { ROLES, INTERACTION_PREFERENCES, RISK_TOLERANCE } from '@/lib/constants';
import { COUNTRIES, getCountryByCode } from '@/lib/countries';
import { MemoryPanel } from './MemoryPanel';
import {
  User,
  Wallet,
  Settings as SettingsIcon,
  Globe,
  Database,
  Save,
  CheckCircle2,
  ArrowRight,
  Map,
  MessageSquare,
  Compass,
} from 'lucide-react';

const iconMap = { Map, MessageSquare, Compass };

export function SettingsPage() {
  const { user } = useAuthStore();
  const { profile, fetchProfile, updateProfile } = useUserStore();
  const [section, setSection] = useState('personal');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state — initialized when profile loads
  const [personalForm, setPersonalForm] = useState({});
  const [financialForm, setFinancialForm] = useState({});
  const [prefForm, setPrefForm] = useState({});
  const [currencyForm, setCurrencyForm] = useState({});

  useEffect(() => {
    if (user?.uid) fetchProfile(user.uid);
  }, [user]);

  useEffect(() => {
    if (profile) {
      setPersonalForm({
        name: profile.name || '',
        age: profile.age || '',
        role: profile.role || '',
      });
      setFinancialForm({
        monthlyIncome: profile.monthlyIncome || '',
        monthlyExpenses: profile.monthlyExpenses || '',
        totalSavings: profile.totalSavings || '',
        totalDebt: profile.totalDebt || '',
        investments: profile.investments || '',
      });
      setPrefForm({
        interactionMode: profile.interactionMode || 'undecided',
        riskTolerance: profile.riskTolerance || 'moderate',
      });
      setCurrencyForm({
        country: profile.country || '',
        currency: profile.currency || 'USD',
        locale: profile.locale || 'en-US',
      });
    }
  }, [profile]);

  const handleSave = async (data) => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await updateProfile(user.uid, data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleMemoryUpdate = async (data) => {
    if (!user?.uid) return;
    await updateProfile(user.uid, data);
  };

  const sections = [
    { value: 'personal', label: 'Personal Info', icon: User },
    { value: 'financial', label: 'Financial Profile', icon: Wallet },
    { value: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { value: 'currency', label: 'Currency', icon: Globe },
    { value: 'memory', label: 'Personal Memory', icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your profile, preferences, and personal data</p>
      </div>

      {/* Section nav */}
      <div className="flex flex-wrap gap-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.value}
              onClick={() => setSection(s.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                section === s.value
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Saved indicator */}
      {saved && (
        <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium animate-fade-in">
          <CheckCircle2 className="w-4 h-4" /> Changes saved successfully
        </div>
      )}

      {/* Section Content */}
      {section === 'personal' && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Edit your basic profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-name">Name</Label>
              <Input
                id="settings-name"
                value={personalForm.name}
                onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-age">Age</Label>
              <Input
                id="settings-age"
                type="number"
                min={13}
                max={120}
                placeholder="25"
                value={personalForm.age}
                onChange={(e) => setPersonalForm({ ...personalForm, age: Number(e.target.value) || '' })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setPersonalForm({ ...personalForm, role: r.value })}
                    className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                      personalForm.role === r.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={() => handleSave(personalForm)}
              disabled={saving}
              className="gap-2"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      )}

      {section === 'financial' && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Profile</CardTitle>
            <CardDescription>Update your financial data. All amounts in {profile?.currency || 'USD'}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="settings-income">Monthly Income</Label>
                <Input
                  id="settings-income"
                  type="number"
                  value={financialForm.monthlyIncome}
                  onChange={(e) => setFinancialForm({ ...financialForm, monthlyIncome: Number(e.target.value) || '' })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-expenses">Monthly Expenses</Label>
                <Input
                  id="settings-expenses"
                  type="number"
                  value={financialForm.monthlyExpenses}
                  onChange={(e) => setFinancialForm({ ...financialForm, monthlyExpenses: Number(e.target.value) || '' })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-savings">Total Savings</Label>
                <Input
                  id="settings-savings"
                  type="number"
                  value={financialForm.totalSavings}
                  onChange={(e) => setFinancialForm({ ...financialForm, totalSavings: Number(e.target.value) || '' })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-debt">Total Debt</Label>
                <Input
                  id="settings-debt"
                  type="number"
                  value={financialForm.totalDebt}
                  onChange={(e) => setFinancialForm({ ...financialForm, totalDebt: Number(e.target.value) || '' })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-investments">Investments</Label>
                <Input
                  id="settings-investments"
                  type="number"
                  value={financialForm.investments}
                  onChange={(e) => setFinancialForm({ ...financialForm, investments: Number(e.target.value) || '' })}
                />
              </div>
            </div>
            <Button
              onClick={() => handleSave(financialForm)}
              disabled={saving}
              className="gap-2"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      )}

      {section === 'preferences' && (
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize how LifePilot interacts with you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Interaction Mode */}
            <div>
              <Label className="text-sm font-semibold text-slate-900 mb-3 block">Interaction Mode</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {INTERACTION_PREFERENCES.map((pref) => {
                  const Icon = iconMap[pref.icon] || Compass;
                  return (
                    <button
                      key={pref.value}
                      type="button"
                      onClick={() => setPrefForm({ ...prefForm, interactionMode: pref.value })}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        prefForm.interactionMode === pref.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${prefForm.interactionMode === pref.value ? 'text-primary-600' : 'text-slate-400'}`} />
                      <h4 className={`text-sm font-semibold ${prefForm.interactionMode === pref.value ? 'text-primary-700' : 'text-slate-700'}`}>
                        {pref.label}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{pref.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Risk Tolerance */}
            <div>
              <Label className="text-sm font-semibold text-slate-900 mb-3 block">Risk Tolerance</Label>
              <div className="grid grid-cols-3 gap-3">
                {RISK_TOLERANCE.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setPrefForm({ ...prefForm, riskTolerance: r.value })}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      prefForm.riskTolerance === r.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm font-medium">{r.label}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{r.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => handleSave(prefForm)}
              disabled={saving}
              className="gap-2"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </CardContent>
        </Card>
      )}

      {section === 'currency' && (
        <Card>
          <CardHeader>
            <CardTitle>Currency & Region</CardTitle>
            <CardDescription>Change your default currency and country</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-country">Country</Label>
              <select
                id="settings-country"
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={currencyForm.country}
                onChange={(e) => {
                  const country = getCountryByCode(e.target.value);
                  setCurrencyForm({
                    country: e.target.value,
                    currency: country?.currency || currencyForm.currency,
                    locale: country?.locale || currencyForm.locale,
                  });
                }}
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <div className="flex h-10 items-center px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 font-medium">
                  {currencyForm.currency}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Locale</Label>
                <div className="flex h-10 items-center px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 font-medium">
                  {currencyForm.locale}
                </div>
              </div>
            </div>

            <Button
              onClick={() => handleSave(currencyForm)}
              disabled={saving}
              className="gap-2"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Update Currency'}
            </Button>
          </CardContent>
        </Card>
      )}

      {section === 'memory' && (
        <MemoryPanel profile={profile} onUpdateProfile={handleMemoryUpdate} />
      )}
    </div>
  );
}
