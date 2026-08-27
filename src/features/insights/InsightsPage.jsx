import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useUserStore } from '@/stores/user.store';
import { useDashboardStore } from '@/stores/dashboard.store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { calculateHealthScore, getScoreBreakdown } from '@/lib/scoring';
import { formatCurrency, getScoreColor } from '@/lib/utils';
import {
  Sparkles,
  Eye,
  TrendingUp,
  Heart,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Shield,
  ArrowRight,
  RefreshCw,
  PiggyBank,
  CreditCard,
  Wallet,
} from 'lucide-react';

const TABS = [
  { value: 'blind-spots', label: 'Blind Spots', icon: Eye },
  { value: 'opportunities', label: 'Opportunities', icon: TrendingUp },
  { value: 'wellness', label: 'Financial Wellness', icon: Heart },
];

export function InsightsPage() {
  const { user } = useAuthStore();
  const { profile, goals, fetchProfile, fetchGoals } = useUserStore();
  const { decisions, fetchDecisions } = useDashboardStore();
  const [activeTab, setActiveTab] = useState('blind-spots');
  const [analysisRun, setAnalysisRun] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchProfile(user.uid);
      fetchGoals(user.uid);
      fetchDecisions(user.uid);
    }
  }, [user]);

  const currency = profile?.currency || 'USD';
  const healthScore = calculateHealthScore(profile, goals);
  const breakdown = getScoreBreakdown(profile, goals);

  const handleRunAnalysis = () => {
    setAnalysisRun(true);
    setTimeout(() => setAnalysisRun(false), 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Insights</h1>
        <p className="text-slate-500 mt-1">Blind spots, opportunities, and personalized financial wellness analysis</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.value
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'blind-spots' && (
        <BlindSpotsTab profile={profile} goals={goals} decisions={decisions} currency={currency} breakdown={breakdown} onRun={handleRunAnalysis} running={analysisRun} />
      )}
      {activeTab === 'opportunities' && (
        <OpportunitiesTab profile={profile} goals={goals} currency={currency} onRun={handleRunAnalysis} running={analysisRun} />
      )}
      {activeTab === 'wellness' && (
        <WellnessTab profile={profile} goals={goals} healthScore={healthScore} breakdown={breakdown} currency={currency} onRun={handleRunAnalysis} running={analysisRun} />
      )}
    </div>
  );
}

/* ─── Blind Spots Tab ───────────────────────────────── */
function BlindSpotsTab({ profile, goals, decisions, currency, breakdown, onRun, running }) {
  const blindSpots = detectBlindSpots(profile, goals, decisions, currency, breakdown);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Potential financial risks and overlooked areas based on your profile</p>
        <Button variant="outline" size="sm" onClick={onRun} disabled={running} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} /> Re-analyse
        </Button>
      </div>

      {blindSpots.length === 0 ? (
        <EmptyState icon={Shield} message="No significant blind spots detected. Your financial profile looks well-rounded." />
      ) : (
        <div className="space-y-3">
          {blindSpots.map((spot, i) => (
            <InsightCard key={i} insight={spot} type="warning" />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Opportunities Tab ─────────────────────────────── */
function OpportunitiesTab({ profile, goals, currency, onRun, running }) {
  const opportunities = detectOpportunities(profile, goals, currency);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Personalized recommendations to improve your financial position</p>
        <Button variant="outline" size="sm" onClick={onRun} disabled={running} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} /> Re-analyse
        </Button>
      </div>

      {opportunities.length === 0 ? (
        <EmptyState icon={Lightbulb} message="No new opportunities detected at this time. Keep building your financial profile for more insights." />
      ) : (
        <div className="space-y-3">
          {opportunities.map((opp, i) => (
            <InsightCard key={i} insight={opp} type="opportunity" />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Wellness Tab ──────────────────────────────────── */
function WellnessTab({ profile, goals, healthScore, breakdown, currency, onRun, running }) {
  const suggestions = generateWellnessSuggestions(profile, goals, breakdown, currency);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Overall financial wellness assessment and priority recommendations</p>
        <Button variant="outline" size="sm" onClick={onRun} disabled={running} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} /> Re-analyse
        </Button>
      </div>

      {/* Health Score Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(healthScore).text}`}>{healthScore}</div>
              <p className="text-xs text-slate-500 mt-1">Health Score</p>
            </div>
            <div className="flex-1 space-y-2">
              {breakdown.map((item) => {
                const info = getScoreColor(item.score);
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-28 flex-shrink-0">{item.label}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${info.bg}`} style={{ width: `${item.score}%` }} />
                    </div>
                    <span className={`text-xs font-medium w-8 text-right ${info.text}`}>{item.score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Suggestions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Priority Recommendations</h3>
        {suggestions.map((s, i) => (
          <InsightCard key={i} insight={s} type="suggestion" />
        ))}
      </div>
    </div>
  );
}

/* ─── Shared Components ─────────────────────────────── */
function InsightCard({ insight, type }) {
  const colors = {
    warning: { border: 'border-l-amber-500', bg: 'bg-amber-50', icon: AlertTriangle, iconColor: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
    opportunity: { border: 'border-l-emerald-500', bg: 'bg-emerald-50', icon: TrendingUp, iconColor: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
    suggestion: { border: 'border-l-primary-500', bg: 'bg-primary-50', icon: Lightbulb, iconColor: 'text-primary-600', badge: 'bg-primary-100 text-primary-700' },
  };
  const c = colors[type] || colors.suggestion;
  const Icon = c.icon;

  return (
    <div className={`rounded-lg border border-slate-200 border-l-4 ${c.border} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${c.bg} flex-shrink-0 mt-0.5`}>
          <Icon className={`w-4 h-4 ${c.iconColor}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-slate-900">{insight.title}</h4>
            {insight.severity && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.badge}`}>{insight.severity}</span>
            )}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{insight.description}</p>
          {insight.action && (
            <p className="text-xs text-primary-600 font-medium mt-2 flex items-center gap-1">
              <ArrowRight className="w-3 h-3" /> {insight.action}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
      <p className="text-slate-500">{message}</p>
    </div>
  );
}

/* ─── Analysis Functions ────────────────────────────── */
function detectBlindSpots(profile, goals, decisions, currency, breakdown) {
  const spots = [];
  if (!profile) return spots;

  const income = profile.monthlyIncome || 0;
  const expenses = profile.monthlyExpenses || 0;
  const savings = profile.totalSavings || 0;
  const debt = profile.totalDebt || 0;
  const monthlyCapacity = income - expenses;

  // Emergency fund check
  const emergencyMonths = expenses > 0 ? Math.round(savings / expenses) : 0;
  if (emergencyMonths < 3 && expenses > 0) {
    spots.push({
      title: 'Insufficient Emergency Fund',
      description: `Your current savings may only cover approximately ${emergencyMonths} month${emergencyMonths !== 1 ? 's' : ''} of expenses. Financial experts generally recommend 3-6 months of expenses as an emergency buffer.`,
      severity: emergencyMonths < 1 ? 'High' : 'Medium',
      action: 'Consider building an emergency fund goal',
    });
  }

  // High debt-to-income
  if (income > 0 && debt > income * 6) {
    spots.push({
      title: 'High Debt-to-Income Ratio',
      description: `Your total debt (${formatCurrency(debt, currency)}) appears to be more than 6 months of income. This may limit your financial flexibility for new goals or unexpected expenses.`,
      severity: debt > income * 12 ? 'High' : 'Medium',
      action: 'Review debt repayment strategies in Decision Lab',
    });
  }

  // No goals set
  if (goals.filter((g) => g.status === 'active').length === 0) {
    spots.push({
      title: 'No Active Financial Goals',
      description: 'Setting specific financial goals can help direct your savings strategy and track progress. Consider creating at least one short-term and one long-term goal.',
      severity: 'Low',
      action: 'Create your first goal',
    });
  }

  // Low savings rate
  if (income > 0 && monthlyCapacity < income * 0.1) {
    spots.push({
      title: 'Low Savings Rate',
      description: `Your monthly savings capacity (${formatCurrency(monthlyCapacity, currency)}) is less than 10% of your income. Even small increases in savings rate can compound significantly over time.`,
      severity: 'Medium',
      action: 'Review expense categories for optimization',
    });
  }

  // No decisions analysed
  if (decisions.length === 0) {
    spots.push({
      title: 'No Decision Analysis History',
      description: 'Running financial decisions through the Decision Lab before committing can help you understand trade-offs and potential risks.',
      severity: 'Low',
      action: 'Try analysing a decision',
    });
  }

  // Score breakdown weak areas
  breakdown?.forEach((item) => {
    if (item.score < 40 && item.label !== 'Goal Progress') {
      const alreadyCovered = spots.some((s) => s.title.toLowerCase().includes(item.label.toLowerCase()));
      if (!alreadyCovered) {
        spots.push({
          title: `${item.label} Needs Attention`,
          description: `Your ${item.label.toLowerCase()} score is ${item.score}/100, which may be impacting your overall financial health. Focus on improving this area for a stronger financial foundation.`,
          severity: item.score < 20 ? 'High' : 'Medium',
          action: `Focus on improving ${item.label.toLowerCase()}`,
        });
      }
    }
  });

  return spots;
}

function detectOpportunities(profile, goals, currency) {
  const opportunities = [];
  if (!profile) return opportunities;

  const income = profile.monthlyIncome || 0;
  const expenses = profile.monthlyExpenses || 0;
  const savings = profile.totalSavings || 0;
  const monthlyCapacity = income - expenses;

  // Strong savings capacity
  if (income > 0 && monthlyCapacity > income * 0.3) {
    opportunities.push({
      title: 'Strong Savings Capacity — Consider Investing',
      description: `Your monthly savings capacity of ${formatCurrency(monthlyCapacity, currency)} is strong. You may benefit from exploring investment options to grow your wealth rather than keeping excess in a savings account.`,
      severity: 'High Impact',
      action: 'Discuss investment strategies with AI Companion',
    });
  }

  // Low expenses
  if (income > 0 && expenses < income * 0.4) {
    opportunities.push({
      title: 'Low Expense Ratio — Accelerate Goals',
      description: 'Your expenses are well below your income. This is an excellent opportunity to accelerate your financial goals by increasing monthly contributions.',
      severity: 'High Impact',
      action: 'Increase goal contributions',
    });
  }

  // Emergency fund complete
  const emergencyMonths = expenses > 0 ? savings / expenses : 0;
  if (emergencyMonths >= 6) {
    opportunities.push({
      title: 'Emergency Fund Well Established',
      description: `Your savings cover approximately ${Math.round(emergencyMonths)} months of expenses. You may consider redirecting some savings toward investment or specific financial goals.`,
      severity: 'Medium Impact',
      action: 'Review goal allocation strategy',
    });
  }

  // No debt
  if ((profile.totalDebt || 0) === 0 && income > 0) {
    opportunities.push({
      title: 'Debt-Free — Leverage for Growth',
      description: 'Being debt-free is a strong position. You may consider strategic leverage (e.g. low-interest loans for appreciating assets) if it aligns with your goals and risk tolerance.',
      severity: 'Medium Impact',
      action: 'Explore strategic options with AI',
    });
  }

  // Goal gap
  const hasRetirement = goals.some((g) => g.category === 'retirement');
  if (!hasRetirement && (profile.age || '').toString().startsWith('2')) {
    opportunities.push({
      title: 'Start Retirement Planning Early',
      description: 'Starting retirement savings early can dramatically increase your final amount through compound growth. Even small monthly contributions now can make a significant difference.',
      severity: 'Medium Impact',
      action: 'Create a retirement goal',
    });
  }

  if (opportunities.length === 0) {
    opportunities.push({
      title: 'Continue Building Your Profile',
      description: 'As you add more financial data and set goals, more personalized opportunities will appear. Keep tracking your finances for better insights.',
      severity: 'Info',
    });
  }

  return opportunities;
}

function generateWellnessSuggestions(profile, goals, breakdown, currency) {
  const suggestions = [];
  if (!profile) return [{ title: 'Complete your profile', description: 'Add your financial details to get personalized wellness recommendations.', severity: 'Info' }];

  const income = profile.monthlyIncome || 0;
  const expenses = profile.monthlyExpenses || 0;
  const monthlyCapacity = income - expenses;

  // Sort breakdown by score ascending (weakest first)
  const sortedBreakdown = [...(breakdown || [])].sort((a, b) => a.score - b.score);
  const weakest = sortedBreakdown[0];

  if (weakest && weakest.score < 60) {
    suggestions.push({
      title: `Priority: Improve ${weakest.label}`,
      description: `Your ${weakest.label.toLowerCase()} (${weakest.score}/100) is the weakest component of your financial health score. Focusing here will have the biggest impact on your overall score.`,
      severity: 'Priority',
    });
  }

  if (monthlyCapacity > 0 && monthlyCapacity < income * 0.15) {
    suggestions.push({
      title: 'Increase Monthly Savings Gradually',
      description: `Try increasing your monthly savings by even 5% — from ${formatCurrency(monthlyCapacity, currency)} to ${formatCurrency(Math.round(monthlyCapacity * 1.05), currency)}. Small consistent increases compound over time.`,
      severity: 'Suggestion',
    });
  }

  const activeGoals = goals.filter((g) => g.status === 'active');
  if (activeGoals.length > 0 && activeGoals.every((g) => (g.currentAmount || 0) < (g.targetAmount || 1) * 0.1)) {
    suggestions.push({
      title: 'Kickstart Your Goals',
      description: 'Your active goals are all below 10% progress. Consider setting up automatic monthly contributions, even small ones, to build momentum.',
      severity: 'Suggestion',
    });
  }

  suggestions.push({
    title: 'Review Quarterly',
    description: 'Financial health improves with consistent monitoring. Set a reminder to review your LifePilot dashboard and insights every 3 months.',
    severity: 'Tip',
  });

  return suggestions;
}
