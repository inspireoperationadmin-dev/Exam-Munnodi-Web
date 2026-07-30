import { createContext, useContext, useMemo, useState } from 'react';
import type { AuthResponse } from '../../types/auth';

interface AuthContextValue {
  auth: AuthResponse | null;
  isAuthenticated: boolean;
  saveAuth: (auth: AuthResponse) => void;
  markProfileSetup: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): AuthResponse | null {
  const raw = localStorage.getItem('student_auth');
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthResponse;
    if (!parsed.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthResponse | null>(readStoredAuth);

  const value = useMemo<AuthContextValue>(() => {
    const saveAuth = (nextAuth: AuthResponse) => {
      localStorage.setItem('student_access_token', nextAuth.accessToken);
      localStorage.setItem('student_auth', JSON.stringify(nextAuth));
      setAuth(nextAuth);
    };

    const markProfileSetup = () => {
      setAuth((current) => {
        if (!current) return current;
        const next = { ...current, isProfileSetup: true };
        localStorage.setItem('student_auth', JSON.stringify(next));
        return next;
      });
    };

    const logout = () => {
      localStorage.removeItem('student_access_token');
      localStorage.removeItem('student_auth');
      setAuth(null);
    };

    return {
      auth,
      isAuthenticated: !!auth,
      saveAuth,
      markProfileSetup,
      logout,
    };
  }, [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
