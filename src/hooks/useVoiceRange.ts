import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "resucito-voice-range";

export type VoiceRange = {
	low: number; // MIDI semitones (C-1 = 0, C4 = 60)
	high: number;
};

function load(): VoiceRange | null {
	if (typeof localStorage === "undefined") return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as VoiceRange;
		if (
			typeof parsed.low === "number" &&
			typeof parsed.high === "number" &&
			parsed.low < parsed.high
		) {
			return parsed;
		}
	} catch {
		/* corrupt — ignore */
	}
	return null;
}

function save(range: VoiceRange | null) {
	try {
		if (range === null) localStorage.removeItem(STORAGE_KEY);
		else localStorage.setItem(STORAGE_KEY, JSON.stringify(range));
	} catch {
		/* quota / private mode — ignore */
	}
}

type Ctx = {
	range: VoiceRange | null;
	setRange: (r: VoiceRange | null) => void;
};

export const VoiceRangeContext = createContext<Ctx>({
	range: null,
	setRange: () => {},
});

export function useVoiceRangeProvider(): Ctx {
	// Initialize empty for SSR consistency; load from localStorage after mount.
	const [range, setRangeState] = useState<VoiceRange | null>(null);

	useEffect(() => {
		const stored = load();
		if (stored !== null) setRangeState(stored);
	}, []);

	const setRange = useCallback((r: VoiceRange | null) => {
		setRangeState(r);
		save(r);
	}, []);

	return useMemo(() => ({ range, setRange }), [range, setRange]);
}

export function useVoiceRange(): Ctx {
	return useContext(VoiceRangeContext);
}
