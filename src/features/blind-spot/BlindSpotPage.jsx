import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useUserStore } from '@/stores/user.store';
import { detectBlindSpots as fetchBlindSpots } from '@/services/ai.service';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';
import {
  Eye,
  AlertTriangle,
  Shield,
  Clock,
  FileText,
  TrendingDown,
  Search,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export function BlindSpotPage() {
  const { user } = useAuthStore();
  const { profile } = useUserStore();
  const [blindSpots, setBlindSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const result = await fetchBlindSpots();
      setBlindSpots(result.blindSpots || result || []);
      setAnalyzed(true);
    } catch (err) {
      console.error('Blind spot analysis failed:', err);
      // Generate local blind spots
      setBlindSpots(generateLocalBlindSpots(profile));
      setAnalyzed(true);
    } finally {
      setLoading(false);
    }
  };

  const severityConfig = {
    critical: { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: AlertTriangle, bg: 'border-l-rose-500' },
    high: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle, bg: 'border-l-amber-500' },
    medium: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Shield, bg: 'border-l-blue-500' },
    low: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, bg: 'border-l-emerald-500' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blind Spot Detector</h1>
          <p className="text-slate-500 mt-1">Uncover hidden costs and financial risks you might be missing</p>
        </div>
        {analyzed && (
          <Button variant="outline" onClick={runAnalysis} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Re-analyze
          </Button>
        )}
      </div>

      {!analyzed ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-2xl bg-primary-50 mb-4">
              <Search className="w-10 h-10 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Scan Your Finances</h3>
            <p className="text-slate-500 text-center max-w-md mb-6">
              Our AI will analyze your financial profile to identify hidden costs, forgotten expenses,
              and potential risks that could impact your financial health.
            </p>
            <Button size="lg" onClick={runAnalysis} disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Scanning...
                </span>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" /> Start Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-5">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Eye className="w-4 h-4" />
            <span>{blindSpots.length} potential blind spot{blindSpots.length !== 1 ? 's' : ''} identified</span>
          </div>

          {blindSpots.map((spot, i) => {
            const severity = spot.severity || spot.riskLevel || 'medium';
            const config = severityConfig[severity] || severityConfig.medium;
            const Icon = config.icon;

            return (
              <Card key={i} className={`border-l-4 ${config.bg}`}>
                <CardContent className="py-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-50">
                        <Icon className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {spot.title || spot.name || `Blind Spot #${i + 1}`}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {spot.description || spot.detail || ''}
                        </p>
                        {spot.estimatedCost && (
                          <p className="text-sm font-medium text-slate-800 mt-2">
                            Estimated impact: {typeof spot.estimatedCost === 'number' ? formatCurrency(spot.estimatedCost) : spot.estimatedCost}
                          </p>
                        )}
                        {spot.mitigation && (
                          <div className="mt-3 p-2 rounded-lg bg-slate-50 text-sm text-slate-600">
                            <span className="font-medium">Mitigation: </span>
                            {typeof spot.mitigation === 'string' ? spot.mitigation : JSON.stringify(spot.mitigation)}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant={severity === 'critical' || severity === 'high' ? 'danger' : severity === 'medium' ? 'warning' : 'success'}>
                      {severity}
                    </Badge>
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

function generateLocalBlindSpots(profile) {
  if (!profile) return [];
  const spots = [];

  // Emergency fund gap
  if (profile.monthlyExpenses > 0 && profile.totalSavings > 0) {
    const months = profile.totalSavings / profile.monthlyExpenses;
    if (months < 6) {
      spots.push({
        title: 'Emergency Fund Gap',
        description: `Your savings only cover ${months.toFixed(1)} months of expenses. Financial experts recommend 3-6 months as a safety net.`,
        severity: months < 3 ? 'critical' : 'medium',
        estimatedCost: Math.round((6 - months) * profile.monthlyExpenses),
        mitigation: 'Set up automatic transfers to build your emergency fund by 10% each month.',
      });
    }
  }

  // Inflation erosion
  if (profile.totalSavings > 0) {
    spots.push({
      title: 'Inflation Erosion',
      description: 'Your savings may lose purchasing power over time due to inflation (typically 5-7% annually).',
      severity: 'medium',
      estimatedCost: Math.round(profile.totalSavings * 0.06),
      mitigation: 'Consider moving idle savings to inflation-beating instruments like index funds or fixed deposits.',
    });
  }

  // Insurance gap
  if (!profile.insuranceCovered) {
    spots.push({
      title: 'Insurance Coverage Gap',
      description: 'Without health and term insurance, a medical emergency could wipe out your savings.',
      severity: 'high',
      estimatedCost: null,
      mitigation: 'Get a basic health insurance plan and consider term life insurance if you have dependents.',
    });
  }

  // Subscription creep
  spots.push({
    title: 'Subscription Creep',
    description: 'Unused or forgotten subscriptions can silently drain 2-5% of your monthly budget.',
    severity: 'low',
    estimatedCost: Math.round((profile.monthlyExpenses || 0) * 0.03 * 12),
    mitigation: 'Audit all recurring payments quarterly. Cancel services you haven\'t used in 30+ days.',
  });

  // Tax optimization
  if (profile.monthlyIncome > 50000) {
    spots.push({
      title: 'Tax Optimization Opportunity',
      description: 'You may be missing tax-saving deductions under Section 80C, 80D, and HRA exemptions.',
      severity: 'medium',
      estimatedCost: Math.round(profile.monthlyIncome * 12 * 0.05),
      mitigation: 'Consult a tax advisor or use tax-saving investments like ELSS, PPF, and NPS.',
    });
  }

  return spots;
}
