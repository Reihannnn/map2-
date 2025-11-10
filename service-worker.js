const CACHE_NAME = "storymap-cache-v2";
const OFFLINE_URL = "/offline.html";
const urlsToCache = [
  "/",
  "/index.html",
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// ✅ Install Service Worker & simpan cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // Langsung aktifkan SW baru tanpa tunggu reload
});

// ✅ Aktivasi SW baru & hapus cache lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Deleting old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ✅ Fetch: ambil dari jaringan, fallback ke cache/offline
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Simpan versi terbaru ke cache
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        // Kalau offline, ambil dari cache
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match(OFFLINE_URL);
        });
      })
  );
});

// ✅ Push Notification handler (kamu sudah punya — ini tetap)
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.options?.body || "Kamu punya notifikasi baru!",
    icon: "/icons/icon-192x192.png",
  };
  event.waitUntil(
    self.registration.showNotification(data.title || "StoryMap", options)
  );
});
