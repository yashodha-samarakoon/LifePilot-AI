export const APP_NAME = 'LifePilot AI';
export const APP_TAGLINE = 'Your Personalized AI Financial Companion';

// ============================================================
// Navigation
// ============================================================

export const SIDEBAR_NAV = [
  { label: 'Dashboard',      path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'AI Companion',   path: '/chat',      icon: 'MessageSquare', highlight: true },
  { label: 'My Journey',     path: '/journey',   icon: 'Map' },
  { label: 'Goals',          path: '/goals',     icon: 'Target' },
  { label: 'Decision Lab',   path: '/decisions', icon: 'FlaskConical' },
  { label: 'Insights',       path: '/insights',  icon: 'Sparkles' },
  { label: 'Settings',       path: '/settings',  icon: 'Settings' },
];

// ============================================================
// Onboarding — Roles
// ============================================================

export const ROLES = [
  { value: 'student',        label: 'Student',                  icon: 'GraduationCap' },
  { value: 'professional',   label: 'Working Professional',     icon: 'Briefcase' },
  { value: 'freelancer',     label: 'Freelancer / Self-employed', icon: 'Laptop' },
  { value: 'employee',       label: 'Employee',                 icon: 'Building2' },
  { value: 'business-owner', label: 'Business Owner',           icon: 'Store' },
];

export const AGE_RANGES = [
  { value: '18-24', label: '18 – 24' },
  { value: '25-34', label: '25 – 34' },
  { value: '35-44', label: '35 – 44' },
  { value: '45-54', label: '45 – 54' },
  { value: '55+',   label: '55+' },
];

export const RISK_TOLERANCE = [
  { value: 'conservative', label: 'Conservative', description: 'Prefer safety over high returns' },
  { value: 'moderate',     label: 'Moderate',     description: 'Balanced approach to risk' },
  { value: 'aggressive',   label: 'Aggressive',   description: 'Comfortable with higher risk for higher returns' },
];

// ============================================================
// Onboarding — Interaction Preference
// ============================================================

export const INTERACTION_PREFERENCES = [
  {
    value: 'journey',
    label: 'Guide My Financial Journey',
    description: 'Track goals, monitor progress, get continuous insights and personalized financial guidance.',
    icon: 'Map',
  },
  {
    value: 'decision',
    label: 'Help Me Make Better Decisions',
    description: 'Use AI conversations for personalized analysis when I face financial decisions.',
    icon: 'MessageSquare',
  },
  {
    value: 'undecided',
    label: 'Not Sure Yet',
    description: 'Start simple and explore both experiences. You can change anytime.',
    icon: 'Compass',
  },
];

// ============================================================
// Goals
// ============================================================

export const GOAL_CATEGORIES = [
  { value: 'savings',        label: 'Savings Goal' },
  { value: 'investment',     label: 'Investment Goal' },
  { value: 'debt-payoff',    label: 'Debt Payoff' },
  { value: 'purchase',       label: 'Major Purchase' },
  { value: 'education',      label: 'Education' },
  { value: 'emergency-fund', label: 'Emergency Fund' },
  { value: 'retirement',     label: 'Retirement' },
  { value: 'travel',         label: 'Travel' },
];

export const GOAL_PRIORITIES = [
  { value: 'low',    label: 'Low',    color: 'bg-slate-400' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500' },
  { value: 'high',   label: 'High',   color: 'bg-rose-500' },
];

export const GOAL_STATUSES = [
  { value: 'active',    label: 'Active',    color: 'text-primary-700 bg-primary-50' },
  { value: 'paused',    label: 'Paused',    color: 'text-amber-700 bg-amber-50' },
  { value: 'completed', label: 'Completed', color: 'text-emerald-700 bg-emerald-50' },
  { value: 'archived',  label: 'Archived',  color: 'text-slate-500 bg-slate-100' },
];

// ============================================================
// Expenses
// ============================================================

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Rent / Housing',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Education',
  'Subscriptions',
  'Insurance',
  'Other',
];

// ============================================================
// Decision Lab
// ============================================================

export const DECISION_TYPES = {
  education: {
    label: 'Higher Education',
    icon: 'GraduationCap',
    description: 'Evaluate pursuing further education',
    fields: [
      { name: 'programCost', label: 'Program Cost', type: 'number', placeholder: '500000' },
      { name: 'duration', label: 'Duration (years)', type: 'number', placeholder: '2' },
      { name: 'expectedSalaryIncrease', label: 'Expected Salary Increase (%)', type: 'number', placeholder: '30' },
    ],
  },
  educationLoan: {
    label: 'Education Loan',
    icon: 'GraduationCap',
    description: 'Assess taking a loan for education',
    fields: [
      { name: 'loanAmount', label: 'Loan Amount', type: 'number', placeholder: '1000000' },
      { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', placeholder: '8.5' },
      { name: 'loanTenure', label: 'Repayment Tenure (years)', type: 'number', placeholder: '5' },
      { name: 'expectedSalaryIncrease', label: 'Expected Salary Increase (%)', type: 'number', placeholder: '40' },
    ],
  },
  marriage: {
    label: 'Marriage',
    icon: 'Heart',
    description: 'Plan for marriage expenses',
    fields: [
      { name: 'weddingBudget', label: 'Wedding Budget', type: 'number', placeholder: '300000' },
      { name: 'partnerIncome', label: "Partner's Monthly Income", type: 'number', placeholder: '40000' },
      { name: 'sharedExpenses', label: 'Estimated Shared Monthly Expenses', type: 'number', placeholder: '25000' },
    ],
  },
  vehicle: {
    label: 'Vehicle Purchase',
    icon: 'Car',
    description: 'Assess vehicle purchase affordability',
    fields: [
      { name: 'vehicleCost', label: 'Vehicle Cost', type: 'number', placeholder: '800000' },
      { name: 'downPayment', label: 'Down Payment', type: 'number', placeholder: '200000' },
      { name: 'loanTenure', label: 'Loan Tenure (years)', type: 'number', placeholder: '5' },
      { name: 'fuelMaintenance', label: 'Monthly Fuel & Maintenance', type: 'number', placeholder: '5000' },
    ],
  },
  home: {
    label: 'Home Purchase',
    icon: 'Home',
    description: 'Evaluate home purchase viability',
    fields: [
      { name: 'propertyCost', label: 'Property Cost', type: 'number', placeholder: '5000000' },
      { name: 'downPaymentPercent', label: 'Down Payment (%)', type: 'number', placeholder: '20' },
      { name: 'loanTenure', label: 'Loan Tenure (years)', type: 'number', placeholder: '20' },
      { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', placeholder: '8.5' },
    ],
  },
  homeLoan: {
    label: 'Home Loan',
    icon: 'Home',
    description: 'Compare home loan options',
    fields: [
      { name: 'loanAmount', label: 'Loan Amount', type: 'number', placeholder: '4000000' },
      { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', placeholder: '8.5' },
      { name: 'loanTenure', label: 'Loan Tenure (years)', type: 'number', placeholder: '20' },
      { name: 'rentalAlternative', label: 'Monthly Rent for Similar Home', type: 'number', placeholder: '15000' },
    ],
  },
  business: {
    label: 'Business Venture',
    icon: 'Briefcase',
    description: 'Assess starting a business',
    fields: [
      { name: 'startupCost', label: 'Startup Cost', type: 'number', placeholder: '1000000' },
      { name: 'runwayMonths', label: 'Runway (months)', type: 'number', placeholder: '12' },
      { name: 'expectedRevenue', label: 'Expected Monthly Revenue', type: 'number', placeholder: '100000' },
      { name: 'breakevenMonths', label: 'Expected Break-even (months)', type: 'number', placeholder: '18' },
    ],
  },
  investment: {
    label: 'Investment',
    icon: 'TrendingUp',
    description: 'Evaluate an investment opportunity',
    fields: [
      { name: 'investmentAmount', label: 'Investment Amount', type: 'number', placeholder: '200000' },
      { name: 'expectedReturn', label: 'Expected Annual Return (%)', type: 'number', placeholder: '12' },
      { name: 'timeHorizon', label: 'Time Horizon (years)', type: 'number', placeholder: '5' },
      { name: 'riskLevel', label: 'Risk Level (1-10)', type: 'number', placeholder: '6' },
    ],
  },
  migration: {
    label: 'Migration',
    icon: 'Plane',
    description: 'Assess financial impact of relocating',
    fields: [
      { name: 'relocationCost', label: 'Total Relocation Cost', type: 'number', placeholder: '2000000' },
      { name: 'expectedIncome', label: 'Expected Monthly Income at Destination', type: 'number', placeholder: '150000' },
      { name: 'livingCostIncrease', label: 'Expected Living Cost Increase (%)', type: 'number', placeholder: '50' },
      { name: 'visaProcessingCost', label: 'Visa & Processing Cost', type: 'number', placeholder: '500000' },
    ],
  },
  custom: {
    label: 'Custom Decision',
    icon: 'FlaskConical',
    description: 'Analyse any financial decision',
    fields: [
      { name: 'decisionTitle', label: 'Decision Title', type: 'text', placeholder: 'e.g. Buy equipment' },
      { name: 'totalCost', label: 'Estimated Total Cost', type: 'number', placeholder: '500000' },
      { name: 'monthlyImpact', label: 'Estimated Monthly Impact', type: 'number', placeholder: '10000' },
      { name: 'timeHorizon', label: 'Time Horizon (years)', type: 'number', placeholder: '3' },
    ],
  },
};
