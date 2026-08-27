import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useUserStore } from '@/stores/user.store';
import { simulateDecision } from '@/services/ai.service';
import { saveDecision as saveToFirestore } from '@/services/firestore.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';
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
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';

const iconMap = {
  GraduationCap,
  Heart,
  Car,
  Home,
  Briefcase,
};

export function DecisionSimulatorPage() {
  const { user } = useAuthStore();
  const { profile } = useUserStore();
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: select, 1: form, 2: result

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setFormData({});
    setResult(null);
    setStep(1);
  };

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await simulateDecision(selectedType, formData);
      setResult(res);
      setStep(2);

      // Save to Firestore
      if (user?.uid) {
        await saveToFirestore(user.uid, {
          type: selectedType,
          input: formData,
          result: res,
        });
      }
    } catch (err) {
      console.error('Simulation failed:', err);
      // Fallback: generate local result
      setResult(generateLocalSimulation(selectedType, formData, profile));
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedType(null);
    setFormData({});
    setResult(null);
    setStep(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Decision Simulator</h1>
        <p className="text-slate-500 mt-1">Simulate major life decisions and understand their financial impact</p>
      </div>

      {step === 0 && <DecisionTypeSelector onSelect={handleTypeSelect} />}
      {step === 1 && selectedType && (
        <DecisionForm
          type={selectedType}
          formData={formData}
          setFormData={setFormData}
          onSimulate={handleSimulate}
          onBack={handleReset}
          loading={loading}
        />
      )}
      {step === 2 && result && (
        <DecisionResult
          type={selectedType}
          result={result}
          formData={formData}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

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
                Simulate <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function DecisionForm({ type, formData, setFormData, onSimulate, onBack, loading }) {
  const config = DECISION_TYPES[type];

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const canSubmit = config.fields.every((f) => formData[f.name]);

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to decisions
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{config.label} Simulation</CardTitle>
          <CardDescription>Enter the details to simulate this decision</CardDescription>
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
                <RotateCcw className="w-4 h-4 animate-spin" /> Analyzing...
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" /> Run Simulation
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function DecisionResult({ type, result, formData, onReset }) {
  const config = DECISION_TYPES[type];
  const Icon = iconMap[config.icon] || Sparkles;

  const affordability = result.affordabilityScore ?? 50;
  const risk = result.riskScore ?? 50;
  const alternatives = result.alternativePaths || [];
  const analysis = result.analysis || '';
  const breakdown = result.costBreakdown || result.breakdown || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary-50">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{config.label} Analysis</h2>
            <p className="text-sm text-slate-500">Simulation results</p>
          </div>
        </div>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="w-4 h-4 mr-2" /> New Simulation
        </Button>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col items-center py-6">
          <h3 className="text-sm font-medium text-slate-500 mb-3">Affordability Score</h3>
          <ScoreRing score={affordability} size={130} strokeWidth={10} />
          <p className="text-xs text-slate-400 mt-2">Can you afford this decision?</p>
        </Card>
        <Card className="flex flex-col items-center py-6">
          <h3 className="text-sm font-medium text-slate-500 mb-3">Risk Score</h3>
          <ScoreRing score={risk} size={130} strokeWidth={10} />
          <p className="text-xs text-slate-400 mt-2">Financial risk level</p>
        </Card>
      </div>

      {/* Analysis */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" /> AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{analysis}</p>
          </CardContent>
        </Card>
      )}

      {/* Cost Breakdown */}
      {Object.keys(breakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(breakdown).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {typeof value === 'number' ? formatCurrency(value) : value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alternative Paths */}
      {alternatives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" /> Alternative Paths
            </CardTitle>
            <CardDescription>Consider these alternatives that may achieve similar outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alternatives.map((alt, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="p-1.5 rounded-lg bg-primary-100 flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {typeof alt === 'string' ? alt : alt.title || alt.description || JSON.stringify(alt)}
                    </p>
                    {alt.description && typeof alt !== 'string' && (
                      <p className="text-xs text-slate-500 mt-1">{alt.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function generateLocalSimulation(type, formData, profile) {
  // Fallback simulation when AI is not available
  const income = profile?.monthlyIncome || 0;
  const savings = profile?.totalSavings || 0;

  const costs = Object.values(formData).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const affordability = Math.min(100, Math.max(0, Math.round((savings / costs) * 100)));
  const risk = Math.min(100, Math.max(0, 100 - affordability + 20));

  return {
    affordabilityScore: affordability,
    riskScore: risk,
    costBreakdown: {
      'Total Cost': costs,
      'Available Savings': savings,
      'Shortfall': Math.max(0, costs - savings),
      'Months of Income': costs > 0 ? Math.round(costs / Math.max(1, income)) : 0,
    },
    alternativePaths: [
      'Consider starting with a smaller budget and scaling up gradually',
      'Look for scholarship, grant, or subsidized alternatives',
      'Build up savings for 6-12 months before committing',
    ],
    analysis: `Based on your current financial profile, this decision would require ${formatCurrency(costs)}. Your affordability score of ${affordability}/100 suggests this is ${affordability > 60 ? 'reasonably feasible' : 'financially challenging at this time'}. Consider the alternative paths below for a more optimal approach.`,
  };
}
