import { createContext, useContext } from "react";

export type ChordsVisibleContextType = {
	chordsVisible: boolean;
	toggleChords: () => void;
};

export const ChordsVisibleContext = createContext<ChordsVisibleContextType>({
	chordsVisible: true,
	toggleChords: () => {},
});

export function useChordsVisible() {
	return useContext(ChordsVisibleContext);
}

const STORAGE_KEY = "resucito-settings";

type Settings = {
	chordsVisible: boolean;
};

export function loadSettings(): Settings {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			return JSON.parse(raw);
		}
	} catch {
		// ignore
	}
	return { chordsVisible: true };
}

export function saveSettings(settings: Settings) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// ignore
	}
}
