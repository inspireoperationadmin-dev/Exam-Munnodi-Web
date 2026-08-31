import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

const registrationDraftStorageKey = 'student_registration_draft';
const registrationLifetimeMs = 6 * 60 * 60 * 1000;
const resendCooldownMs = 60 * 1000;

export interface RegistrationDraft {
  email: string;
  fullName: string;
  phoneNumber: string | null;
  expiresAt: number;
  resendAvailableAt: number;
}

interface RegistrationContextValue {
  draft: RegistrationDraft | null;
  password: string;
  registrationTicket: string;
  beginRegistration: (
    details: Omit<RegistrationDraft, 'expiresAt' | 'resendAvailableAt'>,
    password: string,
  ) => void;
  markOtpSent: () => void;
  setPassword: (password: string) => void;
  setRegistrationTicket: (ticket: string) => void;
  clearRegistration: () => void;
}

const RegistrationContext = createContext<RegistrationContextValue | null>(null);

function storeDraft(draft: RegistrationDraft | null) {
  try {
    if (draft) {
      sessionStorage.setItem(registrationDraftStorageKey, JSON.stringify(draft));
    } else {
      sessionStorage.removeItem(registrationDraftStorageKey);
    }
  } catch {
    // Registration still works in memory when browser storage is unavailable.
  }
}

function readDraft(): RegistrationDraft | null {
  try {
    const raw = sessionStorage.getItem(registrationDraftStorageKey);
    if (!raw) return null;

    const draft = JSON.parse(raw) as RegistrationDraft;
    if (!draft.email || !draft.fullName || draft.expiresAt <= Date.now()) {
      storeDraft(null);
      return null;
    }

    return draft;
  } catch {
    storeDraft(null);
    return null;
  }
}

export function RegistrationProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [draft, setDraft] = useState<RegistrationDraft | null>(readDraft);
  const [password, setPassword] = useState('');
  const [registrationTicket, setRegistrationTicket] = useState('');

  useEffect(() => {
    if (location.pathname === '/register' || location.pathname === '/verify-email') return;

    storeDraft(null);
    setDraft(null);
    setPassword('');
    setRegistrationTicket('');
  }, [location.pathname]);

  const value = useMemo<RegistrationContextValue>(() => ({
    draft,
    password,
    registrationTicket,
    beginRegistration: (details, nextPassword) => {
      const now = Date.now();
      const nextDraft: RegistrationDraft = {
        ...details,
        expiresAt: now + registrationLifetimeMs,
        resendAvailableAt: now + resendCooldownMs,
      };

      storeDraft(nextDraft);
      setDraft(nextDraft);
      setPassword(nextPassword);
      setRegistrationTicket('');
    },
    markOtpSent: () => {
      setDraft((current) => {
        if (!current) return current;
        const next = { ...current, resendAvailableAt: Date.now() + resendCooldownMs };
        storeDraft(next);
        return next;
      });
    },
    setPassword,
    setRegistrationTicket,
    clearRegistration: () => {
      storeDraft(null);
      setDraft(null);
      setPassword('');
      setRegistrationTicket('');
    },
  }), [draft, password, registrationTicket]);

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) throw new Error('useRegistration must be used inside RegistrationProvider');
  return context;
}
