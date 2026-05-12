// Service worker with network-first strategy for local files.
// This gives us control over caching instead of leaving it to iOS's
// aggressive opaque caching for home-screen web apps.

const CACHE_NAME = 'flashchords-v1';

// CDN dependencies — versioned by URL, safe to cache long-term
const CDN_DEPS = [
  'https://esm.sh/react@18.3.1?dev',
  'https://esm.sh/react-dom@18.3.1?dev',
  'https://esm.sh/react-dom@18.3.1/client?dev',
  'https://esm.sh/htm@3.1.1',
  'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&display=swap',
];

self.addEventListener('install', (event) => {
  // Activate immediately, don't wait for old tabs to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // CDN resources and fonts: cache-first (they're versioned by URL)
  if (url.origin !== self.location.origin) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Local resources: network-first (always get latest when online)
  event.respondWith(networkFirst(event.request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return new Response('Offline', { status: 503 });
  }
}
