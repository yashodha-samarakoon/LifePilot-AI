import { Sparkles, User } from 'lucide-react';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { formatCurrency, getScoreColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ActionCard } from './ActionCard';

/**
 * Renders a single chat message (user or AI).
 * AI messages support structured content: text, decision paths, risk indicators.
 */
export function ChatMessage({ message, profile, onAction }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          <div className="chat-bubble-user">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 max-w-3xl">
      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-1">
        <Sparkles className="w-4 h-4 text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="chat-bubble-ai">
          {/* Main text content */}
          {message.content && (
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              <FormattedText text={message.content} currency={profile?.currency} />
            </div>
          )}

          {/* Decision paths (structured comparison cards) */}
          {message.type === 'decision' && message.paths && (
            <div className="mt-4 space-y-3">
              {message.paths.map((path, i) => (
                <PathCard key={i} path={path} index={i} currency={profile?.currency} />
              ))}
            </div>
          )}

          {/* Score indicators */}
          {(message.affordabilityScore != null || message.riskScore != null) && (
            <div className="flex gap-6 mt-4 pt-4 border-t border-slate-100">
              {message.affordabilityScore != null && (
                <div className="flex items-center gap-3">
                  <ScoreRing score={message.affordabilityScore} size={56} strokeWidth={5} />
                  <div>
                    <p className="text-xs font-medium text-slate-500">Affordability</p>
                    <p className="text-xs text-slate-400">Estimated</p>
                  </div>
                </div>
              )}
              {message.riskScore != null && (
                <div className="flex items-center gap-3">
                  <ScoreRing score={100 - message.riskScore} size={56} strokeWidth={5} />
                  <div>
                    <p className="text-xs font-medium text-slate-500">Risk Level</p>
                    <p className="text-xs text-slate-400">
                      {message.riskScore > 60 ? 'Higher' : message.riskScore > 30 ? 'Moderate' : 'Lower'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action cards (outside bubble) */}
        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {message.actions.map((action, i) => (
              <ActionCard
                key={i}
                action={action}
                onExecute={onAction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Path Comparison Card ─────────────────────────────── */
function PathCard({ path, index, currency }) {
  const colors = [
    { border: 'border-l-primary-500', bg: 'bg-primary-50', badge: 'bg-primary-100 text-primary-700' },
    { border: 'border-l-amber-500', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
    { border: 'border-l-blue-500', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
  ];
  const color = colors[index % colors.length];

  return (
    <div className={cn('rounded-lg border border-slate-200 border-l-4 p-4', color.border)}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', color.badge)}>
          Path {String.fromCharCode(65 + index)}: {path.label}
        </span>
        <div className="flex gap-2 text-xs">
          {path.affordability != null && (
            <span className={cn('font-medium', getScoreColor(path.affordability).text)}>
              {path.affordability}% afford.
            </span>
          )}
          {path.risk != null && (
            <span className="text-slate-400">
              {path.risk}% risk
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{path.description}</p>
    </div>
  );
}

/* ─── Formatted Text (basic markdown-like rendering) ──── */
function FormattedText({ text, currency }) {
  if (!text) return null;

  // Split by double newlines for paragraphs
  const paragraphs = text.split('\n');

  return (
    <>
      {paragraphs.map((line, i) => {
        // Bold: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
          }
          return <span key={j}>{part}</span>;
        });

        if (line.trim() === '') return <br key={i} />;

        // Bullet points
        if (line.trim().startsWith('•')) {
          return (
            <div key={i} className="flex items-start gap-2 ml-1 my-0.5">
              <span className="text-primary-500 mt-0.5 flex-shrink-0">•</span>
              <span>{rendered.slice(1)}</span>
            </div>
          );
        }

        return <p key={i} className="my-1">{rendered}</p>;
      })}
    </>
  );
}
