import { useState } from 'react';
import { isFirebaseConfigured } from '@/services/firebase';
import { X, Info } from 'lucide-react';

/**
 * Banner notice displayed when Firebase is paused and the app is running
 * in local mock mode. Informs the user that data is stored in memory only.
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
            <strong>Local Mode</strong>{' '}
            <span className="text-amber-600 hidden sm:inline">
              — Firebase integration is paused. Data is stored in memory and will be lost on refresh.
              Set <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">USE_FIREBASE = true</code> in{' '}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">src/services/firebase.js</code> to reconnect Firebase.
            </span>
            <span className="text-amber-600 sm:hidden">
              — Firebase paused. Data stored locally.
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
