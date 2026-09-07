const CACHE_NAME = "purgatorio-scan-v1";

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/logo.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/favicon.ico"
];

// Instalar y precachear
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activar y limpiar caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Estrategia: Network first, fallback a cache
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Solo manejar GET
  if (request.method !== "GET") return;

  // No cachear llamadas a Supabase / APIs externas
  if (
    request.url.includes("supabase.co") ||
    request.url.includes("cdn.jsdelivr.net")
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Guardar en cache una copia de la respuesta válida
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          return cached || caches.match("./index.html");
        })
      )
  );
});
