// Minimal no-op service worker: exists only to satisfy PWA installability
// criteria (some browsers require a fetch handler to offer "Add to Home
// Screen"). It doesn't cache anything, so it never serves stale content.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
