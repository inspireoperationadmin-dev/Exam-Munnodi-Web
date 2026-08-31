import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { FloatingFeedbackButton } from './components/layout/FloatingFeedbackButton';
import { NotificationPrompt } from './components/layout/NotificationPrompt';
import { StudentNavigation } from './components/layout/StudentNavigation';
import { SubscriptionAccessDialog } from './components/layout/SubscriptionAccessDialog';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import { ScrollToTop } from './components/routing/ScrollToTop';
import { SetupRoute } from './components/routing/SetupRoute';
import { AppSplash } from './components/ui/AppSplash';
import { LandingPage } from './features/landing/LandingPage';
import { PapersPage } from './features/papers/PapersPage';
import { ExamScreenPage } from './features/exam/ExamScreenPage';
import { ExamResultPage } from './features/exam/ExamResultPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { ProgressPage } from './features/progress/ProgressPage';
import { ResumeSessionsPage } from './features/resume/ResumeSessionsPage';
import { SubscriptionPage } from './features/subscription/SubscriptionPage';
import { SubscriptionUpdateNotice } from './features/subscription/SubscriptionUpdateNotice';
import { TopicListPage } from './features/topics/TopicListPage';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { VerifyEmailPage } from './features/auth/VerifyEmailPage';
import { ProfileSetupPage } from './features/setup/ProfileSetupPage';
import { useLanguage } from './i18n/LanguageContext';
import { useAuth } from './features/auth/AuthContext';

function App() {
  const { t } = useLanguage();
  const { auth, isAuthenticated } = useAuth();
  const location = useLocation();
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  if (booting) {
    return <AppSplash label={t('brandName')} />;
  }

  const navigationHiddenRoutes = ['/exam', '/exam-result'];
  const navigationVisible = Boolean(
    isAuthenticated
    && auth?.isEmailVerified
    && auth.isProfileSetup
    && !navigationHiddenRoutes.includes(location.pathname),
  );

  return (
    <>
      <ScrollToTop />
      {isAuthenticated && <SubscriptionUpdateNotice />}
      <div className={navigationVisible ? 'min-h-screen min-h-dvh pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-60' : undefined}>
        <Routes>
        <Route
          path="/"
          element={<LandingPage />}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/verify-email"
          element={<VerifyEmailPage />}
        />
        <Route
          path="/setup"
          element={(
            <ProtectedRoute>
              <ProfileSetupPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/papers"
          element={(
            <ProtectedRoute>
              <SetupRoute>
                <PapersPage />
              </SetupRoute>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/exam"
          element={(
            <ProtectedRoute>
              <SetupRoute>
                <ExamScreenPage />
              </SetupRoute>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/exam-result"
          element={(
            <ProtectedRoute>
              <SetupRoute>
                <ExamResultPage />
              </SetupRoute>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/profile"
          element={(
            <ProtectedRoute>
              <SetupRoute>
                <ProfilePage />
              </SetupRoute>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/topics"
          element={(
            <ProtectedRoute>
              <SetupRoute>
                <TopicListPage />
              </SetupRoute>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/progress"
          element={(
            <ProtectedRoute>
              <SetupRoute>
                <ProgressPage />
              </SetupRoute>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/resume-sessions"
          element={(
            <ProtectedRoute>
              <SetupRoute>
                <ResumeSessionsPage />
              </SetupRoute>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/subscription"
          element={(
            <ProtectedRoute>
              <SetupRoute>
                <SubscriptionPage />
              </SetupRoute>
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <StudentNavigation visible={navigationVisible} />
      {navigationVisible && <FloatingFeedbackButton />}
      <NotificationPrompt navigationVisible={navigationVisible} />
      <SubscriptionAccessDialog />
    </>
  );
}

export default App;
