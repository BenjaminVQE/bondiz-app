// Service worker de Bondiz.
// - Pages : réseau d'abord (une nouvelle version est servie dès le déploiement),
//   copie en cache en secours quand il n'y a pas de connexion.
// - Fichiers statiques d'Expo (noms hachés, donc immuables) : cache d'abord.
// - Appels à l'API Strapi : jamais interceptés.
const CACHE = "bondiz-v1";
const SHELL = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];
const STATIC_PREFIXES = ["/_expo/static/", "/assets/", "/icons/"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(cacheFirst(request));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = (await cache.match(request)) || (await cache.match("/"));
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

// --- Notifications push ---
// Le serveur envoie { title, body, url, tag }.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = {};
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Bondiz", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      tag: data.tag,
      // Un nouveau message dans la même conversation remplace l'ancien, mais sonne quand même.
      renotify: Boolean(data.tag),
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // On n'ouvre jamais autre chose qu'une page de l'app.
  let target = new URL(event.notification.data?.url || "/", self.location.origin);
  if (target.origin !== self.location.origin) target = new URL("/", self.location.origin);

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const client = windows[0];

      if (client) {
        await client.focus();
        client.postMessage({ type: "navigate", path: target.pathname });
        return;
      }

      await self.clients.openWindow(target.href);
    })()
  );
});
