import { apiRequest } from './api';

const dismissedAtKey = 'student_notification_prompt_dismissed_at';
const enabledAtKey = 'student_notification_enabled_at';
const currentWebDeviceIdKey = 'student_notification_current_web_device_id';
const promptCooldownMs = 7 * 24 * 60 * 60 * 1000;

interface VapidPublicKeyResponse {
  isConfigured: boolean;
  publicKey: string | null;
}

interface BrowserPushSubscriptionJson {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
}

export interface NotificationDeviceDto {
  id: string;
  platform: 'WebPwa' | 'Android' | 'Ios';
  provider: 'WebPush' | 'Fcm' | 'Apns';
  isActive: boolean;
  lastSeenAt: string;
  endpointHash?: string | null;
  pushTokenHash?: string | null;
  deviceName?: string | null;
}

export interface NotificationPreference {
  studyRemindersEnabled: boolean;
  dailyReminderTime: string;
  timeZoneId: string;
}

export function getNotificationSupportStatus() {
  if (!('Notification' in window)) return 'unsupported';
  if (!('serviceWorker' in navigator)) return 'unsupported';
  if (!('PushManager' in window)) return 'unsupported';
  return Notification.permission;
}

export function shouldShowNotificationPrompt(pathname: string, isAuthenticated: boolean, isReady: boolean) {
  if (!isAuthenticated || !isReady) return false;
  if (['/login', '/register', '/verify-email', '/setup', '/exam'].includes(pathname)) return false;

  const status = getNotificationSupportStatus();
  if (status === 'unsupported' || status === 'granted' || status === 'denied') return false;

  const dismissedAt = Number(localStorage.getItem(dismissedAtKey) || 0);
  return !dismissedAt || Date.now() - dismissedAt >= promptCooldownMs;
}

export function dismissNotificationPromptForAWeek() {
  localStorage.setItem(dismissedAtKey, String(Date.now()));
}

export function getNotificationControlState() {
  const status = getNotificationSupportStatus();

  return {
    status,
    enabled: status === 'granted',
    blocked: status === 'denied',
    supported: status !== 'unsupported',
  };
}

export async function getNotificationSettingsState() {
  const base = getNotificationControlState();

  if (!base.supported || base.blocked || base.status !== 'granted') {
    return {
      ...base,
      enabled: false,
      deviceId: null as string | null,
    };
  }

  const subscription = await getExistingPushSubscription();
  const endpointHash = subscription ? await hashText(subscription.endpoint) : null;
  const storedDeviceId = localStorage.getItem(currentWebDeviceIdKey);
  const devices = await apiRequest<NotificationDeviceDto[]>('/notifications/devices/me');

  const currentDevice = devices.find((device) =>
    device.isActive
    && device.platform === 'WebPwa'
    && device.provider === 'WebPush'
    && (
      (!!endpointHash && device.endpointHash === endpointHash)
      || (!!storedDeviceId && device.id === storedDeviceId)
    ));

  if (currentDevice) {
    localStorage.setItem(currentWebDeviceIdKey, currentDevice.id);
  }

  return {
    ...base,
    enabled: !!currentDevice,
    deviceId: currentDevice?.id || null,
  };
}

export async function enableStudyNotifications() {
  const status = getNotificationSupportStatus();
  if (status === 'unsupported') {
    throw new Error('Notifications are not supported on this browser.');
  }

  const vapid = await apiRequest<VapidPublicKeyResponse>('/notifications/vapid-public-key', { auth: false });
  if (!vapid.isConfigured || !vapid.publicKey) {
    throw new Error('Notifications are not configured yet.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    dismissNotificationPromptForAWeek();
    throw new Error('Notification permission was not enabled.');
  }

  const registration = await getOrRegisterServiceWorker();

  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription = existingSubscription || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
  });

  const subscriptionJson = subscription.toJSON() as BrowserPushSubscriptionJson;
  const endpoint = subscriptionJson.endpoint || subscription.endpoint;
  const p256dh = subscriptionJson.keys?.p256dh;
  const auth = subscriptionJson.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    throw new Error('Could not read browser notification subscription.');
  }

  const device = await apiRequest<NotificationDeviceDto>('/notifications/devices', {
    method: 'POST',
    body: JSON.stringify({
      platform: 'WebPwa',
      provider: 'WebPush',
      endpoint,
      p256dh,
      auth,
      deviceName: getDeviceName(),
      userAgent: navigator.userAgent,
      appVersion: import.meta.env.VITE_APP_VERSION || 'local',
    }),
  });

  localStorage.setItem(currentWebDeviceIdKey, device.id);
  localStorage.setItem(enabledAtKey, String(Date.now()));
  return device;
}

export async function disableStudyNotifications() {
  const settings = await getNotificationSettingsState();

  if (settings.deviceId) {
    await apiRequest(`/notifications/devices/${settings.deviceId}`, {
      method: 'DELETE',
    });
  }

  const subscription = await getExistingPushSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }

  localStorage.removeItem(currentWebDeviceIdKey);
  localStorage.removeItem(enabledAtKey);
}

export function getNotificationPreferences() {
  return apiRequest<NotificationPreference>('/notifications/preferences');
}

export function updateNotificationPreferences(payload: NotificationPreference) {
  return apiRequest<NotificationPreference>('/notifications/preferences', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

function getDeviceName() {
  const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform
    || navigator.platform
    || 'Browser';
  return `${platform} web`;
}

function getServiceWorkerUrl() {
  return import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';
}

async function getOrRegisterServiceWorker() {
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;

  const registration = await navigator.serviceWorker.register(getServiceWorkerUrl(), {
    scope: '/',
    type: import.meta.env.DEV ? 'module' : 'classic',
  });

  await navigator.serviceWorker.ready;
  return registration;
}

async function getExistingPushSubscription() {
  const registration = await navigator.serviceWorker.getRegistration('/');
  return registration?.pushManager.getSubscription() || null;
}

async function hashText(value: string) {
  const bytes = new TextEncoder().encode(value.trim());
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);

  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }

  return output;
}
