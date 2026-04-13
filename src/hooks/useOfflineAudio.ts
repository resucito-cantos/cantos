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
