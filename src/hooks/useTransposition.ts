import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "resucito-transpositions";

type Map = Record<string, number>;

function load(): Map {
	if (typeof localStorage === "undefined") return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as Map) : {};
	} catch {
		return {};
	}
}

function save(map: Map) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
	} catch {
		// quota / private browsing — ignore
	}
}

type TranspositionContextType = {
	get: (slug: string) => number;
	set: (slug: string, semitones: number) => void;
	adjust: (slug: string, delta: number) => void;
	reset: (slug: string) => void;
};

export const TranspositionContext = createContext<TranspositionContextType>({
	get: () => 0,
	set: () => {},
	adjust: () => {},
	reset: () => {},
});

export function useTranspositionProvider(): TranspositionContextType {
	const [map, setMap] = useState<Map>(() => load());

	const set = useCallback((slug: string, semitones: number) => {
		setMap((prev) => {
			const next = { ...prev };
			if (semitones === 0) delete next[slug];
			else next[slug] = semitones;
			save(next);
			return next;
		});
	}, []);

	const adjust = useCallback((slug: string, delta: number) => {
		setMap((prev) => {
			const current = prev[slug] ?? 0;
			const value = current + delta;
			const next = { ...prev };
			if (value === 0) delete next[slug];
			else next[slug] = value;
			save(next);
			return next;
		});
	}, []);

	const reset = useCallback((slug: string) => {
		setMap((prev) => {
			if (!(slug in prev)) return prev;
			const next = { ...prev };
			delete next[slug];
			save(next);
			return next;
		});
	}, []);

	const get = useCallback((slug: string) => map[slug] ?? 0, [map]);

	return useMemo(() => ({ get, set, adjust, reset }), [get, set, adjust, reset]);
}

export function useTransposition(slug: string): {
	semitones: number;
	adjust: (delta: number) => void;
	reset: () => void;
} {
	const ctx = useContext(TranspositionContext);
	const [, force] = useState(0);

	// Subscribe to changes from other windows/tabs (storage event).
	useEffect(() => {
		function onStorage(e: StorageEvent) {
			if (e.key === STORAGE_KEY) force((n) => n + 1);
		}
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);

	return {
		semitones: ctx.get(slug),
		adjust: useCallback((delta: number) => ctx.adjust(slug, delta), [ctx, slug]),
		reset: useCallback(() => ctx.reset(slug), [ctx, slug]),
	};
}
