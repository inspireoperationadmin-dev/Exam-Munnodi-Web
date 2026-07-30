import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { FloatingFeedbackButton } from './components/layout/FloatingFeedbackButton';
import { NotificationPrompt } from './components/layout/NotificationPrompt';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import { SetupRoute } from './components/routing/SetupRoute';
import { AppSplash } from './components/ui/AppSplash';
import { LandingPage } from './features/landing/LandingPage';
import { PapersPage } from './features/papers/PapersPage';
import { PaperPreviewPage } from './features/papers/PaperPreviewPage';
import { ExamScreenPage } from './features/exam/ExamScreenPage';
import { ExamResultPage } from './features/exam/ExamResultPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { ProgressPage } from './features/progress/ProgressPage';
import { SubjectHubPage } from './features/subjects/SubjectHubPage';
import { TopicListPage } from './features/topics/TopicListPage';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { VerifyEmailPage } from './features/auth/VerifyEmailPage';
import { ProfileSetupPage } from './features/setup/ProfileSetupPage';
import { useLanguage } from './i18n/LanguageContext';

function App() {
  const { t } = useLanguage();
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  if (booting) {
    return <AppSplash label={t('brandName')} />;
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<LandingPage />}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/verify-email"
          element={(
            <ProtectedRoute>
              <VerifyEmailPage />
            </ProtectedRoute>
          )}
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
          path="/subject"
          element={(
            <ProtectedRoute>
              <SetupRoute>
                <SubjectHubPage />
              </SetupRoute>
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
          path="/paper-preview"
          element={(
            <ProtectedRoute>
              <SetupRoute>
                <PaperPreviewPage />
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
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <FloatingFeedbackButton />
      <NotificationPrompt />
    </>
  );
}

export default App;
