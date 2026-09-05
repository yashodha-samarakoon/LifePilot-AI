import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useUserStore } from '@/stores/user.store';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ConfigNotice } from '@/components/common/ConfigNotice';
import { PageLayout } from '@/components/layout/PageLayout';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignupPage } from '@/features/auth/SignupPage';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ChatPage } from '@/features/chat/ChatPage';
import { JourneyPage } from '@/features/journey/JourneyPage';
import { GoalsPage } from '@/features/goals/GoalsPage';
import { DecisionLabPage } from '@/features/decision-simulator/DecisionLabPage';
import { InsightsPage } from '@/features/insights/InsightsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

function App() {
  const { initAuth, user, userData, loading } = useAuthStore();
  const { profile } = useUserStore();

  useEffect(() => {
    const unsubscribe = initAuth();
    return () => unsubscribe();
  }, []);

  return (
    <ErrorBoundary>
      <ConfigNotice />
      <BrowserRouter>
        <Routes>
          {/* Public routes — redirect logged-in users away */}
          <Route
            path="/login"
            element={
              !loading && user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginPage />
              )
            }
          />
          <Route
            path="/signup"
            element={
              !loading && user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <SignupPage />
              )
            }
          />

          {/* Onboarding: auth required, redirect to dashboard if already completed */}
          <Route
            path="/onboarding"
            element={
              !user ? (
                <Navigate to="/login" replace />
              ) : userData?.onboardingComplete || profile?.onboardingComplete ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <OnboardingPage />
              )
            }
          />

          {/* Protected routes with sidebar layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<PageLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/journey" element={<JourneyPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/decisions" element={<DecisionLabPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route
            path="*"
            element={
              loading ? null : user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
