// ═══════════════════════════════════════════════════════════════════════════
// 💕 BUMPY SERVICE WORKER v3.1
// Offline-first PWA with intelligent caching
// ═══════════════════════════════════════════════════════════════════════════

const CACHE_VERSION = 'bumpy-v3.1.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;

// Core app shell - always cached
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon.svg',
  '/icons/favicon.svg'
];

// Font origins to cache
const FONT_ORIGINS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com'
];

// ═══════════════════════════════════════════════════════════════════════════
// 📦 INSTALL - Cache static assets
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
  console.log('💕 Bumpy SW: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('💕 Bumpy SW: Caching app shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('💕 Bumpy SW: Install complete');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('💕 Bumpy SW: Install failed', err);
      })
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🧹 ACTIVATE - Clean old caches
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('activate', (event) => {
  console.log('💕 Bumpy SW: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete old version caches
              return name.startsWith('bumpy-') && 
                     !name.startsWith(CACHE_VERSION);
            })
            .map((name) => {
              console.log('💕 Bumpy SW: Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('💕 Bumpy SW: Claiming clients');
        return self.clients.claim();
      })
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🌐 FETCH - Intelligent caching strategies
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;
  
  // Skip API requests - always go to network
  if (url.pathname.startsWith('/api/') || url.hostname.includes('workers.dev')) {
    event.respondWith(networkOnly(request));
    return;
  }
  
  // Font requests - cache first with long TTL
  if (FONT_ORIGINS.some(origin => url.href.startsWith(origin))) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }
  
  // Static assets - cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  
  // HTML pages - network first with cache fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }
  
  // Everything else - stale while revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 CACHING STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════

// Cache First - for immutable assets
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.warn('💕 Bumpy SW: Cache first fetch failed', err);
    return new Response('Offline', { status: 503 });
  }
}

// Network First - for HTML and dynamic content
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.log('💕 Bumpy SW: Network failed, falling back to cache');
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // For navigation requests, return the cached index
    if (request.mode === 'navigate') {
      const indexCached = await caches.match('/');
      if (indexCached) return indexCached;
    }
    
    return new Response(offlineHTML(), {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Network Only - for API requests
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale While Revalidate - for dynamic assets
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const responseClone = response.clone();
      caches.open(cacheName).then((cache) => {
        cache.put(request, responseClone);
      });
    }
    return response;
  }).catch(() => null);
  
  return cached || fetchPromise || new Response('Offline', { status: 503 });
}

// ═══════════════════════════════════════════════════════════════════════════
// 🛠️ HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

function offlineHTML() {
  return `
<!DOCTYPE html>
<html lang="nb">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bumpy - Offline</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(145deg, #FDF4F8 0%, #FFEDF5 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .container {
      text-align: center;
      max-width: 320px;
    }
    .emoji { font-size: 72px; margin-bottom: 24px; }
    h1 { color: #141414; font-size: 24px; margin-bottom: 12px; }
    p { color: #6B6B6B; font-size: 16px; line-height: 1.5; margin-bottom: 24px; }
    button {
      background: linear-gradient(135deg, #FF4DA6 0%, #E63D90 100%);
      color: white;
      border: none;
      padding: 14px 32px;
      border-radius: 999px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s ease;
    }
    button:active { transform: scale(0.96); }
  </style>
</head>
<body>
  <div class="container">
    <div class="emoji">📴💕</div>
    <h1>Du er offline</h1>
    <p>Koble til internett for å fortsette å bruke Bumpy. Vi venter her!</p>
    <button onclick="location.reload()">Prøv igjen</button>
  </div>
</body>
</html>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// 📬 MESSAGE HANDLING
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'getVersion') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 🔔 PUSH NOTIFICATIONS (Future)
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Ny oppdatering fra Bumpy!',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    tag: data.tag || 'bumpy-notification',
    renotify: true,
    data: data.url || '/'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Bumpy 💕', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing window if open
        for (const client of windowClients) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data || '/');
        }
      })
  );
});

console.log('💕 Bumpy Service Worker loaded');
