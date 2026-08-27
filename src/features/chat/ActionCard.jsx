import {
  Target,
  FlaskConical,
  Sparkles,
  ArrowRight,
  Settings,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const actionIcons = {
  create_goal: Target,
  run_decision: FlaskConical,
  view_insights: Sparkles,
  update_profile: Settings,
};

/**
 * Inline action card that appears in chat when AI detects an actionable item.
 * Shows a title, description, and confirm/dismiss buttons.
 */
export function ActionCard({ action, onExecute, onDismiss }) {
  const Icon = actionIcons[action.type] || ArrowRight;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-accent-200 bg-accent-50 max-w-md">
      <div className="p-2 rounded-lg bg-accent-100 flex-shrink-0">
        <Icon className="w-4 h-4 text-accent-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-accent-900">{action.label}</p>
        {action.description && (
          <p className="text-xs text-accent-600 mt-0.5 truncate">{action.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-3 text-xs bg-accent-600 text-white hover:bg-accent-700"
          onClick={() => onExecute(action)}
        >
          Go
        </Button>
        {onDismiss && (
          <button
            onClick={() => onDismiss()}
            className="p-1 rounded text-accent-400 hover:text-accent-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
