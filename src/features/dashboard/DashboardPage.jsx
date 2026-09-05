import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useUserStore } from '@/stores/user.store';
import { useDashboardStore } from '@/stores/dashboard.store';
import { calculateHealthScore, getScoreBreakdown } from '@/lib/scoring';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, getScoreColor, estimateMonthlyExpenses } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Wallet,
  PiggyBank,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertCircle,
  Sparkles,
  MessageSquare,
  FlaskConical,
  ArrowRight,
  Plus,
  X,
  Receipt,
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { profile, goals, fetchProfile, fetchGoals, loadingProfile, loadingGoals } = useUserStore();
  const { decisions, transactions, fetchDecisions, fetchTransactions, addTransaction } = useDashboardStore();
  const [healthScore, setHealthScore] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchProfile(user.uid);
      fetchGoals(user.uid);
      fetchDecisions(user.uid);
      fetchTransactions(user.uid);
    }
  }, [user]);

  const estimatedExpenses = useMemo(() => estimateMonthlyExpenses(transactions), [transactions]);

  const effectiveProfile = useMemo(() => {
    if (!profile) return null;
    return {
      ...profile,
      monthlyExpenses: profile.monthlyExpenses ?? estimatedExpenses,
    };
  }, [profile, estimatedExpenses]);

  useEffect(() => {
    if (effectiveProfile) {
      const score = calculateHealthScore(effectiveProfile, goals);
      setHealthScore(score);
      setBreakdown(getScoreBreakdown(effectiveProfile, goals));
    }
  }, [effectiveProfile, goals]);

  const currency = effectiveProfile?.currency || 'USD';
  const mode = effectiveProfile?.interactionMode || 'journey';

  const incomeValue =
    effectiveProfile?.monthlyIncome != null
      ? formatCurrency(effectiveProfile.monthlyIncome, currency)
      : 'Not Set';

  const expensesValue =
    profile?.monthlyExpenses != null
      ? formatCurrency(profile.monthlyExpenses, currency)
      : transactions.length > 0
        ? `${formatCurrency(estimatedExpenses, currency)} (estimated)`
        : 'Start Tracking';

  const savingsValue =
    effectiveProfile?.totalSavings != null
      ? formatCurrency(effectiveProfile.totalSavings, currency)
      : 'Not Set';

  const monthlyCapacity =
    (effectiveProfile?.monthlyIncome ?? 0) - (effectiveProfile?.monthlyExpenses ?? 0);

  const capacityValue =
    effectiveProfile?.monthlyIncome != null || effectiveProfile?.monthlyExpenses != null
      ? formatCurrency(monthlyCapacity, currency)
      : 'Not Available Yet';

  const capacityTrend =
    effectiveProfile?.monthlyIncome != null || effectiveProfile?.monthlyExpenses != null
      ? monthlyCapacity >= 0
        ? 'up'
        : 'down'
      : null;

  const activeGoals = goals.filter((g) => g.status === 'active');

  const showWelcomeSetup =
    !effectiveProfile?.monthlyIncome &&
    !effectiveProfile?.totalSavings &&
    !effectiveProfile?.totalDebt &&
    transactions.length === 0;

  if (loadingProfile || loadingGoals) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {effectiveProfile?.name || 'there'}!
          </h1>
          <p className="text-slate-500 mt-1">
            {mode === 'decision'
              ? 'Your financial snapshot and recent activity'
              : 'Your personalized financial overview'}
          </p>
        </div>
        <Link to="/chat">
          <Button variant="outline" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Ask AI
          </Button>
        </Link>
      </div>

      {/* First-time welcome setup */}
      {showWelcomeSetup && <WelcomeSetup onTrackExpense={() => setShowExpenseModal(true)} />}

      {/* Shared: Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Wallet}
          label="Monthly Income"
          value={incomeValue}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          icon={CreditCard}
          label="Monthly Expenses"
          value={expensesValue}
          color="text-rose-600"
          bgColor="bg-rose-50"
        />
        <StatCard
          icon={PiggyBank}
          label="Total Savings"
          value={savingsValue}
          trend="up"
          color="text-primary-600"
          bgColor="bg-primary-50"
        />
        <StatCard
          icon={capacityTrend === 'down' ? TrendingDown : TrendingUp}
          label="Monthly Capacity"
          value={capacityValue}
          trend={capacityTrend}
          color={capacityTrend === 'down' ? 'text-rose-600' : 'text-emerald-600'}
          bgColor={capacityTrend === 'down' ? 'bg-rose-50' : 'bg-emerald-50'}
        />
      </div>

      {/* Mode-specific content */}
      {mode === 'decision' ? (
        <DecisionModeContent profile={effectiveProfile} decisions={decisions} currency={currency} />
      ) : (
        <JourneyModeContent
          profile={effectiveProfile}
          goals={goals}
          activeGoals={activeGoals}
          healthScore={healthScore}
          breakdown={breakdown}
          currency={currency}
        />
      )}

      {/* Smart Insights (shared) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              <CardTitle>Smart Insights</CardTitle>
            </div>
            <Link to="/insights" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <CardDescription>Based on your current financial data</CardDescription>
        </CardHeader>
        <CardContent>
          <InsightsPanel profile={effectiveProfile} goals={goals} currency={currency} />
        </CardContent>
      </Card>

      {/* Add first expense modal */}
      {showExpenseModal && (
        <AddExpenseModal
          currency={currency}
          onClose={() => setShowExpenseModal(false)}
          onSave={async (data) => {
            if (!user?.uid) return;
            await addTransaction(user.uid, data);
            await fetchTransactions(user.uid);
            setShowExpenseModal(false);
          }}
        />
      )}
    </div>
  );
}

/* ─── Welcome Setup (first login) ───────────────────── */
function WelcomeSetup({ onTrackExpense }) {
  const cards = [
    {
      title: 'Add Monthly Income',
      description: 'So LifePilot can personalise your plan.',
      icon: Wallet,
      action: { type: 'link', to: '/settings', label: 'Add Income' },
    },
    {
      title: 'Add Savings',
      description: 'Track what you have already saved.',
      icon: PiggyBank,
      action: { type: 'link', to: '/settings', label: 'Add Savings' },
    },
    {
      title: 'Add Debt',
      description: 'Get a complete picture of liabilities.',
      icon: CreditCard,
      action: { type: 'link', to: '/settings', label: 'Add Debt' },
    },
    {
      title: 'Track First Expense',
      description: 'Start building your spending picture.',
      icon: Receipt,
      action: { type: 'button', onClick: onTrackExpense, label: 'Add Expense' },
    },
    {
      title: 'Create Financial Goal',
      description: 'Set something to work toward.',
      icon: Target,
      action: { type: 'link', to: '/goals', label: 'Create Goal' },
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-200">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-primary-100">
            <Sparkles className="w-6 h-6 text-primary-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Welcome to LifePilot AI</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Complete a few quick steps to build your financial profile. You can do these anytime.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const number = index + 1;
            return (
              <div
                key={card.title}
                className="relative bg-white rounded-xl border border-slate-200 p-4 hover:border-primary-300 transition-colors"
              >
                <span className="absolute top-3 right-3 text-xs font-bold text-slate-300">
                  {String(number).padStart(2, '0')}
                </span>
                <div className="p-2 rounded-lg bg-slate-50 w-fit mb-3">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">{card.title}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-3">{card.description}</p>
                {card.action.type === 'link' ? (
                  <Link
                    to={card.action.to}
                    className="inline-flex items-center justify-center gap-1 w-full rounded-lg bg-primary-600 text-white text-sm font-medium px-3 py-2 hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> {card.action.label}
                  </Link>
                ) : (
                  <Button size="sm" className="w-full gap-1" onClick={card.action.onClick}>
                    <Plus className="w-3.5 h-3.5" /> {card.action.label}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Add First Expense Modal ───────────────────────── */
function AddExpenseModal({ currency, onClose, onSave }) {
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: EXPENSE_CATEGORIES[0] || 'Other',
    date: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    setSaving(true);
    try {
      await onSave({
        description: form.description,
        amount: Number(form.amount),
        type: 'expense',
        category: form.category,
        date: new Date(form.date).getTime(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-bold text-slate-900">Track Your First Expense</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-description">Description</Label>
            <Input
              id="expense-description"
              placeholder="e.g. Grocery shopping"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount ({currency})</Label>
            <Input
              id="expense-amount"
              type="number"
              min="0"
              placeholder="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-category">Category</Label>
            <select
              id="expense-category"
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-date">Date</Label>
            <Input
              id="expense-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!form.description || !form.amount || saving}>
              {saving ? 'Saving...' : 'Save Expense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Journey Mode Content ──────────────────────────── */
function JourneyModeContent({ profile, goals, activeGoals, healthScore, breakdown, currency }) {
  const scoreAvailable = healthScore != null;

  return (
    <>
      {/* Health Score + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center justify-center py-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Financial Health</h3>
          {scoreAvailable ? (
            <>
              <ScoreRing score={healthScore} size={160} strokeWidth={12} />
              <div className="mt-4 grid grid-cols-3 gap-4 text-center text-xs">
                <div><span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1" />0-40</div>
                <div><span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />41-70</div>
                <div><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />71-100</div>
              </div>
            </>
          ) : (
            <div className="text-center px-6">
              <div className="p-4 rounded-full bg-slate-100 w-fit mx-auto mb-3">
                <Sparkles className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">
                Complete your profile and track expenses to generate your Financial Health Score.
              </p>
            </div>
          )}
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Score Breakdown</CardTitle>
            <CardDescription>
              {scoreAvailable ? 'Estimated based on your current data' : 'Add financial details to see your breakdown'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {scoreAvailable ? (
              breakdown.map((item) => {
                const colorInfo = getScoreColor(item.score);
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">
                        {item.label}
                        <span className="text-xs text-slate-400 ml-2">({item.weight}%)</span>
                      </span>
                      <span className={`text-sm font-semibold ${colorInfo.text}`}>{item.score}/100</span>
                    </div>
                    <Progress value={item.score} color={colorInfo.bg} />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Your score breakdown will appear once enough data is available.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Goal Progress</CardTitle>
            <CardDescription>{activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}</CardDescription>
          </div>
          <Link to="/goals">
            <Button variant="outline" size="sm">Manage Goals</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {activeGoals.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active goals yet.</p>
              <Link to="/goals" className="text-primary-600 text-sm font-medium hover:underline mt-2 inline-block">
                Create your first goal
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGoals.slice(0, 4).map((goal) => (
                <GoalCard key={goal.id} goal={goal} currency={currency} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/* ─── Decision Mode Content ─────────────────────────── */
function DecisionModeContent({ profile, decisions, currency }) {
  const hasIncome = profile?.monthlyIncome != null && profile.monthlyIncome > 0;
  const savingsRate = hasIncome
    ? Math.round(((profile.monthlyIncome - (profile.monthlyExpenses || 0)) / profile.monthlyIncome) * 100)
    : null;
  const availableFunds =
    (profile?.totalSavings ?? 0) + (profile?.investments ?? 0);
  const monthlyCapacity = (profile?.monthlyIncome || 0) - (profile?.monthlyExpenses || 0);
  const debtRatio = hasIncome
    ? Math.round(((profile?.totalDebt || 0) / (profile.monthlyIncome * 12)) * 100)
    : null;

  return (
    <>
      {/* Quick snapshot + AI CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Financial Snapshot</CardTitle>
            <CardDescription>Based on your current profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MiniStat label="Savings Rate" value={savingsRate != null ? `${savingsRate}%` : '—'} />
              <MiniStat
                label="Available Funds"
                value={profile?.totalSavings != null || profile?.investments != null ? formatCurrency(availableFunds, currency) : 'Not Set'}
              />
              <MiniStat
                label="Monthly Capacity"
                value={profile?.monthlyIncome != null ? formatCurrency(monthlyCapacity, currency) : 'Not Set'}
              />
              <MiniStat label="Debt Ratio" value={debtRatio != null ? `${debtRatio}%` : '—'} />
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center justify-center text-center py-8 bg-gradient-to-br from-primary-50 to-white border-primary-200">
          <div className="p-3 rounded-full bg-primary-100 mb-4">
            <MessageSquare className="w-6 h-6 text-primary-700" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Ask AI Anything</h3>
          <p className="text-sm text-slate-500 mb-4">Get personalized guidance for any financial decision</p>
          <Link to="/chat">
            <Button>Start Conversation</Button>
          </Link>
        </Card>
      </div>

      {/* Recent Decisions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Decisions</CardTitle>
            <CardDescription>Previously analysed scenarios</CardDescription>
          </div>
          <Link to="/decisions">
            <Button variant="outline" size="sm">Decision Lab</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {decisions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No decisions analysed yet.</p>
              <Link to="/decisions" className="text-primary-600 text-sm font-medium hover:underline mt-2 inline-block">
                Run your first simulation
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {decisions.slice(0, 3).map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-800 capitalize">{d.type.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-xs text-slate-400">{d.result?.analysis?.slice(0, 80)}...</p>
                  </div>
                  <div className="flex gap-3 text-xs">
                    {d.result?.affordabilityScore != null && (
                      <Badge variant="secondary">{d.result.affordabilityScore}% afford.</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/* ─── Shared Components ─────────────────────────────── */
function StatCard({ icon: Icon, label, value, trend, color, bgColor }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-xl ${bgColor}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          {trend === 'up' && <ArrowUpRight className="w-4 h-4 text-emerald-500" />}
          {trend === 'down' && <ArrowDownRight className="w-4 h-4 text-rose-500" />}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900 leading-tight" title={typeof value === 'string' ? value : undefined}>{value}</p>
          <p className="text-xs text-slate-500 mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function GoalCard({ goal, currency }) {
  const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
  const colorInfo = progress >= 70 ? 'bg-emerald-500' : progress >= 40 ? 'bg-amber-500' : 'bg-primary-600';

  return (
    <div className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-slate-900 truncate">{goal.title}</h4>
        <Badge variant={goal.priority === 'high' ? 'danger' : goal.priority === 'medium' ? 'warning' : 'secondary'}>
          {goal.priority}
        </Badge>
      </div>
      <div className="flex items-end justify-between mb-2">
        <span className="text-sm text-slate-500">
          {formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}
        </span>
        <span className="text-sm font-semibold text-slate-700">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} color={colorInfo} />
    </div>
  );
}

function InsightsPanel({ profile, goals, currency }) {
  const insights = generateLocalInsights(profile, goals, currency);
  if (insights.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-4">Complete your profile to see personalized insights.</p>;
  }
  return (
    <div className="space-y-3">
      {insights.map((insight, i) => (
        <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${insight.bg}`}>
          {insight.type === 'warning' ? (
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className="text-sm font-medium text-slate-800">{insight.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{insight.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function generateLocalInsights(profile, goals, currency) {
  if (!profile) return [];
  const insights = [];
  const income = profile.monthlyIncome || 0;
  const expenses = profile.monthlyExpenses || 0;
  const savings = profile.totalSavings || 0;

  if (income > 0) {
    const rate = ((income - expenses) / income) * 100;
    if (rate >= 30) {
      insights.push({ title: 'Excellent savings rate', description: `You are saving ${rate.toFixed(0)}% of your income. Based on current data, you may consider investing surplus funds.`, type: 'sparkle', bg: 'bg-emerald-50' });
    } else if (rate < 10) {
      insights.push({ title: 'Savings rate needs attention', description: `You are only saving ${rate.toFixed(0)}% of your income. Consider reviewing expenses to aim for at least 20%.`, type: 'warning', bg: 'bg-amber-50' });
    }
  }

  if (savings > 0 && expenses > 0) {
    const months = savings / expenses;
    if (months < 3) {
      insights.push({ title: 'Build your emergency fund', description: `Your savings may cover approximately ${months.toFixed(1)} months of expenses. A common target is 3-6 months.`, type: 'warning', bg: 'bg-amber-50' });
    }
  }

  if (profile.totalDebt > 0 && income > 0) {
    const ratio = (profile.totalDebt / (income * 12)) * 100;
    if (ratio > 100) {
      insights.push({ title: 'High debt-to-income ratio', description: 'Your debt may exceed your annual income. Consider a structured debt reduction strategy.', type: 'warning', bg: 'bg-rose-50' });
    }
  }

  const activeGoals = goals.filter((g) => g.status === 'active');
  if (activeGoals.length === 0) {
    insights.push({ title: 'Set financial goals', description: 'Setting specific, measurable goals may increase your chances of achieving financial targets.', type: 'sparkle', bg: 'bg-primary-50' });
  }

  return insights.slice(0, 4);
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-10 w-10 rounded-xl" /><Skeleton className="h-7 w-24 mt-3" /><Skeleton className="h-4 w-20 mt-1" /></CardContent></Card>
        ))}
      </div>
    </div>
  );
}
