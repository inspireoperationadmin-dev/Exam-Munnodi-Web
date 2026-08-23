/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

const cacheName = 'exam-munnodi-precache-v2';
const precacheManifest = self.__WB_MANIFEST;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll(precacheManifest.map((entry) => entry.url))),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const requestUrl = new URL(event.request.url);
        const canCache = response.ok
          && requestUrl.origin === self.location.origin
          && !requestUrl.pathname.startsWith('/api/')
          && !requestUrl.pathname.endsWith('/sw.js')
          && !requestUrl.pathname.endsWith('/dev-sw.js');

        if (canCache) {
          const copy = response.clone();
          event.waitUntil(caches.open(cacheName).then((cache) => cache.put(event.request, copy)));
        }

        return response;
      })
      .catch(async () => (await caches.match(event.request)) || Response.error()),
  );
});

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Exam Munnodi',
    body: 'You have a new study update.',
    url: '/',
  };

  try {
    payload = {
      ...payload,
      ...(event.data?.json() as Partial<typeof payload> | undefined),
    };
  } catch {
    const text = event.data?.text();
    if (text) payload.body = text;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/EM_Logo.png',
      badge: '/EM_Logo.png',
      data: { url: payload.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url === url);
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});
