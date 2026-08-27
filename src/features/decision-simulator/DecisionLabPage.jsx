import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useUserStore } from '@/stores/user.store';
import { useDashboardStore } from '@/stores/dashboard.store';
import { saveDecision } from '@/services/firestore.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { formatCurrency, getScoreColor } from '@/lib/utils';
import { DECISION_TYPES } from '@/lib/constants';
import {
  GraduationCap,
  Heart,
  Car,
  Home,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Lightbulb,
  Plane,
  FlaskConical,
  MessageSquare,
  Save,
  CheckCircle2,
  AlertTriangle,
  Eye,
} from 'lucide-react';

const iconMap = {
  GraduationCap, Heart, Car, Home, Briefcase,
  TrendingUp, Plane, FlaskConical,
};

export function DecisionLabPage() {
  const { user } = useAuthStore();
  const { profile } = useUserStore();
  const { decisions, fetchDecisions } = useDashboardStore();
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: select, 1: form, 2: result
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.uid) fetchDecisions(user.uid);
  }, [user]);

  const currency = profile?.currency || 'USD';

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setFormData({});
    setResult(null);
    setSaved(false);
    setStep(1);
  };

  const handleSimulate = async () => {
    setLoading(true);
    // Generate local simulation
    const res = generateLocalSimulation(selectedType, formData, profile, currency);
    setResult(res);
    setStep(2);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user?.uid || !result) return;
    await saveDecision(user.uid, {
      type: selectedType,
      input: formData,
      result,
    });
    setSaved(true);
    if (user?.uid) fetchDecisions(user.uid);
  };

  const handleReset = () => {
    setSelectedType(null);
    setFormData({});
    setResult(null);
    setSaved(false);
    setStep(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Decision Lab</h1>
          <p className="text-slate-500 mt-1">Analyse major financial decisions with personalized guidance</p>
        </div>
        <Link to="/chat">
          <Button variant="outline" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Start from AI Chat
          </Button>
        </Link>
      </div>

      {step === 0 && (
        <>
          <DecisionTypeSelector onSelect={handleTypeSelect} />
          {/* Past decisions */}
          {decisions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Saved Scenarios</CardTitle>
                <CardDescription>Previously analysed decisions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {decisions.slice(0, 5).map((d) => {
                    const config = DECISION_TYPES[d.type];
                    const Icon = iconMap[config?.icon] || FlaskConical;
                    return (
                      <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div className="p-2 rounded-lg bg-primary-50">
                          <Icon className="w-4 h-4 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{config?.label || d.type}</p>
                          <p className="text-xs text-slate-400">
                            {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                        {d.result?.affordabilityScore != null && (
                          <Badge variant="outline" className={getScoreColor(d.result.affordabilityScore).text}>
                            {d.result.affordabilityScore}% afford.
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {step === 1 && selectedType && (
        <DecisionForm
          type={selectedType}
          formData={formData}
          setFormData={setFormData}
          onSimulate={handleSimulate}
          onBack={handleReset}
          loading={loading}
          currency={currency}
        />
      )}

      {step === 2 && result && (
        <DecisionResult
          type={selectedType}
          result={result}
          formData={formData}
          currency={currency}
          saved={saved}
          onSave={handleSave}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

/* ─── Decision Type Selector ──────────────────────── */
function DecisionTypeSelector({ onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(DECISION_TYPES).map(([key, config]) => {
        const Icon = iconMap[config.icon] || Sparkles;
        return (
          <Card
            key={key}
            className="cursor-pointer hover:border-primary-300 hover:shadow-md transition-all"
            onClick={() => onSelect(key)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-primary-50">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{config.label}</h3>
                  <p className="text-xs text-slate-500">{config.description}</p>
                </div>
              </div>
              <div className="flex items-center text-primary-600 text-sm font-medium">
                Analyse <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ─── Decision Form ────────────────────────────────── */
function DecisionForm({ type, formData, setFormData, onSimulate, onBack, loading, currency }) {
  const config = DECISION_TYPES[type];
  const updateField = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }));
  const canSubmit = config.fields.every((f) => formData[f.name]);

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to decisions
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{config.label} Analysis</CardTitle>
          <CardDescription>Enter the details to analyse this decision. All amounts in {currency}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                type={field.type}
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
                onChange={(e) => updateField(field.name, e.target.value)}
              />
            </div>
          ))}

          <Button
            className="w-full mt-4"
            size="lg"
            onClick={onSimulate}
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 animate-spin" /> Analysing...
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" /> Run Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Decision Result (Path A / B / C) ──────────────── */
function DecisionResult({ type, result, formData, currency, saved, onSave, onReset }) {
  const config = DECISION_TYPES[type];
  const Icon = iconMap[config.icon] || Sparkles;
  const paths = result.paths || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary-50">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{config.label} Analysis</h2>
            <p className="text-sm text-slate-500">Estimated results based on your current profile</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!saved && (
            <Button variant="outline" onClick={onSave} className="gap-2">
              <Save className="w-4 h-4" /> Save Scenario
            </Button>
          )}
          {saved && (
            <Badge className="bg-emerald-50 text-emerald-700 gap-1">
              <CheckCircle2 className="w-3 h-3" /> Saved
            </Badge>
          )}
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-2" /> New Analysis
          </Button>
        </div>
      </div>

      {/* Overall Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col items-center py-6">
          <h3 className="text-sm font-medium text-slate-500 mb-3">Overall Affordability</h3>
          <ScoreRing score={result.affordabilityScore ?? 50} size={130} strokeWidth={10} />
          <p className="text-xs text-slate-400 mt-2">Estimated based on your profile</p>
        </Card>
        <Card className="flex flex-col items-center py-6">
          <h3 className="text-sm font-medium text-slate-500 mb-3">Risk Level</h3>
          <ScoreRing score={result.riskScore ?? 50} size={130} strokeWidth={10} />
          <p className="text-xs text-slate-400 mt-2">
            {(result.riskScore ?? 50) > 60 ? 'Higher risk' : (result.riskScore ?? 50) > 30 ? 'Moderate risk' : 'Lower risk'}
          </p>
        </Card>
      </div>

      {/* Path Comparison Cards */}
      {paths.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Comparison Paths</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paths.map((path, i) => (
              <PathResultCard key={i} path={path} index={i} currency={currency} />
            ))}
          </div>
        </div>
      )}

      {/* Analysis */}
      {result.analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" /> Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{result.analysis}</p>
          </CardContent>
        </Card>
      )}

      {/* Cost Breakdown */}
      {result.breakdown && Object.keys(result.breakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(result.breakdown).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {typeof value === 'number' ? formatCurrency(value, currency) : value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Links */}
      <div className="flex flex-wrap gap-3">
        <Link to="/insights">
          <Button variant="outline" className="gap-2">
            <Eye className="w-4 h-4" /> View Related Blind Spots
          </Button>
        </Link>
        <Link to="/chat">
          <Button variant="outline" className="gap-2">
            <MessageSquare className="w-4 h-4" /> Discuss with AI
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ─── Path Result Card ─────────────────────────────── */
function PathResultCard({ path, index, currency }) {
  const colors = [
    { border: 'border-l-primary-500', bg: 'bg-primary-50', badge: 'bg-primary-100 text-primary-700', label: 'Recommended' },
    { border: 'border-l-amber-500', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700', label: 'Balanced' },
    { border: 'border-l-blue-500', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700', label: 'Conservative' },
  ];
  const color = colors[index % colors.length];

  return (
    <Card className={`border-l-4 ${color.border}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${color.badge}`}>
            Path {String.fromCharCode(65 + index)}: {path.label || color.label}
          </span>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-4">{path.description}</p>

        {/* Mini scores */}
        <div className="space-y-2">
          {path.affordability != null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Affordability</span>
              <span className={`text-xs font-semibold ${getScoreColor(path.affordability).text}`}>{path.affordability}%</span>
            </div>
          )}
          {path.risk != null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Risk</span>
              <span className="text-xs font-semibold text-slate-600">{path.risk}%</span>
            </div>
          )}
          {path.timeline && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Timeline</span>
              <span className="text-xs font-semibold text-slate-600">{path.timeline}</span>
            </div>
          )}
          {path.savingsImpact != null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Savings Impact</span>
              <span className="text-xs font-semibold text-slate-600">{formatCurrency(path.savingsImpact, currency)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Local Simulation Generator ───────────────────── */
function generateLocalSimulation(type, formData, profile, currency) {
  const income = profile?.monthlyIncome || 0;
  const expenses = profile?.monthlyExpenses || 0;
  const savings = profile?.totalSavings || 0;
  const debt = profile?.totalDebt || 0;
  const monthlyCapacity = income - expenses;

  // Extract total cost from form data
  const numericValues = Object.values(formData).map(Number).filter((n) => !isNaN(n));
  const totalCost = numericValues.reduce((sum, v) => sum + v, 0);
  const primaryCost = numericValues[0] || totalCost;

  // Affordability based on savings coverage and monthly capacity
  const savingsCoverage = primaryCost > 0 ? Math.min(100, Math.round((savings / primaryCost) * 100)) : 50;
  const monthlyCoverage = monthlyCapacity > 0 && primaryCost > 0
    ? Math.min(100, Math.round((monthlyCapacity / (primaryCost / 12)) * 100))
    : 30;
  const affordability = Math.round(savingsCoverage * 0.4 + monthlyCoverage * 0.6);

  // Risk: higher if debt is high, affordability is low
  const debtFactor = debt > 0 ? Math.min(30, Math.round((debt / (income * 12)) * 50)) : 0;
  const risk = Math.min(100, Math.max(5, 100 - affordability + debtFactor));

  // Generate 3 paths
  const paths = [
    {
      label: 'Act Now',
      description: `Proceed with the ${DECISION_TYPES[type]?.label || 'decision'} immediately using current savings and financing the remainder.`,
      affordability: Math.min(100, affordability + 5),
      risk: Math.min(100, risk + 10),
      timeline: 'Immediate',
      savingsImpact: -(primaryCost - savings > 0 ? primaryCost - savings : 0),
    },
    {
      label: 'Save First',
      description: `Build dedicated savings for ${Math.round(primaryCost / Math.max(1, monthlyCapacity))} months before proceeding. Reduces financial stress significantly.`,
      affordability: Math.min(100, affordability + 20),
      risk: Math.max(0, risk - 20),
      timeline: `${Math.max(6, Math.round(primaryCost / Math.max(1, monthlyCapacity)))} months`,
      savingsImpact: 0,
    },
    {
      label: 'Scaled Alternative',
      description: `Start with a reduced scope at ~60% of the original budget. Achieve core objectives while maintaining financial safety.`,
      affordability: Math.min(100, Math.round(affordability * 1.4)),
      risk: Math.max(0, Math.round(risk * 0.6)),
      timeline: 'Flexible',
      savingsImpact: -(Math.round(primaryCost * 0.6) - savings > 0 ? Math.round(primaryCost * 0.6) - savings : 0),
    },
  ];

  return {
    affordabilityScore: affordability,
    riskScore: risk,
    paths,
    breakdown: {
      'Total Estimated Cost': primaryCost,
      'Available Savings': savings,
      'Monthly Capacity': monthlyCapacity,
      'Estimated Shortfall': Math.max(0, primaryCost - savings),
      'Months to Save': monthlyCapacity > 0 ? Math.ceil((primaryCost - savings) / monthlyCapacity) : 'N/A',
    },
    analysis: `Based on your current financial profile, the estimated cost is ${formatCurrency(primaryCost, currency)}. Your affordability score of ${affordability}/100 suggests this is ${affordability > 60 ? 'reasonably feasible' : affordability > 30 ? 'challenging but possible with planning' : 'financially stretching at this time'}. The Path A (Act Now) approach carries higher risk but achieves immediate results, while Path B (Save First) offers a safer timeline. Consider the Path C alternative for a balanced approach. These are estimates based on your current data — actual outcomes may vary.`,
  };
}
