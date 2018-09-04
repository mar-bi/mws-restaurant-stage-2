// Testting SW on localhost
const APP_PREFIX = 'rest-rev-app';
const staticCacheVersion = 'v5';
const mapsCacheVersion = 'v5';
const imgCahcheVersion = 'v5';
const staticCacheName = `${APP_PREFIX}-static-${staticCacheVersion}`;
const contentMapCache = `${APP_PREFIX}-maps-${mapsCacheVersion}`;
const contentImagesCache = `${APP_PREFIX}-imgs-${imgCahcheVersion}`;
const allCaches = [staticCacheName, contentMapCache, contentImagesCache];

//const REPO_PREFIX = '/mws-restaurant-stage-1/';
const URLS = [
  '/',
  'restaurant.html',
  'js/main.js',
  'js/dbHelper.js',
  'js/restaurantInfo.js',
  'css/styles.css',
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js'
];

/**
 * Cache static assets(html, css, js)
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      return cache.addAll(URLS);
    })
  );
});

/**
 * Delete old caches
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            return (
              cacheName.startsWith(APP_PREFIX) &&
              !allCaches.includes(cacheName)
            );
          })
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

/**
 * Cache maps and images
 */
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  console.log(requestUrl);

  //cache map tiles and markers
  if (requestUrl.origin.startsWith('https://api.tiles.mapbox.com') ||
		requestUrl.pathname.startsWith('/leaflet@1.3.1/dist/images/')) {
    event.respondWith(serveImgAssets(contentMapCache, event.request));
    return;
  }

  //cache images
  if (requestUrl.pathname.startsWith('/images/')) {
    event.respondWith(serveImgAssets(contentImagesCache, event.request));
    return;
  }

  //serve a restaurant page
  if(requestUrl.pathname === '/restaurant.html') {
    console.log('heading to restaurant page');
    event.respondWith(caches.match('restaurant.html'));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});


function serveImgAssets(cacheName, eventRequest){
  return caches.open(cacheName).then(function(cache) {
    return cache.match(eventRequest).then(function(response) {
      return response || fetch(eventRequest).then(function(response) {
        cache.put(eventRequest, response.clone());
        return response;
      });
    });
  });
}