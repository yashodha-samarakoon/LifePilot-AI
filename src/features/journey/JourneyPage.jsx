import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useUserStore } from '@/stores/user.store';
import { useDashboardStore } from '@/stores/dashboard.store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { formatCurrency, estimateMonthlyExpenses } from '@/lib/utils';
import {
  Map,
  Target,
  FlaskConical,
  TrendingUp,
  ArrowRight,
  Circle,
  CheckCircle2,
  Clock,
  Wallet,
  PiggyBank,
  CreditCard,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export function JourneyPage() {
  const { user } = useAuthStore();
  const { profile, goals, fetchProfile, fetchGoals } = useUserStore();
  const { decisions, transactions, fetchDecisions, fetchTransactions } = useDashboardStore();

  useEffect(() => {
    if (user?.uid) {
      fetchProfile(user.uid);
      fetchGoals(user.uid);
      fetchDecisions(user.uid);
      fetchTransactions(user.uid);
    }
  }, [user]);

  const currency = profile?.currency || 'USD';
  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  const estimatedExpenses = useMemo(() => estimateMonthlyExpenses(transactions), [transactions]);
  const effectiveProfile = useMemo(() => {
    if (!profile) return null;
    return { ...profile, monthlyExpenses: profile.monthlyExpenses ?? estimatedExpenses };
  }, [profile, estimatedExpenses]);

  const monthlyCapacity = (effectiveProfile?.monthlyIncome || 0) - (effectiveProfile?.monthlyExpenses || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Financial Journey</h1>
          <p className="text-slate-500 mt-1">Visualize your financial path, milestones, and progress</p>
        </div>
        <Link to="/chat">
          <Button variant="outline" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Plan with AI
          </Button>
        </Link>
      </div>

      {/* Current Position Card */}
      <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary-100">
              <Map className="w-6 h-6 text-primary-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">Where You Are Now</h2>
              <p className="text-sm text-slate-500 mt-0.5">Based on your current financial profile</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <MiniStat
                  icon={Wallet}
                  label="Monthly Income"
                  value={effectiveProfile?.monthlyIncome != null ? formatCurrency(effectiveProfile.monthlyIncome, currency) : 'Not Set'}
                />
                <MiniStat
                  icon={CreditCard}
                  label="Monthly Expenses"
                  value={profile?.monthlyExpenses != null
                    ? formatCurrency(profile.monthlyExpenses, currency)
                    : (transactions.length > 0 ? `${formatCurrency(estimatedExpenses, currency)} (estimated)` : 'Start Tracking')}
                />
                <MiniStat
                  icon={PiggyBank}
                  label="Total Savings"
                  value={effectiveProfile?.totalSavings != null ? formatCurrency(effectiveProfile.totalSavings, currency) : 'Not Set'}
                />
                <MiniStat
                  icon={TrendingUp}
                  label="Monthly Capacity"
                  value={(effectiveProfile?.monthlyIncome != null || effectiveProfile?.monthlyExpenses != null)
                    ? formatCurrency(monthlyCapacity, currency)
                    : 'Not Available Yet'}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200" />

        {/* Current Position Marker */}
        <TimelineMarker icon={Map} color="bg-primary-500" label="Present" active>
          <Card>
            <CardContent className="pt-4 pb-4">
              <h3 className="font-semibold text-slate-900">Current Position</h3>
              <p className="text-sm text-slate-500 mt-1">
                {effectiveProfile?.role ? `${effectiveProfile.role.replace('-', ' ')} — ` : ''}
                Monthly savings capacity of {(effectiveProfile?.monthlyIncome != null || effectiveProfile?.monthlyExpenses != null)
                  ? formatCurrency(monthlyCapacity, currency)
                  : 'not available yet'}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline">{activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}</Badge>
                <Badge variant="outline">{decisions.length} decision{decisions.length !== 1 ? 's' : ''} analysed</Badge>
                {profile?.totalDebt > 0 && (
                  <Badge variant="outline" className="text-rose-600 border-rose-200">
                    {formatCurrency(profile.totalDebt, currency)} debt
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TimelineMarker>

        {/* Active Goals as Milestones */}
        {activeGoals.map((goal) => {
          const progress = goal.targetAmount > 0
            ? Math.min(100, Math.round(((goal.currentAmount || 0) / goal.targetAmount) * 100))
            : 0;
          return (
            <TimelineMarker key={goal.id} icon={Target} color="bg-amber-500" label={goal.deadline ? `Target: ${new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}` : 'Active'}>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{goal.title}</h3>
                    <Badge variant="outline" className="text-xs">{progress}%</Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {formatCurrency(goal.currentAmount || 0, currency)} of {formatCurrency(goal.targetAmount || 0, currency)}
                  </p>
                  <Progress value={progress} className="mt-2" />
                  <p className="text-xs text-slate-400 mt-2">
                    Estimated based on current savings rate. Timeline may adjust as your finances change.
                  </p>
                </CardContent>
              </Card>
            </TimelineMarker>
          );
        })}

        {/* Decision Markers */}
        {decisions.slice(0, 3).map((d) => (
          <TimelineMarker key={d.id} icon={FlaskConical} color="bg-blue-500" label={d.createdAt ? new Date(d.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}>
            <Card>
              <CardContent className="pt-4 pb-4">
                <h3 className="font-semibold text-slate-900">Decision Analysed</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {d.type?.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()) || 'Financial decision'} — Affordability: {d.result?.affordabilityScore ?? '—'}%
                </p>
              </CardContent>
            </Card>
          </TimelineMarker>
        ))}

        {/* Completed Goals */}
        {completedGoals.map((goal) => (
          <TimelineMarker key={goal.id} icon={CheckCircle2} color="bg-emerald-500" label="Completed">
            <Card>
              <CardContent className="pt-4 pb-4">
                <h3 className="font-semibold text-slate-900">{goal.title}</h3>
                <p className="text-sm text-emerald-600 mt-1">Goal achieved — {formatCurrency(goal.targetAmount || 0, currency)}</p>
              </CardContent>
            </Card>
          </TimelineMarker>
        ))}

        {/* End marker */}
        {activeGoals.length === 0 && decisions.length === 0 && completedGoals.length === 0 && (
          <TimelineMarker icon={Sparkles} color="bg-slate-300" label="Start">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-slate-500">Your journey timeline will appear here as you create goals and analyse decisions.</p>
                <div className="flex justify-center gap-2 mt-3">
                  <Link to="/goals"><Button variant="outline" size="sm">Create a Goal</Button></Link>
                  <Link to="/decisions"><Button variant="outline" size="sm">Analyse a Decision</Button></Link>
                </div>
              </CardContent>
            </Card>
          </TimelineMarker>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 text-center">
        All projections are estimates based on your current information. Actual outcomes may vary. Review your plan regularly.
      </p>
    </div>
  );
}

/* ─── Timeline Marker ───────────────────────────────── */
function TimelineMarker({ icon: Icon, color, label, active, children }) {
  return (
    <div className="relative pl-16 pb-6">
      <div className={`absolute left-3.5 w-5 h-5 rounded-full ${color} flex items-center justify-center ring-4 ring-white z-10`}>
        {active ? (
          <div className="w-2 h-2 rounded-full bg-white" />
        ) : (
          <Icon className="w-3 h-3 text-white" />
        )}
      </div>
      {label && (
        <span className="absolute left-16 -top-1 text-xs text-slate-400">{label}</span>
      )}
      <div className="mt-1">{children}</div>
    </div>
  );
}

/* ─── Mini Stat ─────────────────────────────────────── */
function MiniStat({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
