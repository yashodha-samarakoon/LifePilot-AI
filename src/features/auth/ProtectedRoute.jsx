import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useUserStore } from '@/stores/user.store';
import { LoadingPage } from '@/components/common/LoadingSpinner';

export function ProtectedRoute() {
  const { user, userData, loading: authLoading, refreshUserData } = useAuthStore();
  const { profile, fetchProfile } = useUserStore();
  const location = useLocation();
  const lastRefreshedPath = useRef(null);
  const [checked, setChecked] = useState(false);

  // On mount / route change, refresh both the user document and the profile
  // before deciding whether onboarding is complete. This prevents a race
  // where a stale userData overwrites a freshly-completed onboarding state.
  useEffect(() => {
    if (!user || lastRefreshedPath.current === location.pathname) return;
    lastRefreshedPath.current = location.pathname;
    setChecked(false);

    Promise.all([
      refreshUserData(),
      fetchProfile(user.uid),
    ]).finally(() => setChecked(true));
  }, [user, location.pathname, refreshUserData, fetchProfile]);

  if (authLoading || !checked) {
    return <LoadingPage message="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if not completed in either userData or profile
  const onboardingComplete = userData?.onboardingComplete || profile?.onboardingComplete;
  if (!onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
