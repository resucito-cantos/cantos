declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = "resucito-audio-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function isAudioRequest(url: URL): boolean {
  return url.pathname.startsWith("/audio/") && url.pathname.endsWith(".mp3");
}

async function handleAudioFetch(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (isAudioRequest(url)) {
    event.respondWith(handleAudioFetch(event.request));
  }
});

type MessageData =
  | { type: "CACHE_AUDIO"; url: string }
  | { type: "CACHE_STATUS"; url: string }
  | { type: "DELETE_AUDIO"; url: string };

self.addEventListener("message", (event) => {
  const data = event.data as MessageData;
  const port = event.ports[0];
  if (!port) return;

  switch (data.type) {
    case "CACHE_AUDIO":
      handleCacheAudio(data.url).then(
        () => port.postMessage({ ok: true }),
        (error) => port.postMessage({ ok: false, error: String(error) }),
      );
      break;
    case "CACHE_STATUS":
      handleCacheStatus(data.url).then((cached) =>
        port.postMessage({ cached }),
      );
      break;
    case "DELETE_AUDIO":
      handleDeleteAudio(data.url).then(() => port.postMessage({ ok: true }));
      break;
  }
});

async function handleCacheAudio(url: string): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  await cache.put(url, response);
}

async function handleCacheStatus(url: string): Promise<boolean> {
  const cache = await caches.open(CACHE_NAME);
  const match = await cache.match(url);
  return match !== undefined;
}

async function handleDeleteAudio(url: string): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  await cache.delete(url);
}
