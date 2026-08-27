import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { LoadingPage } from '@/components/common/LoadingSpinner';

export function ProtectedRoute() {
  const { user, userData, loading, refreshUserData } = useAuthStore();
  const location = useLocation();
  const lastRefreshedPath = useRef(null);

  // Safety net: re-fetch userData from the backend when entering a
  // protected route to guard against stale store state (e.g. after
  // onboarding completion or page refresh in demo mode).
  useEffect(() => {
    if (user && lastRefreshedPath.current !== location.pathname) {
      lastRefreshedPath.current = location.pathname;
      refreshUserData();
    }
  }, [user, location.pathname, refreshUserData]);

  if (loading) {
    return <LoadingPage message="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if not completed
  if (userData && !userData.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
