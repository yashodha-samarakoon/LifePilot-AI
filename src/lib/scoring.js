/**
 * Financial Health Score Calculator
 * Score range: 0-100
 *
 * Components:
 * - Savings Rate (30%): How much of income is saved monthly
 * - Debt-to-Income (25%): Ratio of debt to income
 * - Goal Progress (20%): Average progress across active goals
 * - Expense Diversity (15%): Spread across categories (not concentrated)
 * - Emergency Fund (10%): Months of expenses covered by savings
 */

function hasEnoughDataForScore(profile) {
  if (!profile) return false;
  const income = profile.monthlyIncome;
  const hasIncome = income != null && income > 0;
  const hasExpenses = profile.monthlyExpenses != null && profile.monthlyExpenses > 0;
  const hasSavings = profile.totalSavings != null && profile.totalSavings > 0;
  const hasDebt = profile.totalDebt != null && profile.totalDebt > 0;
  return hasIncome && (hasExpenses || hasSavings || hasDebt);
}

export function calculateHealthScore(profile, goals = []) {
  if (!hasEnoughDataForScore(profile)) return null;

  const savingsRateScore = calcSavingsRate(profile);
  const debtScore = calcDebtToIncome(profile);
  const goalScore = calcGoalProgress(goals);
  const expenseScore = calcExpenseDiversity(profile);
  const emergencyScore = calcEmergencyFund(profile);

  const total =
    savingsRateScore * 0.30 +
    debtScore * 0.25 +
    goalScore * 0.20 +
    expenseScore * 0.15 +
    emergencyScore * 0.10;

  return Math.round(Math.min(100, Math.max(0, total)));
}

function calcSavingsRate(profile) {
  const { monthlyIncome = 0, monthlyExpenses = 0 } = profile;
  if (monthlyIncome === 0) return 0;
  const rate = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;
  if (rate >= 30) return 100;
  if (rate >= 20) return 80;
  if (rate >= 10) return 60;
  if (rate >= 0) return 40;
  return 10;
}

function calcDebtToIncome(profile) {
  const { totalDebt = 0, monthlyIncome = 0 } = profile;
  if (monthlyIncome === 0) return totalDebt > 0 ? 0 : 50;
  const ratio = (totalDebt / (monthlyIncome * 12)) * 100;
  if (ratio === 0) return 100;
  if (ratio <= 20) return 90;
  if (ratio <= 50) return 70;
  if (ratio <= 100) return 50;
  if (ratio <= 200) return 30;
  return 10;
}

function calcGoalProgress(goals) {
  const activeGoals = goals.filter((g) => g.status === 'active');
  if (activeGoals.length === 0) return 50;
  const avgProgress =
    activeGoals.reduce((sum, g) => {
      const progress = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
      return sum + Math.min(100, progress);
    }, 0) / activeGoals.length;
  return Math.round(avgProgress);
}

function calcExpenseDiversity(profile) {
  // Simplified: based on expenses vs income ratio
  const { monthlyIncome = 0, monthlyExpenses = 0 } = profile;
  if (monthlyIncome === 0) return 50;
  const ratio = monthlyExpenses / monthlyIncome;
  if (ratio <= 0.5) return 100;
  if (ratio <= 0.7) return 80;
  if (ratio <= 0.85) return 60;
  if (ratio <= 1.0) return 40;
  return 20;
}

function calcEmergencyFund(profile) {
  const { totalSavings = 0, monthlyExpenses = 0 } = profile;
  if (monthlyExpenses === 0) return 70;
  const months = totalSavings / monthlyExpenses;
  if (months >= 12) return 100;
  if (months >= 6) return 90;
  if (months >= 3) return 70;
  if (months >= 1) return 40;
  return 10;
}

export function getScoreBreakdown(profile, goals = []) {
  if (!hasEnoughDataForScore(profile)) return [];
  return [
    { label: 'Savings Rate', score: calcSavingsRate(profile), weight: 30 },
    { label: 'Debt Management', score: calcDebtToIncome(profile), weight: 25 },
    { label: 'Goal Progress', score: calcGoalProgress(goals), weight: 20 },
    { label: 'Expense Control', score: calcExpenseDiversity(profile), weight: 15 },
    { label: 'Emergency Fund', score: calcEmergencyFund(profile), weight: 10 },
  ];
}
