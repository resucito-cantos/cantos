import { useEffect } from "react";

// Keeps the display awake while the consuming component is mounted.
//
// Notes
//   - Browsers usually require a prior user gesture before granting the lock,
//     so the first acquire() can reject; we listen for click/keydown and
//     retry on the first interaction.
//   - The lock is auto-released when the tab is hidden, so we re-acquire on
//     visibilitychange while still mounted.
//   - No-op on browsers that don't implement Screen Wake Lock (older Safari).
export function useScreenWakeLock(enabled: boolean = true): void {
	useEffect(() => {
		if (!enabled) return;
		if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

		let sentinel: WakeLockSentinel | null = null;
		let cancelled = false;

		async function acquire() {
			if (sentinel !== null) return;
			try {
				const s = await navigator.wakeLock.request("screen");
				if (cancelled) {
					s.release().catch(() => {});
					return;
				}
				sentinel = s;
				s.addEventListener("release", () => {
					if (sentinel === s) sentinel = null;
				});
			} catch {
				// Permission denied or no user activation yet — we'll retry on
				// the next interaction or visibility change.
			}
		}

		function onInteraction() {
			if (sentinel === null) acquire();
		}

		function onVisibilityChange() {
			if (document.visibilityState === "visible" && sentinel === null) {
				acquire();
			}
		}

		acquire();
		document.addEventListener("visibilitychange", onVisibilityChange);
		document.addEventListener("click", onInteraction, { passive: true });
		document.addEventListener("keydown", onInteraction);

		return () => {
			cancelled = true;
			document.removeEventListener("visibilitychange", onVisibilityChange);
			document.removeEventListener("click", onInteraction);
			document.removeEventListener("keydown", onInteraction);
			sentinel?.release().catch(() => {});
			sentinel = null;
		};
	}, [enabled]);
}
