# Player OS & Browser Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Media Session API integration, service worker audio caching, offline download button, and background playback awareness to the Resucitó player.

**Architecture:** Extend the existing `Player.tsx` component with Media Session metadata and action handlers. Add a new service worker (`src/sw.ts`) built as a separate Vite entry point that caches audio files on play. Add a `useOfflineAudio` hook for SW messaging and a download button on the song page.

**Tech Stack:** React 19, Vite 7, TypeScript, Media Session API, Service Worker + Cache API, Lucide React icons.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/sw.ts` | Create | Service worker: audio fetch interception, cache-first strategy, message API |
| `src/hooks/useOfflineAudio.ts` | Create | Hook for SW communication: cache status, download, error handling |
| `src/components/Player.tsx` | Modify | Add Media Session metadata, action handlers, position state, visibility awareness |
| `src/routes/cantos/$slug.tsx` | Modify | Pass `title` to Player, add download button |
| `src/routes/__root.tsx` | Modify | Register service worker |
| `vite.config.ts` | Modify | Add SW build entry |

---

### Task 1: Service Worker — Build Configuration

**Files:**
- Create: `src/sw.ts`
- Modify: `vite.config.ts`

- [ ] **Step 1: Create a minimal service worker file**

Create `src/sw.ts` with just a self-activation handler so we can verify the build works:

```ts
declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
```

- [ ] **Step 2: Add Vite build config for the service worker**

In `vite.config.ts`, add a custom plugin that builds `src/sw.ts` as a separate entry. Add this plugin to the `plugins` array, before the other plugins:

```ts
import { resolve } from "node:path";

// Add this plugin inside the plugins array in defineConfig:
{
  name: "build-sw",
  apply: "build",
  closeBundle: {
    sequential: true,
    order: "post",
    async handler() {
      const { build } = await import("vite");
      await build({
        configFile: false,
        build: {
          lib: {
            entry: resolve(__dirname, "src/sw.ts"),
            formats: ["es"],
            fileName: () => "sw.js",
          },
          outDir: "dist/client",
          emptyOutDir: false,
        },
      });
    },
  },
},
```

- [ ] **Step 3: Verify the build produces sw.js**

Run: `pnpm build`
Expected: Build succeeds and `dist/client/sw.js` exists.

```bash
ls dist/client/sw.js
```

- [ ] **Step 4: Commit**

```bash
git add src/sw.ts vite.config.ts
git commit -m "feat: add service worker build pipeline"
```

---

### Task 2: Service Worker — Audio Caching Logic

**Files:**
- Modify: `src/sw.ts`

- [ ] **Step 1: Implement the cache-first fetch handler for audio**

Replace the contents of `src/sw.ts` with the full implementation:

```ts
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
```

- [ ] **Step 2: Verify build still succeeds**

Run: `pnpm build`
Expected: Build succeeds, `dist/client/sw.js` contains the fetch and message handlers.

- [ ] **Step 3: Commit**

```bash
git add src/sw.ts
git commit -m "feat: implement audio caching and message API in service worker"
```

---

### Task 3: Service Worker Registration

**Files:**
- Modify: `src/routes/__root.tsx`

- [ ] **Step 1: Add SW registration in RootComponent**

In `src/routes/__root.tsx`, add a `useEffect` inside `RootComponent` (after the existing `useEffect` for the keydown listener, around line 77):

```tsx
useEffect(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js");
  }
}, []);
```

No new imports needed — `useEffect` is already imported.

- [ ] **Step 2: Verify the app builds and the SW registers in dev**

Run: `pnpm build && pnpm preview`
Open browser, check DevTools → Application → Service Workers. The `sw.js` worker should appear as active.

- [ ] **Step 3: Commit**

```bash
git add src/routes/__root.tsx
git commit -m "feat: register service worker in root layout"
```

---

### Task 4: `useOfflineAudio` Hook

**Files:**
- Create: `src/hooks/useOfflineAudio.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useOfflineAudio.ts`:

```ts
import { useCallback, useEffect, useState } from "react";

export type OfflineStatus = "unknown" | "not-cached" | "downloading" | "cached" | "error";

function sendMessage(data: { type: string; url: string }): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const sw = navigator.serviceWorker.controller;
    if (!sw) return reject(new Error("No active service worker"));

    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => resolve(event.data);
    sw.postMessage(data, [channel.port2]);
  });
}

export function useOfflineAudio(src: string | null) {
  const [status, setStatus] = useState<OfflineStatus>("unknown");

  useEffect(() => {
    if (!src || !("serviceWorker" in navigator)) return;

    async function checkStatus() {
      try {
        await navigator.serviceWorker.ready;
        const result = (await sendMessage({
          type: "CACHE_STATUS",
          url: src!,
        })) as { cached: boolean };
        setStatus(result.cached ? "cached" : "not-cached");
      } catch {
        setStatus("unknown");
      }
    }

    checkStatus();
  }, [src]);

  const download = useCallback(async () => {
    if (!src) return;
    setStatus("downloading");
    try {
      const result = (await sendMessage({
        type: "CACHE_AUDIO",
        url: src,
      })) as { ok: boolean };
      setStatus(result.ok ? "cached" : "error");
    } catch {
      setStatus("error");
    }
  }, [src]);

  return { status, download };
}
```

- [ ] **Step 2: Verify the app still builds**

Run: `pnpm build`
Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useOfflineAudio.ts
git commit -m "feat: add useOfflineAudio hook for SW messaging"
```

---

### Task 5: Media Session API Integration

**Files:**
- Modify: `src/components/Player.tsx`

- [ ] **Step 1: Update the Player props to accept title**

In `src/components/Player.tsx`, update the `PlayerProps` type (line 4-6):

Replace:

```ts
type PlayerProps = {
  src: string;
};
```

With:

```ts
type PlayerProps = {
  src: string;
  title: string;
};
```

Update the function signature (line 8):

Replace:

```ts
export function Player({ src }: PlayerProps) {
```

With:

```ts
export function Player({ src, title }: PlayerProps) {
```

- [ ] **Step 2: Add Media Session metadata and action handlers**

Add a new `useEffect` after the keyboard shortcuts effect (after line 138). This effect sets up Media Session metadata and registers action handlers:

```tsx
// Media Session API — lock screen / OS media controls
useEffect(() => {
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title,
    artist: "Resucitó",
    album: "Cantos para las Comunidades Neocatecumenales",
    artwork: [96, 128, 192, 256, 512].map((size) => ({
      src: "/resucito-cover.png",
      sizes: `${size}x${size}`,
      type: "image/png",
    })),
  });

  const actions: [MediaSessionAction, MediaSessionActionHandler][] = [
    ["play", () => { audioRef.current?.play(); setIsPlaying(true); }],
    ["pause", () => { audioRef.current?.pause(); setIsPlaying(false); }],
    [
      "seekto",
      (details) => {
        const audio = audioRef.current;
        if (audio && details.seekTime != null) {
          audio.currentTime = details.seekTime;
        }
      },
    ],
    [
      "seekbackward",
      () => {
        const audio = audioRef.current;
        if (audio) audio.currentTime = Math.max(0, audio.currentTime - 5);
      },
    ],
    [
      "seekforward",
      () => {
        const audio = audioRef.current;
        if (audio) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
      },
    ],
  ];

  for (const [action, handler] of actions) {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch {
      // Action not supported by this browser
    }
  }

  return () => {
    for (const [action] of actions) {
      try {
        navigator.mediaSession.setActionHandler(action, null);
      } catch {
        // Ignore
      }
    }
  };
}, [title]);
```

- [ ] **Step 3: Add position state updates driven by timeupdate**

Modify the existing `timeupdate` effect (lines 72-91). Replace the `onTimeUpdate` function inside that effect:

Replace:

```ts
function onTimeUpdate() {
  if (!audio) return;
  setSeekValue((audio.currentTime / audio.duration) * 100 || 0);
}
```

With:

```ts
function onTimeUpdate() {
  if (!audio) return;
  setSeekValue((audio.currentTime / audio.duration) * 100 || 0);

  if ("mediaSession" in navigator && audio.duration) {
    navigator.mediaSession.setPositionState({
      duration: audio.duration,
      playbackRate: audio.playbackRate,
      position: audio.currentTime,
    });
  }
}
```

- [ ] **Step 4: Verify the build**

Run: `pnpm build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/Player.tsx
git commit -m "feat: integrate Media Session API for OS media controls"
```

---

### Task 6: Download Button on Song Page

**Files:**
- Modify: `src/routes/cantos/$slug.tsx`

- [ ] **Step 1: Add the download button**

In `src/routes/cantos/$slug.tsx`, import the hook and icons, and add the download button inside `CantoPage`.

Add to the imports at the top:

```tsx
import { CheckCircle, Download, Loader2 } from "lucide-react";
import { useOfflineAudio } from "../../hooks/useOfflineAudio";
```

Replace the `CantoPage` function with:

```tsx
function CantoPage() {
  const canto = Route.useLoaderData();
  const { chordsVisible } = useChordsVisible();
  const bg = CATEGORY_BG[canto.category?.toLowerCase() ?? ""] ?? "bg-white";
  const { status, download } = useOfflineAudio(canto.audioSrc);

  return (
    <main className={`min-h-screen pb-24 ${bg}`}>
      <SongSheet
        title={canto.title}
        subtitle={canto.subtitle}
        ast={canto.ast}
        category={canto.category}
      />
      {chordsVisible && <ChordDiagrams chords={canto.ast.chords} />}
      <footer className="song-footer">
        SOLO para uso interno del Camino Neocatecumenal
      </footer>
      {canto.audioSrc && (
        <>
          <Player src={canto.audioSrc} title={canto.title} />
          <DownloadButton status={status} onDownload={download} />
        </>
      )}
    </main>
  );
}

function DownloadButton({
  status,
  onDownload,
}: { status: ReturnType<typeof useOfflineAudio>["status"]; onDownload: () => void }) {
  if (status === "unknown") return null;

  return (
    <button
      type="button"
      onClick={status === "not-cached" || status === "error" ? onDownload : undefined}
      disabled={status === "downloading" || status === "cached"}
      className="fixed bottom-20 right-4 z-50 flex size-10 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-gray-50 disabled:opacity-60"
      aria-label={
        status === "cached"
          ? "Disponible sin conexión"
          : status === "downloading"
            ? "Descargando..."
            : "Descargar para escuchar sin conexión"
      }
    >
      {status === "cached" && <CheckCircle size={20} className="text-green-600" />}
      {status === "downloading" && <Loader2 size={20} className="animate-spin text-gray-500" />}
      {(status === "not-cached" || status === "error") && (
        <Download size={20} className="text-gray-600" />
      )}
    </button>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `pnpm build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/cantos/\$slug.tsx
git commit -m "feat: add offline download button to song page"
```

---

### Task 7: Background Playback — Visibility Awareness

**Files:**
- Modify: `src/components/Player.tsx`

- [ ] **Step 1: Add a visibility ref to skip UI updates when hidden**

In `src/components/Player.tsx`, add a ref tracking document visibility. Add this after the existing refs/state declarations (after line 13):

```ts
const isVisibleRef = useRef(true);
```

Add a new `useEffect` to track visibility (place it after the Media Session effect):

```tsx
// Page Visibility — skip UI updates when tab is hidden
useEffect(() => {
  function onVisibilityChange() {
    isVisibleRef.current = document.visibilityState === "visible";
  }
  document.addEventListener("visibilitychange", onVisibilityChange);
  return () => document.removeEventListener("visibilitychange", onVisibilityChange);
}, []);
```

- [ ] **Step 2: Guard the seek slider update with visibility check**

In the `onTimeUpdate` function (inside the timeupdate effect), wrap the `setSeekValue` call:

Replace:

```ts
function onTimeUpdate() {
  if (!audio) return;
  setSeekValue((audio.currentTime / audio.duration) * 100 || 0);

  if ("mediaSession" in navigator && audio.duration) {
    navigator.mediaSession.setPositionState({
      duration: audio.duration,
      playbackRate: audio.playbackRate,
      position: audio.currentTime,
    });
  }
}
```

With:

```ts
function onTimeUpdate() {
  if (!audio) return;

  // Only update the slider UI when the tab is visible
  if (isVisibleRef.current) {
    setSeekValue((audio.currentTime / audio.duration) * 100 || 0);
  }

  // Always update OS position state (works in background)
  if ("mediaSession" in navigator && audio.duration) {
    navigator.mediaSession.setPositionState({
      duration: audio.duration,
      playbackRate: audio.playbackRate,
      position: audio.currentTime,
    });
  }
}
```

- [ ] **Step 3: Verify the build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/Player.tsx
git commit -m "feat: add visibility-aware UI updates for background playback"
```

---

### Task 8: Manual Testing & Final Verification

**Files:** None (testing only)

- [ ] **Step 1: Start the preview server**

```bash
pnpm build && pnpm preview
```

- [ ] **Step 2: Test Media Session**

Open a song with audio in Chrome. Play the song. Verify:
- Chrome's media hub (top-right media icon) shows the song title, "Resucitó" as artist, and the cover artwork
- Play/pause buttons in the media hub work
- Seek slider in the media hub reflects current position
- On macOS: the Now Playing widget in Control Center shows the song

- [ ] **Step 3: Test cache-on-play**

Play a song. Open DevTools → Application → Cache Storage → `resucito-audio-v1`. Verify the MP3 file appears in the cache.

- [ ] **Step 4: Test the download button**

Navigate to a song you haven't played. The download button (download icon) should appear. Click it. Verify:
- Icon changes to spinner while downloading
- Icon changes to green checkmark when cached
- The MP3 appears in cache storage

- [ ] **Step 5: Test offline playback**

Go offline (DevTools → Network → Offline). Navigate to a song that was previously cached. Play it. Verify audio plays from cache.

- [ ] **Step 6: Test background playback**

Play a song, then switch to another tab. Verify:
- Audio continues playing
- Returning to the tab, the seek slider re-syncs to current position

- [ ] **Step 7: Final commit if any adjustments were needed**

```bash
git add -A
git commit -m "fix: adjustments from manual testing"
```
