import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

export function SetupRoute({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth();

  if (auth && !auth.isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (auth && !auth.isProfileSetup) {
    return <Navigate to="/setup" replace />;
  }

  return children;
}
