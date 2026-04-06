const CACHE_NAME = 'notes-cache-v3';
const ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/icons/favicon-64x64.png',
    '/icons/favicon-128x128.png',
    '/icons/favicon-256x256.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

self.addEventListener('push', (event) => {
    let data = { title: 'Новое уведомление', body: '' };
    if (event.data) {
        data = event.data.json();
    }
    const options = {
        body: data.body,
        icon: '/icons/favicon-128x128.png',
        badge: '/icons/favicon-64x64.png'
    };
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});