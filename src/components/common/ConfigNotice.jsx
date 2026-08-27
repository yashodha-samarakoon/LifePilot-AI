import { useState } from 'react';
import { isFirebaseConfigured } from '@/services/firebase';
import { AlertTriangle, X, Info } from 'lucide-react';

/**
 * Banner notice displayed when Firebase is not configured.
 * Shows at the top of the app to inform the user they are in demo mode.
 */
export function ConfigNotice() {
  const [dismissed, setDismissed] = useState(false);

  if (isFirebaseConfigured || dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 relative">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-sm">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-amber-800">
            <strong>Demo Mode</strong>{' '}
            <span className="text-amber-600 hidden sm:inline">
              — Firebase is not configured. Data is stored in memory and will be lost on refresh.
              Create a <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">.env</code> file to connect Firebase.
            </span>
            <span className="text-amber-600 sm:hidden">
              — Running with mock data. Configure Firebase for persistence.
            </span>
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md text-amber-500 hover:text-amber-700 hover:bg-amber-100 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
