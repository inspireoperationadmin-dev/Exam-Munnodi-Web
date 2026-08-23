import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getMySubscriptionStatus } from '../../services/subscriptionService';
import type { SubscriptionStatus } from '../../types/subscription';
import { useAuth } from '../auth/AuthContext';

interface SubscriptionContextValue {
  status: SubscriptionStatus | null;
  loading: boolean;
  updateNotice: string;
  dismissUpdateNotice: () => void;
  refresh: () => Promise<SubscriptionStatus | null>;
  recordUsage: (feature: 'mock' | 'unit') => void;
  setStatus: (status: SubscriptionStatus) => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(isAuthenticated);
  const [updateNotice, setUpdateNotice] = useState('');
  const statusRef = useRef<SubscriptionStatus | null>(null);
  const refreshingRef = useRef(false);

  const applyStatus = useCallback((nextStatus: SubscriptionStatus, announce: boolean) => {
    const previous = statusRef.current;

    if (announce && previous) {
      const previousUpcoming = previous.upcomingSubscription;
      const nextUpcoming = nextStatus.upcomingSubscription;
      const upcomingChanged = Boolean(nextUpcoming) && (
        !previousUpcoming
        || previousUpcoming.planCode !== nextUpcoming?.planCode
        || previousUpcoming.startsAt !== nextUpcoming?.startsAt
        || previousUpcoming.endsAt !== nextUpcoming?.endsAt
      );

      if (upcomingChanged && nextUpcoming) {
        setUpdateNotice(
          `${nextUpcoming.planName} has been scheduled and will start on ${formatDate(nextUpcoming.startsAt)}.`,
        );
      } else if (
        nextStatus.tier !== 'Free'
        && (previous.planCode !== nextStatus.planCode || previous.endsAt !== nextStatus.endsAt)
      ) {
        setUpdateNotice(
          `${nextStatus.planName || nextStatus.tier} is active until ${formatDate(nextStatus.endsAt)}.`,
        );
      }
    }

    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setStatus(null);
      setLoading(false);
      return null;
    }

    setLoading(true);
    try {
      const nextStatus = await getMySubscriptionStatus();
      applyStatus(nextStatus, true);
      return nextStatus;
    } finally {
      setLoading(false);
    }
  }, [applyStatus, isAuthenticated]);

  useEffect(() => {
    let active = true;

    if (!isAuthenticated) {
      statusRef.current = null;
      setStatus(null);
      setUpdateNotice('');
      setLoading(false);
      return;
    }

    setLoading(true);
    getMySubscriptionStatus()
      .then((nextStatus) => {
        if (active) applyStatus(nextStatus, false);
      })
      .catch(() => {
        if (active) setStatus(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applyStatus, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function refreshWhenActive() {
      if (document.visibilityState !== 'visible' || refreshingRef.current) return;

      refreshingRef.current = true;
      try {
        applyStatus(await getMySubscriptionStatus(), true);
      } catch {
        // Keep the last known access state; normal API handling will surface real access errors.
      } finally {
        refreshingRef.current = false;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') void refreshWhenActive();
    }

    window.addEventListener('focus', refreshWhenActive);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', refreshWhenActive);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [applyStatus, isAuthenticated]);

  const recordUsage = useCallback((feature: 'mock' | 'unit') => {
    setStatus((current) => {
      if (!current) return current;
      return feature === 'mock'
        ? { ...current, mockExamsUsed: current.mockExamsUsed + 1 }
        : { ...current, unitExamsUsed: current.unitExamsUsed + 1 };
    });
  }, []);

  const value = useMemo(
    () => ({
      status,
      loading,
      updateNotice,
      dismissUpdateNotice: () => setUpdateNotice(''),
      refresh,
      recordUsage,
      setStatus: (nextStatus: SubscriptionStatus) => applyStatus(nextStatus, false),
    }),
    [applyStatus, loading, recordUsage, refresh, status, updateNotice],
  );
  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

function formatDate(value: string | null) {
  if (!value) return 'the confirmed date';
  return new Intl.DateTimeFormat('en-LK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used inside SubscriptionProvider');
  return context;
}
