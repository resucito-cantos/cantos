# Player OS & Browser Integration

Integrate the Resucito audio player with OS and browser APIs for lock screen controls, offline playback, and background audio.

## Context

The current player (`src/components/Player.tsx`, ~194 lines) is a basic HTML5 `<audio>` wrapper with play/pause, loop, volume, seek, and lyric click-to-seek. It has no integration with platform APIs — no lock screen controls, no offline support, no service worker.

The app is React 19 + Vite 7 + TanStack Router, deployed to Cloudflare Pages. There are 200+ songs with MP3 files served from `/public/audio/{slug}/`.

## 1. Media Session API

**Location:** `src/components/Player.tsx` — new `useEffect` block.

**Metadata** — set when the player mounts with a song:

| Field    | Value                                          |
|----------|-------------------------------------------------|
| title    | `canto.title`                                   |
| artist   | "Resucito"                                     |
| album    | "Cantos para las Comunidades Neocatecumenales"  |
| artwork  | `resucito-cover.png` at sizes 96, 128, 192, 256, 512 |

**Action handlers** registered on `navigator.mediaSession`:

| Action        | Behavior               |
|---------------|------------------------|
| `play`        | Resume playback        |
| `pause`       | Pause playback         |
| `seekto`      | Seek to given position |
| `seekbackward`| Skip back 5 seconds   |
| `seekforward` | Skip forward 5 seconds |

No `previoustrack` or `nexttrack` — there is no playlist concept.

**Position state** — call `navigator.mediaSession.setPositionState({ duration, playbackRate, position })` on every `timeupdate` event from the audio element. Do not use `setInterval` — `timeupdate` fires reliably even in background tabs.

**Cleanup** — on unmount or song change, clear metadata and remove action handlers.

## 2. Service Worker

### Build

- **Source:** `src/sw.ts` (TypeScript)
- **Build:** Separate Vite entry point configured in `vite.config.ts`, outputs `sw.js` at the root of the build output
- No `vite-plugin-pwa` — just a second build entry for simplicity

### Registration

Register in `src/routes/__root.tsx` inside `RootComponent`:

```ts
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### Audio caching strategy: Cache First, Network Fallback

The `fetch` event listener intercepts requests matching `/audio/**/*.mp3`:

1. Check `resucito-audio-v1` cache for the request
2. If found, return cached response
3. If not found, fetch from network, serve the response, clone it into the cache

All non-audio requests pass through untouched.

### Message API

The service worker listens for `postMessage` events:

| Message type   | Payload         | Behavior                                      | Response           |
|----------------|-----------------|-----------------------------------------------|--------------------|
| `CACHE_AUDIO`  | `{ url: string }` | Fetch URL and store in cache                  | `{ ok: true }` or `{ ok: false, error }` |
| `CACHE_STATUS` | `{ url: string }` | Check if URL exists in cache                  | `{ cached: boolean }` |
| `DELETE_AUDIO` | `{ url: string }` | Remove URL from cache                         | `{ ok: true }`     |

### Extensibility

The SW is structured with separate handler functions (`handleAudioFetch`, etc.) so a search handler can be added later without restructuring.

## 3. Download for Offline

### Hook: `useOfflineAudio(src: string)`

**Location:** `src/hooks/useOfflineAudio.ts`

**Returns:**

```ts
{
  status: 'unknown' | 'not-cached' | 'downloading' | 'cached' | 'error';
  download: () => void;
}
```

**Behavior:**

- On mount, sends `CACHE_STATUS` to the SW to determine initial state
- `download()` sends `CACHE_AUDIO` to the SW, sets status to `downloading`, then updates to `cached` or `error` on response
- If no service worker is available, status stays `unknown`

### UI

**Location:** Song page `src/routes/cantos/$slug.tsx`, near the player or song header.

**States:**

| Status       | Icon                | Behavior on click  |
|--------------|---------------------|--------------------|
| `unknown`    | Hidden              | —                  |
| `not-cached` | `Download` (Lucide) | Triggers download  |
| `downloading`| Spinner             | Disabled           |
| `cached`     | `CheckCircle`       | No action          |
| `error`      | `Download` (retry)  | Retries download   |

Only rendered when the song has audio and a service worker is registered.

## 4. Background Playback

Mostly handled by the browser once Media Session and SW caching are in place.

**Explicit considerations:**

- **`timeupdate`-driven updates only** — both the seek slider and `setPositionState()` are driven by the audio element's `timeupdate` event, not `setInterval`. This avoids timer throttling in background tabs.
- **Page Visibility API** — listen to `document.visibilitychange`. When hidden, skip UI-only updates (seek slider repaints). When visible again, re-sync UI to current audio position. This is a minor optimization.
- **No additional SW logic** — the `<audio>` element manages its own playback stream. The SW only handles caching.

## Files

| File | Action | Purpose |
|------|--------|---------|
| `src/sw.ts` | Create | Service worker with audio caching + message API |
| `vite.config.ts` | Modify | Add SW as separate build entry |
| `src/components/Player.tsx` | Modify | Media Session API + visibility-aware updates |
| `src/hooks/useOfflineAudio.ts` | Create | SW messaging hook for offline status/download |
| `src/routes/cantos/$slug.tsx` | Modify | Add download button, pass song title to Player |
| `src/routes/__root.tsx` | Modify | SW registration in `RootComponent` |

## Out of Scope

- Playlist / next-previous track navigation
- PWA manifest / install prompt
- Per-song artwork
- Cache eviction UI
- Eager caching of all songs
