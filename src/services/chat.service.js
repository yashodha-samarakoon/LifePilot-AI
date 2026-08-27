/**
 * AI Chat Service
 * Handles the AI Companion conversation flow.
 * Falls back to intelligent mock responses when Qwen is not connected.
 */

import { httpsCallable } from 'firebase/functions';
import { functions, isFirebaseConfigured } from './firebase';
import { buildUserContext, buildContextSummary } from './context.service';
import { formatCurrency } from '@/lib/utils';

let chatFn = null;
if (isFirebaseConfigured && functions) {
  chatFn = httpsCallable(functions, 'chatWithAI');
}

/**
 * Send a message and get a structured AI response.
 * @param {string} message — The user's message text
 * @param {object} context — Structured user context (from buildUserContext)
 * @param {Array} history — Previous messages for context
 * @returns {object} Structured response
 */
export async function sendChatMessage(message, context, history = []) {
  // If Qwen is connected, use Cloud Function
  if (chatFn) {
    try {
      const result = await chatFn({
        message,
        context,
        history: history.slice(-10),
      });
      return result.data;
    } catch (err) {
      console.warn('Cloud Function chat failed, using mock:', err.message);
    }
  }

  // Fallback: intelligent mock response
  return generateMockResponse(message, context, history);
}

// ============================================================
// Mock Response Generator
// ============================================================

function generateMockResponse(message, context, history) {
  const lower = message.toLowerCase();
  const { personal, financial, goals } = context;
  const currency = personal.currency || 'USD';
  const name = personal.name || 'there';
  const fmt = (amount) => formatCurrency(amount, currency);

  // Detect intent via keyword matching
  if (matchesAny(lower, ['buy vehicle', 'car', 'vehicle', 'buy a car', 'buy a vehicle'])) {
    return generateDecisionResponse('vehicle', context, fmt, name);
  }

  if (matchesAny(lower, ['house', 'home', 'property', 'apartment', 'buy a home', 'buy a house'])) {
    return generateDecisionResponse('home', context, fmt, name);
  }

  if (matchesAny(lower, ['education', 'degree', 'master', "master's", 'university', 'study', 'college'])) {
    return generateDecisionResponse('education', context, fmt, name);
  }

  if (matchesAny(lower, ['business', 'startup', 'start a business', 'venture'])) {
    return generateDecisionResponse('business', context, fmt, name);
  }

  if (matchesAny(lower, ['loan', 'borrow', 'credit'])) {
    return generateLoanResponse(context, fmt, name, lower);
  }

  if (matchesAny(lower, ['goal', 'save', 'saving', 'target'])) {
    return generateGoalResponse(context, fmt, name);
  }

  if (matchesAny(lower, ['afford', 'can i', 'enough', 'feasible'])) {
    return generateAffordabilityResponse(context, fmt, name, message);
  }

  if (matchesAny(lower, ['invest', 'investment', 'stock', 'mutual fund', 'index fund'])) {
    return generateInvestmentResponse(context, fmt, name);
  }

  if (matchesAny(lower, ['health', 'score', 'how am i', 'how am i doing', 'financial health'])) {
    return generateHealthResponse(context, fmt, name);
  }

  if (matchesAny(lower, ['expense', 'spending', 'budget', 'cut', 'reduce'])) {
    return generateExpenseResponse(context, fmt, name);
  }

  if (matchesAny(lower, ['debt', 'owe', 'credit card', 'pay off'])) {
    return generateDebtResponse(context, fmt, name);
  }

  if (matchesAny(lower, ['emergency', 'rainy day', 'safety net'])) {
    return generateEmergencyResponse(context, fmt, name);
  }

  if (matchesAny(lower, ['hello', 'hi', 'hey', 'help'])) {
    return {
      type: 'text',
      content: `Hello ${name}! I'm your LifePilot AI Companion. I understand your personal financial situation and can help you with:\n\n• **Decision analysis** — \"Can I afford a vehicle?\"\n• **Goal planning** — \"Help me plan my savings goals\"\n• **Financial insights** — \"How is my financial health?\"\n• **Budget advice** — \"Where can I reduce spending?\"\n\nWhat would you like to explore?`,
      actions: [],
    };
  }

  // Default: context-aware response
  return generateGeneralResponse(context, fmt, name, message);
}

// ============================================================
// Response Generators
// ============================================================

function generateDecisionResponse(type, ctx, fmt, name) {
  const { financial, goals, personal } = ctx;
  const savings = financial.totalSavings;
  const capacity = financial.monthlyCapacity;
  const currency = personal.currency;

  const estimates = {
    vehicle: { cost: 800000, monthly: 15000, label: 'vehicle' },
    home: { cost: 5000000, monthly: 35000, label: 'home' },
    education: { cost: 1000000, monthly: 0, label: 'higher education' },
    business: { cost: 1000000, monthly: 0, label: 'business venture' },
  };

  const est = estimates[type] || estimates.vehicle;
  const canAfford = savings >= est.cost;
  const monthsToSave = capacity > 0 ? Math.ceil((est.cost - savings) / capacity) : Infinity;
  const affordability = Math.min(100, Math.round((savings / est.cost) * 100));
  const risk = Math.min(100, Math.max(0, 100 - affordability + 15));

  const paths = [];

  // Path A: Act Now
  paths.push({
    label: 'Act Now',
    description: canAfford
      ? `You currently have ${fmt(savings)} in savings, which covers the estimated ${fmt(est.cost)} cost. This appears affordable based on your current position.`
      : `This would require ${fmt(est.cost)} and your current savings of ${fmt(savings)} may not fully cover it. You might need financing.`,
    affordability: canAfford ? Math.min(95, affordability + 10) : Math.max(10, affordability - 20),
    risk: canAfford ? Math.max(15, risk - 20) : Math.min(85, risk + 15),
  });

  // Path B: Save First
  paths.push({
    label: 'Save First',
    description: monthsToSave > 0 && monthsToSave !== Infinity
      ? `If you save ${fmt(capacity)} per month, you could reach ${fmt(est.cost)} in approximately ${monthsToSave} months. This reduces financial pressure significantly.`
      : `Building additional savings before committing would reduce your financial risk. Consider setting a target date.`,
    affordability: Math.min(95, affordability + 25),
    risk: Math.max(10, risk - 30),
  });

  // Path C: Alternative
  paths.push({
    label: 'Alternative Approach',
    description: type === 'vehicle'
      ? 'Consider a pre-owned vehicle or a smaller model that fits within your current savings, reducing the financial impact.'
      : type === 'home'
        ? 'Look at smaller properties or emerging areas where prices may be more aligned with your current capacity.'
        : 'Explore lower-cost alternatives, scholarships, or part-time options that reduce the upfront investment required.',
    affordability: Math.min(98, affordability + 35),
    risk: Math.max(5, risk - 40),
  });

  let goalImpact = '';
  if (goals.length > 0) {
    const conflicting = goals.filter((g) => g.targetAmount > savings * 0.5);
    if (conflicting.length > 0) {
      goalImpact = `\n\n**Goal Impact:** This decision may affect your progress toward "${conflicting[0].title}". Based on your current capacity, these goals may compete for the same resources.`;
    }
  }

  return {
    type: 'decision',
    content: `Here's a personalized analysis of your **${est.label}** decision, ${name}.\n\nBased on your current financial position — ${fmt(savings)} in savings with a monthly capacity of ${fmt(capacity)} — here are three possible paths:${goalImpact}`,
    paths,
    affordabilityScore: affordability,
    riskScore: risk,
    actions: [
      { type: 'run_decision', label: 'Run Full Simulation', description: `Open the Decision Lab for a detailed ${est.label} analysis` },
    ],
  };
}

function generateLoanResponse(ctx, fmt, name, lower) {
  const { financial, personal } = ctx;
  const currency = personal.currency;
  const isEducation = lower.includes('education') || lower.includes('study');

  return {
    type: 'text',
    content: `Let me think about a loan for you, ${name}.\n\nBased on your current financial profile:\n- **Monthly income:** ${fmt(financial.monthlyIncome)}\n- **Monthly capacity:** ${fmt(financial.monthlyCapacity)}\n- **Current debt:** ${fmt(financial.totalDebt)}\n- **Debt-to-income ratio:** ${financial.debtToIncomeRatio}%\n\n${financial.debtToIncomeRatio > 50
      ? 'Your current debt-to-income ratio is above 50%. Taking on additional debt may increase your financial pressure. Consider reducing existing debt first.'
      : financial.debtToIncomeRatio > 0
        ? 'You have some existing debt, but your ratio is manageable. A new loan could be feasible if the monthly payments fit within your capacity.'
        : 'You currently have no debt, which gives you more flexibility. However, ensure the monthly loan payments fit comfortably within your monthly savings capacity.'
    }\n\n**Key consideration:** ${isEducation
      ? 'Education loans can be a strategic investment if the expected salary increase justifies the cost. Compare the total repayment amount against your projected income increase.'
      : 'Before taking any loan, calculate the total cost including interest and ensure the monthly EMI does not exceed 30-40% of your monthly income.'
    }\n\nWould you like me to run a detailed loan simulation in the Decision Lab?`,
    actions: [
      { type: 'run_decision', label: 'Open Decision Lab', description: 'Simulate this loan decision with full analysis' },
    ],
  };
}

function generateGoalResponse(ctx, fmt, name) {
  const { financial, goals, personal } = ctx;

  if (goals.length === 0) {
    return {
      type: 'text',
      content: `You don't have any active goals yet, ${name}. Setting specific financial goals can significantly improve your chances of achieving them.\n\nBased on your monthly capacity of ${fmt(financial.monthlyCapacity)}, here are some goal suggestions:\n\n• **Emergency Fund** — Save ${fmt(financial.monthlyExpenses * 3)} (3 months of expenses)\n• **Investment Fund** — Start building an investment portfolio\n• **Major Purchase** — Save toward something important to you\n\nWould you like me to help you create a goal?`,
      actions: [
        { type: 'create_goal', label: 'Create Emergency Fund Goal', description: `Target: ${fmt(financial.monthlyExpenses * 3)}` },
      ],
    };
  }

  const goalSummaries = goals.map((g) =>
    `• **${g.title}**: ${fmt(g.currentAmount)} / ${fmt(g.targetAmount)} (${g.progress}%)`
  ).join('\n');

  const totalMonthlyNeeded = goals.reduce((sum, g) => {
    if (g.deadline && g.progress < 100) {
      const remaining = g.targetAmount - g.currentAmount;
      const monthsLeft = Math.max(1, Math.ceil((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24 * 30)));
      return sum + Math.ceil(remaining / monthsLeft);
    }
    return sum;
  }, 0);

  return {
    type: 'text',
    content: `Here's your goal progress, ${name}:\n\n${goalSummaries}\n\n${totalMonthlyNeeded > financial.monthlyCapacity
      ? `**Attention:** Your combined goals require approximately ${fmt(totalMonthlyNeeded)}/month, but your current monthly capacity is ${fmt(financial.monthlyCapacity)}. You may need to adjust timelines or priorities.`
      : `Your combined goal contributions fit within your monthly capacity of ${fmt(financial.monthlyCapacity)}. You're on a sustainable path.`
    }\n\nWould you like to adjust any goals or add a new one?`,
    actions: [],
  };
}

function generateAffordabilityResponse(ctx, fmt, name) {
  const { financial, personal } = ctx;

  return {
    type: 'text',
    content: `Based on your current financial situation, ${name}:\n\n• **Available savings:** ${fmt(financial.totalSavings)}\n• **Monthly capacity:** ${fmt(financial.monthlyCapacity)}\n• **Emergency fund:** ${financial.emergencyFundMonths} months of expenses\n\nYour affordability depends on the specific decision you're considering. As a general guideline:\n\n• **Comfortable:** Costs up to ${fmt(financial.totalSavings * 0.3)} (30% of savings)\n• **Manageable:** Costs up to ${fmt(financial.totalSavings * 0.6)} (60% of savings)\n• **Stretching:** Costs exceeding ${fmt(financial.totalSavings * 0.6)} may require financing or delayed timeline\n\nWhat specific decision would you like me to analyse?`,
    actions: [
      { type: 'run_decision', label: 'Open Decision Lab', description: 'Analyse a specific financial decision' },
    ],
  };
}

function generateInvestmentResponse(ctx, fmt, name) {
  const { financial, personal } = ctx;
  const investable = Math.max(0, financial.monthlyCapacity * 0.3);

  return {
    type: 'text',
    content: `Let's talk about investing, ${name}.\n\nBased on your financial position:\n• **Monthly investable amount:** Approximately ${fmt(investable)} (30% of your monthly capacity)\n• **Current savings:** ${fmt(financial.totalSavings)}\n• **Emergency fund:** ${financial.emergencyFundMonths} months\n\n${financial.emergencyFundMonths < 3
      ? '**Before investing**, consider building your emergency fund to at least 3 months of expenses. This provides a safety net so you don\'t need to liquidate investments during unexpected events.'
      : 'Your emergency fund looks adequate. You could consider starting or increasing your investment contributions.'
    }

**Possible approaches based on your profile:**
• Conservative: Fixed deposits, government bonds
• Moderate: Index funds, balanced mutual funds
• Aggressive: Growth stocks, sector funds

Would you like to explore a specific investment opportunity in the Decision Lab?`,
    actions: [
      { type: 'run_decision', label: 'Simulate Investment', description: 'Analyse an investment decision' },
    ],
  };
}

function generateHealthResponse(ctx, fmt, name) {
  const { financial, healthScore } = ctx;
  const rating = healthScore >= 71 ? 'strong' : healthScore >= 41 ? 'moderate' : 'needs attention';

  return {
    type: 'text',
    content: `Your Financial Health Score is **${healthScore}/100** — that's ${rating}, ${name}.\n\nHere's a quick breakdown:\n• **Savings rate:** ${financial.savingsRate}% of income ${financial.savingsRate >= 20 ? '— great!' : '— aim for at least 20%'}\n• **Emergency fund:** ${financial.emergencyFundMonths} months of expenses ${financial.emergencyFundMonths >= 3 ? '— solid safety net' : '— aim for 3-6 months'}\n• **Debt-to-income:** ${financial.debtToIncomeRatio}% ${financial.debtToIncomeRatio <= 30 ? '— manageable' : '— consider a debt reduction strategy'}\n\n${healthScore < 50
      ? 'I recommend focusing on building your emergency fund and reducing expenses where possible. Small consistent improvements can make a significant difference over time.'
      : healthScore < 75
        ? 'You\'re on a good path. Consider optimizing your savings rate and reviewing your goals regularly to stay on track.'
        : 'Excellent financial health! Consider exploring investment opportunities or accelerating your goals.'
    }\n\nCheck the Dashboard for a detailed breakdown of your score.`,
    actions: [],
  };
}

function generateExpenseResponse(ctx, fmt, name) {
  const { financial } = ctx;
  const ratio = financial.monthlyIncome > 0
    ? Math.round((financial.monthlyExpenses / financial.monthlyIncome) * 100)
    : 0;

  return {
    type: 'text',
    content: `Let's look at your spending, ${name}.\n\nYour monthly expenses are ${fmt(financial.monthlyExpenses)} against an income of ${fmt(financial.monthlyIncome)} — that's **${ratio}%** of your income.\n\n${ratio > 90
      ? 'Your expenses are very close to your income. Even small reductions can help build savings.'
      : ratio > 70
        ? 'You\'re spending a significant portion of your income. There may be room to optimize.'
        : 'Your spending ratio looks reasonable. Good control over your expenses.'
    }

**Common areas to review:**
• Subscriptions you may not be using
• Dining out frequency
• Transportation costs
• Shopping habits

Would you like help creating a budget or analysing specific expense categories?`,
    actions: [],
  };
}

function generateDebtResponse(ctx, fmt, name) {
  const { financial } = ctx;

  return {
    type: 'text',
    content: `Let's review your debt situation, ${name}.\n\n• **Total debt:** ${fmt(financial.totalDebt)}\n• **Monthly income:** ${fmt(financial.monthlyIncome)}\n• **Debt-to-income ratio:** ${financial.debtToIncomeRatio}%\n\n${financial.totalDebt === 0
      ? 'Great news — you have no debt! This gives you maximum financial flexibility.'
      : financial.debtToIncomeRatio > 100
        ? 'Your debt exceeds your annual income. This is a high-pressure situation. Consider:\n• Prioritizing high-interest debt first (avalanche method)\n• Consolidating debts to reduce interest\n• Increasing income through side work'
        : financial.debtToIncomeRatio > 50
          ? 'Your debt is significant relative to your income. A structured payoff plan can help reduce it systematically.'
          : 'Your debt level is manageable. Continue making regular payments and avoid taking on new high-interest debt.'
    }`,
    actions: financial.totalDebt > 0 ? [
      { type: 'create_goal', label: 'Create Debt Payoff Goal', description: `Target: ${fmt(financial.totalDebt)}` },
    ] : [],
  };
}

function generateEmergencyResponse(ctx, fmt, name) {
  const { financial } = ctx;
  const target = financial.monthlyExpenses * 6;
  const gap = Math.max(0, target - financial.totalSavings);

  return {
    type: 'text',
    content: `Your emergency fund status, ${name}:\n\n• **Current savings:** ${fmt(financial.totalSavings)}\n• **Months of expenses covered:** ${financial.emergencyFundMonths}\n• **Recommended target (6 months):** ${fmt(target)}\n${gap > 0 ? `• **Gap:** ${fmt(gap)}` : '• **Status:** Fully funded!'}\n\n${financial.emergencyFundMonths >= 6
      ? 'Your emergency fund is well-funded. This gives you a strong safety net for unexpected events.'
      : financial.emergencyFundMonths >= 3
        ? 'You have a decent buffer. Consider building toward 6 months for more security.'
        : 'Your emergency fund needs attention. Without adequate savings, unexpected expenses could force you into debt.'
    }\n\n${gap > 0 && financial.monthlyCapacity > 0
      ? `At your current monthly capacity of ${fmt(financial.monthlyCapacity)}, it would take approximately **${Math.ceil(gap / financial.monthlyCapacity)} months** to fully fund your emergency fund.`
      : ''
    }`,
    actions: gap > 0 ? [
      { type: 'create_goal', label: 'Create Emergency Fund Goal', description: `Target: ${fmt(target)}` },
    ] : [],
  };
}

function generateGeneralResponse(ctx, fmt, name, message) {
  const summary = buildContextSummary(ctx);

  return {
    type: 'text',
    content: `I understand your question, ${name}. Based on what I know about your financial situation:\n\n${summary}\n\nI can provide more specific guidance if you tell me more about what you'd like to explore. For example:\n\n• Ask about a **specific decision** — "Can I afford a vehicle?"\n• Ask about your **goals** — "How are my goals progressing?"\n• Ask about your **financial health** — "How is my financial health?"\n• Ask about **spending** — "Where can I reduce expenses?"\n\nWhat would you like to discuss?`,
    actions: [],
  };
}

// ============================================================
// Utilities
// ============================================================

function matchesAny(text, keywords) {
  return keywords.some((kw) => text.includes(kw));
}
