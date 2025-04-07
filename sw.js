const CACHE_NAME = 'dacapo-cache-v1'; // Changez si vous modifiez les fichiers en cache
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/auth.js',
  '/app_logic.js',
  '/manifest.json',
  '/assets/icons/icon-192x192.png', // Assurez-vous que les chemins sont corrects
  '/assets/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=Montserrat:wght@600;700&display=swap', // Cache des polices
  'https://fonts.gstatic.com/s/montserrat/v26/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2', // Exemple de fichier de police réel (à vérifier/adapter)
  'https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD-_A.woff2' // Exemple (à vérifier/adapter)
  // Ajoutez d'autres assets importants ici
];

// Installation du Service Worker et mise en cache de l'App Shell
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Force le nouveau SW à devenir actif
      .catch(error => {
          console.error('Service Worker: Failed to cache App Shell:', error);
      })
  );
});

// Activation du Service Worker et nettoyage des anciens caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Prend le contrôle immédiat des pages
  );
});

// Stratégie Cache-First pour les requêtes
self.addEventListener('fetch', event => {
    // Ne pas intercepter les requêtes vers l'API Supabase pour l'instant
    // (elles nécessitent d'être fraîches, sauf si vous implémentez une logique offline complexe)
    if (event.request.url.startsWith('https://hunbfztfmqtfxrckrchc.supabase.co')) {
         // console.log('Service Worker: Bypassing cache for Supabase API request:', event.request.url);
        event.respondWith(fetch(event.request));
        return;
    }

    // Pour les autres requêtes (App Shell, assets)
    // console.log('Service Worker: Fetching resource:', event.request.url);
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            // Si trouvé dans le cache, retourner la réponse du cache
            if (response) {
            // console.log('Service Worker: Found in cache:', event.request.url);
            return response;
            }

            // Sinon, effectuer la requête réseau
            // console.log('Service Worker: Not found in cache, fetching from network:', event.request.url);
            return fetch(event.request).then(
            networkResponse => {
                // Optionnel: Mettre en cache la nouvelle ressource récupérée
                 /*
                 if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                     return networkResponse; // Ne pas cacher les erreurs ou les requêtes cross-origin non-opaques
                 }
                 const responseToCache = networkResponse.clone();
                 caches.open(CACHE_NAME)
                     .then(cache => {
                         cache.put(event.request, responseToCache);
                     });
                 */
                return networkResponse;
                }
            ).catch(error => {
                console.error('Service Worker: Fetch failed:', error);
                // Optionnel: Retourner une page offline générique si la requête échoue
                // return caches.match('/offline.html');
            });
        })
    );
});
