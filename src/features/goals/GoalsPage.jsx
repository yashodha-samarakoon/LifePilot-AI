import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useUserStore } from '@/stores/user.store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { formatCurrency } from '@/lib/utils';
import { GOAL_CATEGORIES, GOAL_PRIORITIES, GOAL_STATUSES } from '@/lib/constants';
import { GoalConflictBanner } from './GoalConflictBanner';
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  Pause,
  Play,
  CheckCircle2,
  Archive,
  X,
  MessageSquare,
  Calendar,
  Flag,
  ArrowRight,
} from 'lucide-react';

const FILTER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

export function GoalsPage() {
  const { user } = useAuthStore();
  const { profile, goals, fetchProfile, fetchGoals, createGoal, editGoal, removeGoal } = useUserStore();
  const [filter, setFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      fetchProfile(user.uid);
      fetchGoals(user.uid);
    }
  }, [user]);

  const currency = profile?.currency || 'USD';
  const filteredGoals = filter === 'all'
    ? goals.filter((g) => g.status !== 'archived')
    : goals.filter((g) => g.status === filter);

  const handleCreate = async (data) => {
    if (!user?.uid) return;
    await createGoal(user.uid, data);
    setShowDialog(false);
  };

  const handleEdit = async (data) => {
    if (!user?.uid || !editingGoal) return;
    await editGoal(user.uid, editingGoal.id, data);
    setEditingGoal(null);
    setShowDialog(false);
  };

  const handleStatusChange = async (goal, newStatus) => {
    if (!user?.uid) return;
    await editGoal(user.uid, goal.id, { status: newStatus });
  };

  const handleDelete = async (goal) => {
    if (!user?.uid) return;
    await removeGoal(user.uid, goal.id);
  };

  const openEdit = (goal) => {
    setEditingGoal(goal);
    setShowDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Goals</h1>
          <p className="text-slate-500 mt-1">Create, track, and manage your financial goals</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/chat">
            <Button variant="outline" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Create from AI
            </Button>
          </Link>
          <Button onClick={() => { setEditingGoal(null); setShowDialog(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Conflict Banner */}
      <GoalConflictBanner goals={goals} profile={profile} />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === tab.value
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-slate-400">
              ({tab.value === 'all'
                ? goals.filter((g) => g.status !== 'archived').length
                : goals.filter((g) => g.status === tab.value).length})
            </span>
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-16">
          <Target className="w-16 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-600">
            {filter === 'all' ? 'No goals yet' : `No ${filter} goals`}
          </h3>
          <p className="text-slate-400 mt-1 mb-4">
            {filter === 'all'
              ? 'Create your first financial goal to get started'
              : `You don't have any ${filter} goals at the moment`}
          </p>
          {filter === 'all' && (
            <Button onClick={() => setShowDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Goal
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              currency={currency}
              onEdit={() => openEdit(goal)}
              onStatusChange={handleStatusChange}
              onDelete={() => handleDelete(goal)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      {showDialog && (
        <GoalDialog
          goal={editingGoal}
          onSave={editingGoal ? handleEdit : handleCreate}
          onClose={() => { setShowDialog(false); setEditingGoal(null); }}
        />
      )}
    </div>
  );
}

/* ─── Goal Card ────────────────────────────────────── */
function GoalCard({ goal, currency, onEdit, onStatusChange, onDelete }) {
  const progress = goal.targetAmount > 0
    ? Math.min(100, Math.round(((goal.currentAmount || 0) / goal.targetAmount) * 100))
    : 0;

  const statusConfig = GOAL_STATUSES.find((s) => s.value === goal.status) || GOAL_STATUSES[0];
  const priorityConfig = GOAL_PRIORITIES.find((p) => p.value === goal.priority);
  const categoryConfig = GOAL_CATEGORIES.find((c) => c.value === goal.category);

  return (
    <Card className="relative group hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        {/* Top row: category + priority */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-xs">
            {categoryConfig?.label || goal.category || 'General'}
          </Badge>
          <div className="flex items-center gap-1.5">
            {priorityConfig && (
              <span className={`w-2 h-2 rounded-full ${priorityConfig.color}`} />
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-900 mb-1">{goal.title}</h3>

        {/* Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500">{formatCurrency(goal.currentAmount || 0, currency)}</span>
            <span className="font-medium text-slate-700">{progress}%</span>
          </div>
          <Progress value={progress} />
          <p className="text-xs text-slate-400 mt-1">
            of {formatCurrency(goal.targetAmount || 0, currency)} target
          </p>
        </div>

        {/* Deadline */}
        {goal.deadline && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 mt-4 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
          {goal.status === 'active' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1"
              onClick={() => onStatusChange(goal, 'paused')}
            >
              <Pause className="w-3 h-3" /> Pause
            </Button>
          )}
          {goal.status === 'paused' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1"
              onClick={() => onStatusChange(goal, 'active')}
            >
              <Play className="w-3 h-3" /> Resume
            </Button>
          )}
          {(goal.status === 'active' || goal.status === 'paused') && progress >= 100 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 text-emerald-600"
              onClick={() => onStatusChange(goal, 'completed')}
            >
              <CheckCircle2 className="w-3 h-3" /> Complete
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1"
            onClick={onEdit}
          >
            <Pencil className="w-3 h-3" /> Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1 text-rose-500 hover:text-rose-700 ml-auto"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Goal Create / Edit Dialog ─────────────────────── */
function GoalDialog({ goal, onSave, onClose }) {
  const [form, setForm] = useState({
    title: goal?.title || '',
    category: goal?.category || 'savings',
    targetAmount: goal?.targetAmount || '',
    currentAmount: goal?.currentAmount || '',
    deadline: goal?.deadline || '',
    priority: goal?.priority || 'medium',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.targetAmount) return;
    onSave({
      ...form,
      targetAmount: Number(form.targetAmount) || 0,
      currentAmount: Number(form.currentAmount) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-bold text-slate-900">
            {goal ? 'Edit Goal' : 'Create New Goal'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="goal-title">Goal Name</Label>
            <Input
              id="goal-title"
              placeholder="e.g. Emergency Fund"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="goal-category">Category</Label>
            <select
              id="goal-category"
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {GOAL_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <Label htmlFor="goal-target">Target Amount</Label>
            <Input
              id="goal-target"
              type="number"
              placeholder="500000"
              value={form.targetAmount}
              onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
            />
          </div>

          {/* Current Amount (edit only) */}
          {goal && (
            <div className="space-y-2">
              <Label htmlFor="goal-current">Current Amount Saved</Label>
              <Input
                id="goal-current"
                type="number"
                placeholder="0"
                value={form.currentAmount}
                onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
              />
            </div>
          )}

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="goal-deadline">Target Deadline</Label>
            <Input
              id="goal-deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="flex gap-2">
              {GOAL_PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p.value })}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    form.priority === p.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${p.color}`} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!form.title || !form.targetAmount}>
              {goal ? 'Save Changes' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
