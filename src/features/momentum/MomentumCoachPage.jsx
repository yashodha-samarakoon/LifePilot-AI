import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useUserStore } from '@/stores/user.store';
import { getCoaching as fetchCoaching } from '@/services/ai.service';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, getScoreColor } from '@/lib/utils';
import { calculateHealthScore } from '@/lib/scoring';
import {
  TrendingUp,
  Trophy,
  Target,
  CheckCircle2,
  AlertTriangle,
  Flame,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Calendar,
  Star,
} from 'lucide-react';

export function MomentumCoachPage() {
  const { user } = useAuthStore();
  const { profile, goals } = useUserStore();
  const [coaching, setCoaching] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const runCheckIn = async () => {
    setLoading(true);
    try {
      const result = await fetchCoaching();
      setCoaching(result);
      setChecked(true);
    } catch (err) {
      console.error('Coaching check-in failed:', err);
      setCoaching(generateLocalCoaching(profile, goals));
      setChecked(true);
    } finally {
      setLoading(false);
    }
  };

  const healthScore = profile ? calculateHealthScore(profile, goals) : 0;
  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Momentum Coach</h1>
          <p className="text-slate-500 mt-1">Track progress and get personalized guidance</p>
        </div>
        {checked && (
          <Button variant="outline" onClick={runCheckIn} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Check-in Again
          </Button>
        )}
      </div>

      {/* Progress Overview - Always visible */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Flame className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{activeGoals.length}</p>
              <p className="text-xs text-slate-500">Active Goals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50">
              <Trophy className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{completedGoals.length}</p>
              <p className="text-xs text-slate-500">Goals Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-50">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{healthScore}/100</p>
              <p className="text-xs text-slate-500">Health Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goal Progress Timeline */}
      {activeGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-600" /> Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeGoals.map((goal) => {
              const progress = goal.targetAmount > 0
                ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
                : 0;
              const colorInfo = getScoreColor(progress);

              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">{goal.title}</span>
                    <Badge variant={progress >= 70 ? 'success' : progress >= 40 ? 'warning' : 'secondary'}>
                      {Math.round(progress)}%
                    </Badge>
                  </div>
                  <Progress value={progress} color={colorInfo.bg} />
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{formatCurrency(goal.currentAmount)} saved</span>
                    <span>{formatCurrency(goal.targetAmount)} target</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Coaching Section */}
      {!checked ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-2xl bg-primary-50 mb-4">
              <Sparkles className="w-10 h-10 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready for a Check-in?</h3>
            <p className="text-slate-500 text-center max-w-md mb-6">
              Your AI coach will analyze your progress, celebrate your wins, and suggest
              personalized action items to keep your momentum going.
            </p>
            <Button size="lg" onClick={runCheckIn} disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...
                </span>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" /> Coach Check-in
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-5">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : coaching ? (
        <div className="space-y-4">
          {/* Encouragement */}
          {coaching.encouragement && (
            <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
              <CardContent className="py-5">
                <div className="flex items-start gap-3">
                  <Star className="w-6 h-6 text-primary-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-primary-900">Coach Says</h3>
                    <p className="text-sm text-primary-800 mt-1">{coaching.encouragement}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Actions */}
          {coaching.nextActions && coaching.nextActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ArrowRight className="w-4 h-4 text-primary-600" /> Recommended Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {coaching.nextActions.map((action, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                      <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        {typeof action === 'string' ? action : action.title || action.description || JSON.stringify(action)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {coaching.warnings && coaching.warnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Watch Out
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {coaching.warnings.map((warning, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">
                        {typeof warning === 'string' ? warning : warning.message || JSON.stringify(warning)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress Summary */}
          {coaching.progress && (
            <Card>
              <CardContent className="py-5">
                <h3 className="font-semibold text-slate-900 mb-2">Progress Summary</h3>
                <p className="text-sm text-slate-600">{typeof coaching.progress === 'string' ? coaching.progress : JSON.stringify(coaching.progress)}</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}

function generateLocalCoaching(profile, goals) {
  if (!profile) return { encouragement: 'Complete your profile to get personalized coaching.', nextActions: [], warnings: [] };

  const monthlySavings = (profile.monthlyIncome || 0) - (profile.monthlyExpenses || 0);
  const activeGoals = goals.filter((g) => g.status === 'active');
  const healthScore = calculateHealthScore(profile, goals);

  const encouragement = healthScore >= 70
    ? `Great progress, ${profile.name}! Your financial health score of ${healthScore} shows you're on the right track. Keep up the discipline!`
    : healthScore >= 40
    ? `You're making steady progress, ${profile.name}. Your health score is ${healthScore} - there's room to improve, but you're heading in the right direction.`
    : `${profile.name}, your health score of ${healthScore} needs attention. Don't worry - every journey starts with a single step. Let's work on improving your finances together.`;

  const nextActions = [];
  if (monthlySavings < (profile.monthlyIncome || 0) * 0.2) {
    nextActions.push('Try to increase your savings rate to at least 20% of your income this month.');
  }
  if (activeGoals.length === 0) {
    nextActions.push('Set at least one specific financial goal to give your savings a clear purpose.');
  }
  if (profile.totalDebt > 0) {
    nextActions.push('Make an extra payment toward your highest-interest debt this week.');
  }
  nextActions.push('Review your expenses this weekend and identify one area to cut back.');

  const warnings = [];
  if (profile.totalSavings < (profile.monthlyExpenses || 0) * 3) {
    warnings.push('Your emergency fund is below the recommended 3-month threshold. Prioritize building it up.');
  }
  if (monthlySavings < 0) {
    warnings.push('You are spending more than you earn. This is unsustainable - take immediate action to reduce expenses or increase income.');
  }

  return { encouragement, nextActions, warnings, progress: `Health score: ${healthScore}/100. Monthly savings: ${formatCurrency(monthlySavings)}. Active goals: ${activeGoals.length}.` };
}
