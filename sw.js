const CACHE_NAME = 'epb-pro-v1.1.6';
const STATIC_ASSETS = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap'
];

// 1. Install - Precache UI core
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// 2. Activate - Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
});

// 3. Fetch - Strategy Selection
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CRITICAL: Gemini API and other dynamic tools are NETWORK ONLY
  // Never cache POST requests or sensitive API endpoints
  if (url.origin.includes('generativelanguage.googleapis.com') || event.request.method !== 'GET') {
    return; // Let browser handle via network
  }

  // UI Frameworks/Assets - Stale While Revalidate
  if (url.origin.includes('esm.sh') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchedResponse = fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchedResponse;
        });
      })
    );
    return;
  }

  // Default - Network First
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});