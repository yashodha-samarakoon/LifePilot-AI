import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useUserStore } from '@/stores/user.store';
import { useDashboardStore } from '@/stores/dashboard.store';
import { calculateHealthScore, getScoreBreakdown } from '@/lib/scoring';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, getScoreColor } from '@/lib/utils';
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
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { profile, goals, fetchProfile, fetchGoals, loadingProfile, loadingGoals } = useUserStore();
  const { decisions, fetchDecisions } = useDashboardStore();
  const [healthScore, setHealthScore] = useState(0);
  const [breakdown, setBreakdown] = useState([]);

  useEffect(() => {
    if (user?.uid) {
      fetchProfile(user.uid);
      fetchGoals(user.uid);
      fetchDecisions(user.uid);
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      const score = calculateHealthScore(profile, goals);
      setHealthScore(score);
      setBreakdown(getScoreBreakdown(profile, goals));
    }
  }, [profile, goals]);

  const currency = profile?.currency || 'USD';
  const mode = profile?.interactionMode || 'journey';

  if (loadingProfile || loadingGoals) {
    return <DashboardSkeleton />;
  }

  const monthlySavings = (profile?.monthlyIncome || 0) - (profile?.monthlyExpenses || 0);
  const activeGoals = goals.filter((g) => g.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {profile?.name || 'there'}!
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

      {/* Shared: Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wallet} label="Monthly Income" value={formatCurrency(profile?.monthlyIncome || 0, currency)} color="text-emerald-600" bgColor="bg-emerald-50" />
        <StatCard icon={CreditCard} label="Monthly Expenses" value={formatCurrency(profile?.monthlyExpenses || 0, currency)} color="text-rose-600" bgColor="bg-rose-50" />
        <StatCard icon={PiggyBank} label="Total Savings" value={formatCurrency(profile?.totalSavings || 0, currency)} trend="up" color="text-primary-600" bgColor="bg-primary-50" />
        <StatCard
          icon={monthlySavings >= 0 ? TrendingUp : TrendingDown}
          label="Monthly Capacity"
          value={formatCurrency(monthlySavings, currency)}
          trend={monthlySavings >= 0 ? 'up' : 'down'}
          color={monthlySavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}
          bgColor={monthlySavings >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}
        />
      </div>

      {/* Mode-specific content */}
      {mode === 'decision' ? (
        <DecisionModeContent profile={profile} decisions={decisions} currency={currency} />
      ) : (
        <JourneyModeContent
          profile={profile}
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
          <InsightsPanel profile={profile} goals={goals} currency={currency} />
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Journey Mode Content ──────────────────────────── */
function JourneyModeContent({ profile, goals, activeGoals, healthScore, breakdown, currency }) {
  return (
    <>
      {/* Health Score + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center justify-center py-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Financial Health</h3>
          <ScoreRing score={healthScore} size={160} strokeWidth={12} />
          <div className="mt-4 grid grid-cols-3 gap-4 text-center text-xs">
            <div><span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1" />0-40</div>
            <div><span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />41-70</div>
            <div><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />71-100</div>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Score Breakdown</CardTitle>
            <CardDescription>Estimated based on your current data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {breakdown.map((item) => {
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
            })}
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
              <MiniStat label="Savings Rate" value={`${profile?.monthlyIncome > 0 ? Math.round(((profile.monthlyIncome - profile.monthlyExpenses) / profile.monthlyIncome) * 100) : 0}%`} />
              <MiniStat label="Available Funds" value={formatCurrency((profile?.totalSavings || 0) + (profile?.investments || 0), currency)} />
              <MiniStat label="Monthly Capacity" value={formatCurrency((profile?.monthlyIncome || 0) - (profile?.monthlyExpenses || 0), currency)} />
              <MiniStat label="Debt Ratio" value={`${profile?.monthlyIncome > 0 ? Math.round(((profile?.totalDebt || 0) / (profile.monthlyIncome * 12)) * 100) : 0}%`} />
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
          <p className="text-2xl font-bold text-slate-900">{value}</p>
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
