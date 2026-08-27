import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useUserStore } from '@/stores/user.store';
import { exploreOpportunities as fetchOpportunities } from '@/services/ai.service';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';
import {
  Lightbulb,
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  BookOpen,
  PiggyBank,
  Briefcase,
  Zap,
} from 'lucide-react';

export function OpportunityPage() {
  const { user } = useAuthStore();
  const { profile } = useUserStore();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [explored, setExplored] = useState(false);

  const runExploration = async () => {
    setLoading(true);
    try {
      const result = await fetchOpportunities();
      setOpportunities(result.opportunities || result || []);
      setExplored(true);
    } catch (err) {
      console.error('Opportunity exploration failed:', err);
      setOpportunities(generateLocalOpportunities(profile));
      setExplored(true);
    } finally {
      setLoading(false);
    }
  };

  const riskColors = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
  };

  const categoryIcons = {
    savings: PiggyBank,
    investment: TrendingUp,
    skill: BookOpen,
    income: Briefcase,
    default: Zap,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Opportunity Explorer</h1>
          <p className="text-slate-500 mt-1">Discover financial opportunities tailored to your profile</p>
        </div>
        {explored && (
          <Button variant="outline" onClick={runExploration} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        )}
      </div>

      {!explored ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-2xl bg-primary-50 mb-4">
              <Lightbulb className="w-10 h-10 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Find Your Opportunities</h3>
            <p className="text-slate-500 text-center max-w-md mb-6">
              Based on your financial profile, risk tolerance, and goals, we'll suggest investments,
              savings strategies, and income opportunities that match your situation.
            </p>
            <Button size="lg" onClick={runExploration} disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Exploring...
                </span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Explore Opportunities
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-5">
                <Skeleton className="h-10 w-10 rounded-xl mb-3" />
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map((opp, i) => {
            const category = opp.category || 'default';
            const Icon = categoryIcons[category] || categoryIcons.default;
            const risk = (opp.riskLevel || 'medium').toLowerCase();

            return (
              <Card key={i} className="hover:border-primary-200 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-primary-50">
                      <Icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <Badge variant={riskColors[risk] || 'secondary'}>
                      {risk} risk
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-slate-900 mb-1">
                    {opp.title || opp.name || `Opportunity #${i + 1}`}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {opp.description || ''}
                  </p>

                  <div className="space-y-2 text-sm">
                    {opp.expectedReturn && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> Expected Return
                        </span>
                        <span className="font-medium text-emerald-600">
                          {typeof opp.expectedReturn === 'string' ? opp.expectedReturn : `${opp.expectedReturn}%`}
                        </span>
                      </div>
                    )}
                    {opp.minimumCapital !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" /> Minimum Capital
                        </span>
                        <span className="font-medium">
                          {typeof opp.minimumCapital === 'number' ? formatCurrency(opp.minimumCapital) : opp.minimumCapital}
                        </span>
                      </div>
                    )}
                    {opp.timeCommitment && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Time Commitment
                        </span>
                        <span className="font-medium">{opp.timeCommitment}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function generateLocalOpportunities(profile) {
  if (!profile) return [];
  const opportunities = [];
  const monthlySavings = (profile.monthlyIncome || 0) - (profile.monthlyExpenses || 0);

  if (monthlySavings > 5000) {
    opportunities.push({
      title: 'Start a SIP in Index Funds',
      description: 'Systematic Investment Plans in Nifty 50 or Sensex index funds offer steady long-term growth with low fees.',
      category: 'investment',
      riskLevel: 'medium',
      expectedReturn: '10-14% annually',
      minimumCapital: 500,
      timeCommitment: 'Passive (monthly auto-debit)',
    });
  }

  opportunities.push({
    title: 'High-Yield Savings Account',
    description: 'Move idle savings to a high-yield savings account or liquid fund for better returns than standard savings.',
    category: 'savings',
    riskLevel: 'low',
    expectedReturn: '4-7% annually',
    minimumCapital: 1000,
    timeCommitment: 'One-time setup',
  });

  if (profile.age && profile.age < 30) {
    opportunities.push({
      title: 'Invest in Skill Development',
      description: 'Online courses in high-demand skills (data science, design, cloud computing) can boost your earning potential by 30-50%.',
      category: 'skill',
      riskLevel: 'low',
      expectedReturn: '30-50% salary increase',
      minimumCapital: 5000,
      timeCommitment: '2-4 hours/week for 3-6 months',
    });
  }

  if (monthlySavings > 10000) {
    opportunities.push({
      title: 'Start a Side Business',
      description: 'Use your savings as seed capital for a low-risk side business or freelance work aligned with your skills.',
      category: 'income',
      riskLevel: 'medium',
      expectedReturn: 'Variable',
      minimumCapital: 25000,
      timeCommitment: '5-10 hours/week',
    });
  }

  opportunities.push({
    title: 'Tax-Saving ELSS Mutual Funds',
    description: 'Invest up to 1.5 lakh under Section 80C in Equity-Linked Savings Schemes for tax benefits plus market returns.',
    category: 'investment',
    riskLevel: 'medium',
    expectedReturn: '12-15% annually',
    minimumCapital: 500,
    timeCommitment: '3-year lock-in',
  });

  return opportunities;
}
