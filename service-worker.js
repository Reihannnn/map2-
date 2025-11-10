const CACHE_NAME = "storymap-cache-v5";
const OFFLINE_URL = "/offline.html";

// Cache file yang PASTI ada dulu
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  // Uncomment kalau file-nya sudah ada:
  // "/src/image/icon-192x192.png",
  // "/src/image/icon-512x512.png",
  // OFFLINE_URL,
];

// Install Service Worker
self.addEventListener("install", (event) => {
  console.log("✅ SW installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log("📦 Caching files");
      
      // Cache satu-satu, skip yang error
      const cachePromises = urlsToCache.map(async (url) => {
        try {
          await cache.add(url);
          console.log(`✅ Cached: ${url}`);
        } catch (error) {
          console.warn(`⚠️ Failed to cache: ${url}`, error);
        }
      });
      
      return Promise.all(cachePromises);
    })
  );
  self.skipWaiting();
});

// Aktivasi SW & hapus cache lama
self.addEventListener("activate", (event) => {
  console.log("🔄 SW activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("🗑️ Deleting old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  // Skip kalau bukan GET atau bukan HTTP/HTTPS
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith('http')) return; // ✅ Filter chrome-extension://

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cuma cache response yang valid
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match(OFFLINE_URL);
        });
      })
  );
});

// Push Notification
self.addEventListener("push", (event) => {
  console.log("🔔 Push notification received!");
  
  let title = "StoryMap";
  let body = "Kamu punya notifikasi baru!";
  
  // Coba parse JSON, kalau gagal pakai text biasa
  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      body = data.options?.body || data.body || body;
    } catch (error) {
      // Kalau bukan JSON, pakai text biasa
      body = event.data.text();
      console.log("📝 Push data (text):", body);
    }
  }
  
  const options = {
    body: body,
    icon: "/image/android-chrome-192x192.png",
    badge: "/image/android-chrome-192x192.png",
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});