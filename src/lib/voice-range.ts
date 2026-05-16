// Voice range / tessitura helpers.
//
// Pitches are represented as MIDI-style semitones counted from C-1 = 0, so
// C4 (middle C) = 60. We use Spanish solfège names (Do, Re, Mi, …).
//
// Song "range" here is derived from the chord roots only — we don't have
// melody notes. That makes it a rough approximation of where the song sits
// musically; useful for comparing songs against the user's preferred range.

const PITCH_CLASS: Record<string, number> = {
	Do: 0,
	Re: 2,
	Mi: 4,
	Fa: 5,
	Sol: 7,
	La: 9,
	Si: 11,
};

const SHARP_NAMES = [
	"Do",
	"Do#",
	"Re",
	"Re#",
	"Mi",
	"Fa",
	"Fa#",
	"Sol",
	"Sol#",
	"La",
	"La#",
	"Si",
];

const CHORD_ROOT_RE = /^(Do|Re|Mi|Fa|Sol|La|Si)([#b]?)/;

export function chordToPitchClass(chord: string): number | null {
	const m = chord.match(CHORD_ROOT_RE);
	if (!m) return null;
	const base = PITCH_CLASS[m[1]];
	const delta = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
	return ((base + delta) % 12 + 12) % 12;
}

export function pitchClassName(pc: number): string {
	return SHARP_NAMES[((pc % 12) + 12) % 12];
}

// Convert (pitch class, octave) to MIDI semitones (C-1 = 0, C4 = 60).
export function midiOf(pc: number, octave: number): number {
	return (octave + 1) * 12 + pc;
}

export function octaveOf(midi: number): number {
	return Math.floor(midi / 12) - 1;
}

export function pitchClassOf(midi: number): number {
	return ((midi % 12) + 12) % 12;
}

export function formatPitch(midi: number): string {
	return `${pitchClassName(pitchClassOf(midi))}${octaveOf(midi)}`;
}

// Comprehensive list of pickable notes (Do2 → Si5 = ~4 octaves, covers all
// adult vocal ranges).
export const PICKER_MIN = midiOf(0, 2); // Do2 = 36
export const PICKER_MAX = midiOf(11, 5); // Si5 = 83

export function pickerOptions(): { value: number; label: string }[] {
	const out: { value: number; label: string }[] = [];
	for (let m = PICKER_MIN; m <= PICKER_MAX; m++) {
		out.push({ value: m, label: formatPitch(m) });
	}
	return out;
}

// --- Song range derived from chord roots ---

export type SongRange = {
	lowestPc: number;
	highestPc: number;
	pitchClasses: number[];
};

export function getSongChordRange(chords: string[]): SongRange | null {
	const pcs = chords
		.map(chordToPitchClass)
		.filter((p): p is number => p !== null);
	if (pcs.length === 0) return null;
	const uniq = Array.from(new Set(pcs)).sort((a, b) => a - b);
	return {
		lowestPc: uniq[0],
		highestPc: uniq[uniq.length - 1],
		pitchClasses: uniq,
	};
}

// Place the chord roots in a concrete octave so we can compare against the
// user's absolute voice range. We default to octave 4 — typical melodic
// position for Spanish flamenco / neocatecumenal singing, where the cantaor
// usually carries the root one octave above the guitar bass. The function
// returns absolute midi numbers.
export function placeChordsInOctave(
	range: SongRange,
	octave: number = 4,
): { low: number; high: number } {
	return {
		low: midiOf(range.lowestPc, octave),
		high: midiOf(range.highestPc, octave),
	};
}

// --- Fit analysis ---

export type FitStatus = "fits" | "low" | "high" | "wide" | "unknown";

export type FitAnalysis = {
	status: FitStatus;
	songLow: number;
	songHigh: number;
	userLow: number;
	userHigh: number;
	suggestedSemitones: number; // 0 if already a good fit
};

export function analyzeFit(
	songRange: SongRange,
	userLow: number,
	userHigh: number,
): FitAnalysis {
	const placed = placeChordsInOctave(songRange);

	const status: FitStatus = (() => {
		if (userHigh - userLow < placed.high - placed.low) return "wide";
		if (placed.low < userLow) return "low";
		if (placed.high > userHigh) return "high";
		return "fits";
	})();

	// Suggested transposition: center the song's range inside the user's range,
	// then bias half a tone DOWN. In practice the cantaor's actual melody sits
	// a little above where the chord root would place it, so a pure centering
	// suggestion lands slightly high — empirically a −½ tone bias matches what
	// the user actually picks by ear.
	const songCenter = (placed.low + placed.high) / 2;
	const userCenter = (userLow + userHigh) / 2;
	const suggestedSemitones = Math.round(userCenter - songCenter) - 1;

	return {
		status,
		songLow: placed.low,
		songHigh: placed.high,
		userLow,
		userHigh,
		suggestedSemitones,
	};
}
