/**
 * Personal Financial Context Builder
 * Assembles a structured context object from the user's profile, goals,
 * decisions, and insights. Used by the chat service and AI features.
 */

import { calculateHealthScore } from '@/lib/scoring';

/**
 * Build a structured user context for AI / chat consumption.
 * @param {object} profile — User profile (from user.store)
 * @param {Array} goals — User goals (from user.store)
 * @param {Array} decisions — Recent decisions (optional)
 * @returns {object} Structured context object
 */
export function buildUserContext(profile, goals = [], decisions = []) {
  if (!profile) {
    return {
      personal: {},
      financial: {},
      goals: [],
      decisions: [],
      healthScore: 0,
      preference: 'undecided',
    };
  }

  const monthlyIncome = profile.monthlyIncome || 0;
  const monthlyExpenses = profile.monthlyExpenses || 0;
  const monthlyCapacity = monthlyIncome - monthlyExpenses;

  const activeGoals = goals.filter((g) => g.status === 'active');
  const recentDecisions = decisions.slice(0, 5);

  return {
    personal: {
      name: profile.name || 'User',
      age: profile.age || null,
      role: profile.role || null,
      country: profile.country || null,
      currency: profile.currency || 'USD',
    },
    financial: {
      monthlyIncome,
      monthlyExpenses,
      monthlyCapacity,
      totalSavings: profile.totalSavings || 0,
      totalDebt: profile.totalDebt || 0,
      investments: profile.investments || 0,
      savingsRate: monthlyIncome > 0
        ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)
        : 0,
      debtToIncomeRatio: monthlyIncome > 0
        ? Math.round(((profile.totalDebt || 0) / (monthlyIncome * 12)) * 100)
        : 0,
      emergencyFundMonths: monthlyExpenses > 0
        ? Math.round((profile.totalSavings || 0) / monthlyExpenses)
        : 0,
    },
    goals: activeGoals.map((g) => ({
      title: g.title,
      category: g.category,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount || 0,
      progress: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
      priority: g.priority,
      deadline: g.deadline,
    })),
    decisions: recentDecisions.map((d) => ({
      type: d.type,
      createdAt: d.createdAt,
      affordability: d.result?.affordabilityScore,
      risk: d.result?.riskScore,
    })),
    healthScore: calculateHealthScore(profile, goals),
    preference: profile.interactionMode || 'undecided',
  };
}

/**
 * Build a short human-readable summary of the user's financial situation.
 * Useful as context in mock AI responses.
 */
export function buildContextSummary(context) {
  const { personal, financial, goals } = context;
  const parts = [];

  if (personal.name) parts.push(`${personal.name}`);
  if (personal.role) parts.push(`a ${personal.role.replace('-', ' ')}`);
  if (personal.country) parts.push(`based in ${personal.country}`);

  let summary = parts.length > 0 ? `You are ${parts.join(', ')}.` : '';

  if (financial.monthlyIncome > 0) {
    summary += ` Your monthly income is ${financial.monthlyIncome.toLocaleString()} ${personal.currency}`;
    if (financial.monthlyCapacity > 0) {
      summary += ` with a monthly savings capacity of ${financial.monthlyCapacity.toLocaleString()} ${personal.currency}.`;
    } else {
      summary += '.';
    }
  }

  if (financial.totalSavings > 0) {
    summary += ` You have ${financial.totalSavings.toLocaleString()} ${personal.currency} in savings`;
    if (financial.totalDebt > 0) {
      summary += ` and ${financial.totalDebt.toLocaleString()} ${personal.currency} in debt.`;
    } else {
      summary += '.';
    }
  }

  if (goals.length > 0) {
    summary += ` You have ${goals.length} active goal${goals.length > 1 ? 's' : ''}.`;
  }

  return summary;
}
