// ONUR Task Manager service worker.
// - App files (/_next/static, icons, fonts) are cached so the app opens fast.
// - Pages always come from the network; if offline, a small offline page is shown.
// - API calls and file downloads are never cached (they are private and must be fresh).
const VERSION = 'otm-v1';
const STATIC = VERSION + '-static';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', event => {
    event.waitUntil(caches.open(STATIC).then(cache => cache.addAll([OFFLINE_URL, '/icons/icon-192.png', '/onur-logo.png'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => !key.startsWith(VERSION)).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

    if (request.mode === 'navigate') {
        event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
        return;
    }
    const isStatic = url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || /\.(png|svg|woff2?|ico)$/.test(url.pathname);
    if (!isStatic) return;
    event.respondWith(caches.open(STATIC).then(async cache => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
    }));
});
