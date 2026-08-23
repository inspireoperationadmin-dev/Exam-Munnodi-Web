import { apiRequest } from './api';
import type { LaunchOfferStatus, SubscriptionPlan, SubscriptionStatus } from '../types/subscription';

export function getSubscriptionPlans() {
  return apiRequest<SubscriptionPlan[]>('/subscriptions/plans', { auth: false });
}

export function getMySubscriptionStatus() {
  return apiRequest<SubscriptionStatus>('/subscriptions/me');
}

export function getLaunchOfferStatus() {
  return apiRequest<LaunchOfferStatus>('/subscriptions/launch-offer');
}

export function claimLaunchOffer() {
  return apiRequest<SubscriptionStatus>('/subscriptions/launch-offer/claim', {
    method: 'POST',
  });
}
