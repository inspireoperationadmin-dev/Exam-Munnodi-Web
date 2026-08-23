export type SubscriptionTier = 'Free' | 'Basic' | 'Pro';
export type SubscriptionBillingCycle = 'Free' | 'Monthly' | 'Annual';
export type ProgressAccessLevel = 'Overall' | 'Detailed' | 'Full';

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  tier: SubscriptionTier;
  billingCycle: SubscriptionBillingCycle;
  durationDays: number;
  basePriceLkr: number;
  discountPercentage: number;
  priceLkr: number;
  allowsPaperExamMode: boolean;
  freePastPaperCount: number | null;
  freeModelPaperCount: number | null;
  monthlyMockExamLimit: number | null;
  monthlyUnitExamLimit: number | null;
  progressAccessLevel: ProgressAccessLevel;
  isFree: boolean;
  isActive: boolean;
}

export interface SubscriptionStatus {
  hasActiveAccess: boolean;
  status: string;
  planCode: string | null;
  planName: string | null;
  tier: SubscriptionTier;
  billingCycle: SubscriptionBillingCycle;
  progressAccessLevel: ProgressAccessLevel;
  startsAt: string | null;
  endsAt: string | null;
  daysRemaining: number | null;
  shouldShowSevenDayReminder: boolean;
  shouldShowThreeDayReminder: boolean;
  shouldShowOneDayReminder: boolean;
  allowsPaperExamMode: boolean;
  freePastPaperCount: number | null;
  freeModelPaperCount: number | null;
  monthlyMockExamLimit: number | null;
  monthlyUnitExamLimit: number | null;
  mockExamsUsed: number;
  unitExamsUsed: number;
  upcomingSubscription: UpcomingSubscription | null;
}

export interface UpcomingSubscription {
  planCode: string;
  planName: string;
  tier: SubscriptionTier;
  billingCycle: SubscriptionBillingCycle;
  startsAt: string;
  endsAt: string;
}

export interface LaunchOfferStatus {
  isEnabled: boolean;
  isEligible: boolean;
  isClaimed: boolean;
  status: 'Eligible' | 'Claimed' | 'Disabled' | 'OutsideClaimWindow' | 'ProfileSetupRequired' | 'ActiveSubscription';
  promotionCode: string;
  durationDays: number;
  claimStartsAtUtc: string | null;
  claimEndsAtUtc: string | null;
  claimedAt: string | null;
  accessEndsAt: string | null;
}
