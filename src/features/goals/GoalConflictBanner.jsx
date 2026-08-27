import { useState } from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

/**
 * Analyses active goals for resource / timeline conflicts.
 * If combined monthly goal contributions exceed monthly savings capacity, flag conflict.
 */
export function GoalConflictBanner({ goals, profile }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const activeGoals = goals.filter((g) => g.status === 'active');
  if (activeGoals.length < 2) return null;

  const monthlyCapacity = (profile?.monthlyIncome || 0) - (profile?.monthlyExpenses || 0);
  if (monthlyCapacity <= 0) return null;

  // Calculate required monthly contribution for each goal
  const goalContributions = activeGoals.map((g) => {
    const remaining = (g.targetAmount || 0) - (g.currentAmount || 0);
    if (remaining <= 0) return { goal: g, monthlyNeeded: 0 };

    // Estimate months remaining until deadline (or 24 months default)
    let monthsLeft = 24;
    if (g.deadline) {
      const diff = new Date(g.deadline).getTime() - Date.now();
      monthsLeft = Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24 * 30)));
    }
    return { goal: g, monthlyNeeded: Math.round(remaining / monthsLeft) };
  });

  const totalMonthlyNeeded = goalContributions.reduce((sum, gc) => sum + gc.monthlyNeeded, 0);

  if (totalMonthlyNeeded <= monthlyCapacity) return null;

  // Find which goals overlap the most
  const sorted = [...goalContributions].sort((a, b) => b.monthlyNeeded - a.monthlyNeeded);
  const topTwo = sorted.slice(0, 2);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-100 flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-amber-900">Goal Resource Conflict Detected</h4>
          <p className="text-sm text-amber-700 mt-1">
            Your goals may compete for the same savings. Based on current capacity,{' '}
            <strong>{topTwo[0].goal.title}</strong> and <strong>{topTwo[1].goal.title}</strong>{' '}
            timelines overlap. Combined monthly contributions needed ({formatCurrency(totalMonthlyNeeded, profile?.currency)}){' '}
            exceed your monthly savings capacity ({formatCurrency(monthlyCapacity, profile?.currency)}).
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs text-amber-600">Suggestions:</span>
            <span className="text-xs font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">Adjust timeline</span>
            <span className="text-xs font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">Change priority</span>
            <span className="text-xs font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">Pause a goal</span>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded text-amber-400 hover:text-amber-600 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
