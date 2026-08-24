import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Clock3, LockKeyhole, MessageCircle, Sparkles } from 'lucide-react';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button } from '../../components/ui/Button';
import { LoadingPanel, PageShell } from '../../components/ui/Layout';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  claimLaunchOffer,
  getLaunchOfferStatus,
  getSubscriptionPlans,
} from '../../services/subscriptionService';
import { theme } from '../../theme/theme';
import type {
  LaunchOfferStatus,
  SubscriptionBillingCycle,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../../types/subscription';
import { getErrorMessage } from '../../utils/errors';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { useAuth } from '../auth/AuthContext';
import { useSubscription } from './SubscriptionContext';
import { SubscriptionActivationSheet } from './SubscriptionActivationSheet';

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-LK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatMoney(value: number) {
  return `Rs. ${Math.round(value).toLocaleString('en-LK')}`;
}

function formatLimit(limit: number | null) {
  return limit === null ? 'Unlimited' : `${limit} per month`;
}

function supportMessage(planName: string, email?: string | null) {
  return [
    'Hi Exam Munnodi, I want to activate a subscription.',
    `Email: ${email || '-'}`,
    `Plan: ${planName}`,
    'I will send the bank receipt here.',
  ].join('\n');
}

function UsageMeter({ label, limit, used }: { label: string; limit: number | null; used: number }) {
  const percentage = limit === null ? 0 : Math.min(100, (used / Math.max(limit, 1)) * 100);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-bold text-[var(--sf-text-muted)]">{label}</span>
        <span className="font-black text-[var(--sf-text)]">
          {limit === null ? `${used} used` : `${used} of ${limit}`}
        </span>
      </div>
      {limit === null ? (
        <p className="mt-2 text-xs font-black text-[var(--sf-success-text)]">Unlimited</p>
      ) : (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--sf-progress-track)]">
          <div className="h-full rounded-full bg-[var(--sf-primary)]" style={{ width: `${percentage}%` }} />
        </div>
      )}
    </div>
  );
}

function CurrentAccess({ status }: { status: SubscriptionStatus }) {
  const cycle = status.billingCycle || (status.tier === 'Free' ? 'Free' : null);

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] shadow-[var(--sf-shadow-md)]">
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-[var(--sf-brand)]">Current access</p>
          <h2 className="mt-1 break-words text-2xl font-black text-[var(--sf-text)]">{status.planName || status.tier}</h2>
          <p className="mt-1 text-sm font-bold text-[var(--sf-text-muted)]">
            {cycle === 'Free' ? 'Free plan' : cycle ? `${cycle} billing` : 'Paid access'}
          </p>
        </div>
        <span className={status.tier === 'Free' ? theme.badge.neutral : theme.badge.dark}>
          {status.status}
        </span>
      </div>

      <dl className="grid grid-cols-2 border-y border-[var(--sf-border)] bg-[var(--sf-surface-muted)]">
        <div className="border-r border-[var(--sf-border)] p-4">
          <dt className="text-xs font-bold text-[var(--sf-text-muted)]">Access remaining</dt>
          <dd className="mt-1 text-base font-black text-[var(--sf-text)]">
            {status.daysRemaining === null ? 'Free forever' : `${status.daysRemaining} days`}
          </dd>
        </div>
        <div className="p-4">
          <dt className="text-xs font-bold text-[var(--sf-text-muted)]">Ends on</dt>
          <dd className="mt-1 text-base font-black text-[var(--sf-text)]">{formatDate(status.endsAt)}</dd>
        </div>
      </dl>

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
        <UsageMeter label="Mock exams this month" limit={status.monthlyMockExamLimit} used={status.mockExamsUsed} />
        <UsageMeter label="Unit exams this month" limit={status.monthlyUnitExamLimit} used={status.unitExamsUsed} />
      </div>
    </section>
  );
}

function UpcomingAccess({ status }: { status: SubscriptionStatus }) {
  const upcoming = status.upcomingSubscription;
  if (!upcoming) return null;

  return (
    <section className="rounded-xl border border-[var(--sf-selected-border)] bg-[var(--sf-selected-soft)] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--sf-surface)] text-[var(--sf-brand)] shadow-[var(--sf-shadow-sm)]">
          <Clock3 aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-[var(--sf-brand)]">Next scheduled plan</p>
          <h2 className="mt-1 break-words text-lg font-black text-[var(--sf-text)]">{upcoming.planName}</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">
            {upcoming.billingCycle} · {formatDate(upcoming.startsAt)} to {formatDate(upcoming.endsAt)}
          </p>
          <p className="mt-2 text-xs font-bold text-[var(--sf-text-soft)]">
            It will begin automatically after the current access period.
          </p>
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  currentPlanCode,
  plan,
  onSelect,
  upcomingPlanCode,
}: {
  currentPlanCode?: string | null;
  onSelect: (plan: SubscriptionPlan) => void;
  plan: SubscriptionPlan;
  upcomingPlanCode?: string | null;
}) {
  const annual = plan.billingCycle === 'Annual';
  const isCurrent = currentPlanCode === plan.code;
  const isUpcoming = upcomingPlanCode === plan.code;
  const progressLabel = plan.progressAccessLevel === 'Full'
    ? 'Full progress and recent exam scores'
    : 'Topic mastery and improvement guidance';
  const benefits = [
    'All public past and model papers',
    plan.allowsPaperExamMode ? 'Paper practice and timed exam mode' : 'Paper practice',
    `${formatLimit(plan.monthlyMockExamLimit)} mock exams`,
    `${formatLimit(plan.monthlyUnitExamLimit)} unit exams`,
    progressLabel,
  ];
  const actionLabel = isUpcoming
    ? 'Add another period'
    : isCurrent
      ? 'Renew this plan'
      : `Choose ${plan.name}`;

  return (
    <article className={`grid min-h-full content-between gap-5 ${theme.card.static} ${isCurrent ? 'border-[var(--sf-selected-border)]' : ''}`}>
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={theme.text.eyebrow}>{plan.tier}</p>
            <h3 className="mt-1 break-words text-xl font-black text-[var(--sf-text)]">{plan.name}</h3>
          </div>
          {(isCurrent || isUpcoming) && (
            <span className={isCurrent ? theme.badge.dark : theme.badge.neutral}>
              {isCurrent ? 'Current' : 'Scheduled'}
            </span>
          )}
        </div>

        <div className="mt-5">
          <p className="text-3xl font-black text-[var(--sf-text)]">
            {formatMoney(plan.priceLkr)}
            <span className="ml-1 text-sm font-bold text-[var(--sf-text-muted)]">
              / {annual ? 'year' : 'month'}
            </span>
          </p>
          <p className="mt-1 text-xs font-bold text-[var(--sf-text-muted)]">
            {annual
              ? `${formatMoney(plan.priceLkr / 12)} monthly equivalent · paid once`
              : 'Paid monthly'}
          </p>
          {plan.discountPercentage > 0 && (
            <p className="mt-2 text-xs font-black text-[var(--sf-success-text)]">
              <span className="mr-2 text-[var(--sf-text-muted)] line-through">{formatMoney(plan.basePriceLkr)}</span>
              {plan.discountPercentage}% discount
            </p>
          )}
        </div>

        <ul className="mt-5 grid gap-3">
          {benefits.map((benefit) => (
            <li className="grid grid-cols-[20px_minmax(0,1fr)] gap-2 text-sm font-semibold leading-5 text-[var(--sf-text-soft)]" key={benefit}>
              <Check aria-hidden="true" className="mt-0.5 h-4 w-4 text-[var(--sf-success-text)]" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        className={`${theme.button.base} ${theme.button.sizes.lg} ${plan.tier === 'Pro' ? theme.button.variants.primary : theme.button.variants.secondary} w-full gap-2`}
        onClick={() => onSelect(plan)}
        type="button"
      >
        <MessageCircle aria-hidden="true" className="h-4 w-4" />
        {actionLabel}
      </button>
    </article>
  );
}

function FreePlanCard({ current, plan }: { current: boolean; plan: SubscriptionPlan }) {
  const included = [
    `${plan.freePastPaperCount ?? 0} oldest past papers per subject`,
    `${plan.freeModelPaperCount ?? 0} oldest model papers per subject`,
    'Practice mode for included papers',
    `${formatLimit(plan.monthlyMockExamLimit)} mock exams`,
    `${formatLimit(plan.monthlyUnitExamLimit)} unit exams`,
    'Overall subject mastery',
  ];
  const upgradeFeatures = [
    'Timed paper exam mode',
    'Topic guidance and recent exam scores',
  ];

  return (
    <article className={`grid min-h-full content-between gap-5 ${theme.card.static} ${current ? 'border-[var(--sf-selected-border)]' : ''}`}>
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={theme.text.eyebrow}>Free</p>
            <h3 className="mt-1 text-xl font-black text-[var(--sf-text)]">Free forever</h3>
          </div>
          {current && <span className={theme.badge.dark}>Current</span>}
        </div>

        <div className="mt-5">
          <p className="text-3xl font-black text-[var(--sf-text)]">
            Rs. 0
            <span className="ml-1 text-sm font-bold text-[var(--sf-text-muted)]">/ forever</span>
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">
            The oldest published papers stay available in every selected subject.
          </p>
        </div>

        <ul className="mt-5 grid gap-3">
          {included.map((benefit) => (
            <li className="grid grid-cols-[20px_minmax(0,1fr)] gap-2 text-sm font-semibold leading-5 text-[var(--sf-text-soft)]" key={benefit}>
              <Check aria-hidden="true" className="mt-0.5 h-4 w-4 text-[var(--sf-success-text)]" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t border-[var(--sf-border)] pt-4">
          <p className="text-xs font-black uppercase text-[var(--sf-text-muted)]">Upgrade to unlock</p>
          <ul className="mt-3 grid gap-2">
            {upgradeFeatures.map((feature) => (
              <li className="grid grid-cols-[20px_minmax(0,1fr)] gap-2 text-sm font-semibold leading-5 text-[var(--sf-text-muted)]" key={feature}>
                <LockKeyhole aria-hidden="true" className="mt-0.5 h-4 w-4" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        className={`${theme.button.base} ${theme.button.sizes.lg} ${theme.button.variants.secondary} w-full gap-2`}
        disabled
        type="button"
      >
        <Check aria-hidden="true" className="h-4 w-4" />
        Included forever
      </button>
    </article>
  );
}

export function SubscriptionPage() {
  const { t } = useLanguage();
  const { auth } = useAuth();
  const { loading: statusLoading, setStatus, status } = useSubscription();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [offer, setOffer] = useState<LaunchOfferStatus | null>(null);
  const [billingCycle, setBillingCycle] = useState<SubscriptionBillingCycle>('Monthly');
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [activationSheetOpen, setActivationSheetOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([getSubscriptionPlans(), getLaunchOfferStatus()])
      .then(([planItems, launchOffer]) => {
        if (!active) return;
        setPlans(planItems.filter((plan) => plan.isActive));
        setOffer(launchOffer);
      })
      .catch((loadError) => {
        if (active) setError(getErrorMessage(loadError, t('subscriptionLoadError')));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [t]);

  const visiblePaidPlans = useMemo(
    () => plans.filter((plan) => !plan.isFree && plan.billingCycle === billingCycle),
    [billingCycle, plans],
  );
  const freePlan = useMemo(
    () => plans.find((plan) => plan.isFree) || null,
    [plans],
  );

  async function claimOffer() {
    if (!offer?.isEligible || claiming) return;

    setClaiming(true);
    setError('');
    setSuccess('');

    try {
      const nextStatus = await claimLaunchOffer();
      setStatus(nextStatus);
      const nextOffer = await getLaunchOfferStatus();
      setOffer(nextOffer);
      setSuccess('Your free Basic month is active now.');
    } catch (claimError) {
      setError(getErrorMessage(claimError, 'Could not claim the free month. Please try again.'));
    } finally {
      setClaiming(false);
    }
  }

  const pageLoading = loading || statusLoading;

  return (
    <PageShell maxWidth="xl">
      <header className="py-1">
        <h1 className="text-2xl font-black leading-tight text-[var(--sf-text)] sm:text-3xl">{t('subscription')}</h1>
      </header>

      {error && <AlertMessage>{error}</AlertMessage>}
      {success && (
        <p className="rounded-lg border border-[var(--sf-border)] bg-[var(--sf-success-soft)] px-4 py-3 text-sm font-black text-[var(--sf-success-text)]" role="status">
          {success}
        </p>
      )}

      {pageLoading ? (
        <LoadingPanel label={t('loading')} />
      ) : (
        <>
          {offer?.isEligible && (
            <section className="overflow-hidden rounded-xl border border-[var(--sf-selected-border)] bg-[var(--sf-selected-soft)] p-4 shadow-[var(--sf-shadow-md)] sm:p-5">
              <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-black uppercase text-[var(--sf-brand)]">
                    <Sparkles aria-hidden="true" className="h-4 w-4" />
                    One-time launch offer
                  </p>
                  <h2 className="mt-2 text-2xl font-black leading-tight text-[var(--sf-text)]">Claim 30 days of Basic free</h2>
                  <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">
                    No payment is required. This offer can be claimed only once for this account.
                  </p>
                </div>
                <Button disabled={claiming} onClick={() => void claimOffer()} size="lg" type="button">
                  {claiming ? 'Activating...' : 'Claim free month'}
                </Button>
              </div>
            </section>
          )}

          {offer?.isClaimed && status?.tier === 'Free' && (
            <p className="rounded-lg border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-3 text-sm font-semibold text-[var(--sf-text-muted)]">
              Your one-time launch offer ended on {formatDate(offer.accessEndsAt)}. Your account is now on Free.
            </p>
          )}

          {status && <CurrentAccess status={status} />}
          {status && <UpcomingAccess status={status} />}

          <section aria-labelledby="paid-plans-title">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-[var(--sf-brand)]">Plans</p>
                <h2 className="mt-1 text-2xl font-black text-[var(--sf-text)]" id="paid-plans-title">Choose or renew access</h2>
              </div>
              <div aria-label="Billing cycle" className="grid min-h-11 grid-cols-2 rounded-lg border border-[var(--sf-border-strong)] bg-[var(--sf-surface)] p-1" role="group">
                {(['Monthly', 'Annual'] as const).map((cycle) => (
                  <button
                    aria-pressed={billingCycle === cycle}
                    className={`min-h-10 rounded-md px-4 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-[var(--sf-focus)] ${billingCycle === cycle ? 'bg-[var(--sf-primary)] text-[var(--sf-primary-text)]' : 'text-[var(--sf-text-muted)] hover:bg-[var(--sf-surface-muted)]'}`}
                    key={cycle}
                    onClick={() => setBillingCycle(cycle)}
                    type="button"
                  >
                    {cycle}
                  </button>
                ))}
              </div>
            </div>

            {(freePlan || visiblePaidPlans.length) ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {freePlan && <FreePlanCard current={status?.tier === 'Free'} plan={freePlan} />}
                {visiblePaidPlans.map((plan) => (
                  <PlanCard
                    currentPlanCode={status?.planCode}
                    key={plan.id}
                    onSelect={(nextPlan) => {
                      setSelectedPlan(nextPlan);
                      setActivationSheetOpen(true);
                    }}
                    plan={plan}
                    upcomingPlanCode={status?.upcomingSubscription?.planCode}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 text-sm font-bold text-[var(--sf-text-muted)]">
                {t('noPlansText')}
              </p>
            )}
            {freePlan && !visiblePaidPlans.length && (
              <p className="mt-4 rounded-xl border border-dashed border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 text-sm font-bold text-[var(--sf-text-muted)]">
                {t('noPlansText')}
              </p>
            )}
          </section>

          <section className="flex items-start gap-3 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-muted)] p-4">
            <CalendarDays aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--sf-brand)]" />
            <p className="text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">
              Paid access is activated manually after the Exam Munnodi admin team verifies your receipt. A renewal is queued after your current period; it does not replace active access.
            </p>
          </section>

          <SubscriptionActivationSheet
            onClose={() => setActivationSheetOpen(false)}
            open={activationSheetOpen}
            plan={selectedPlan}
            whatsappUrl={selectedPlan
              ? buildWhatsAppUrl(supportMessage(`${selectedPlan.name} (${selectedPlan.billingCycle})`, auth?.email))
              : ''}
          />
        </>
      )}
    </PageShell>
  );
}
