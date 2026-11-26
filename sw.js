var CACHE_NAME = 'kolisia-b-portal-v1';
var CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './js/config.js',
  './js/api.js',
  './js/public.js',
  './js/admin.js',
  './manifest.json',
  './assets/icon.svg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CORE_ASSETS);
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  if (event.request.url.indexOf('script.google.com') !== -1) return;
  event.respondWith(
    fetch(event.request).catch(function () {
      return caches.match(event.request);
    })
  );
});
