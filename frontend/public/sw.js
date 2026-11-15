const SHELL = "rootwise-shell-v3";
const RUNTIME = "rootwise-runtime-v3";
const DATA_PREFIX = "rootwise-data-v3-";
const SHELL_FILES = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon.svg",
  "/logo-emblem.png",
  "/logo-nav.png",
  "/logo-lockup.png",
  "/logo-icon-192.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((cache) => cache.addAll(SHELL_FILES).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("rootwise-") && key !== SHELL && key !== RUNTIME && !key.startsWith(DATA_PREFIX))
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

function hash(value) {
  let hashValue = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hashValue = ((hashValue << 5) + hashValue + value.charCodeAt(index)) | 0;
  }
  return (hashValue >>> 0).toString(36);
}

function dataCacheName(request) {
  const auth = request.headers.get("authorization") || "anon";
  return `${DATA_PREFIX}${hash(auth)}`;
}

async function networkFirstData(request) {
  const cacheName = dataCacheName(request);
  try {
    const response = await fetch(request);
    if (response.ok && response.headers.get("content-type")?.includes("application/json")) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request, { cacheName });
    if (cached) return cached;
    return new Response(
      JSON.stringify({
        error: "Sin conexión y sin copia local de estos datos.",
        code: "offline",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
}

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL);
      cache.put("/index.html", response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match("/index.html");
    if (cached) return cached;
    return caches.match("/");
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstData(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});
