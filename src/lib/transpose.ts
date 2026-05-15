// Transposition for Spanish solfège chord notation.
//
// Chord format: ROOT[#|b][SUFFIX]
//   - ROOT:  Do | Re | Mi | Fa | Sol | La | Si
//   - SUFFIX preserved verbatim ("-", "7", "-7", "dim", "7aum", …)
//
// transposeChord("Sol-", 2) → "La-"
// transposeChord("Do#", -1) → "Do"
// transposeChord("Sib", 2) → "Do"
// transposeChord("[Re-]", 2) → "[Re-]"  (untouched, no root match)

const ROOT_SEMITONE: Record<string, number> = {
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

const FLAT_NAMES = [
	"Do",
	"Reb",
	"Re",
	"Mib",
	"Mi",
	"Fa",
	"Solb",
	"Sol",
	"Lab",
	"La",
	"Sib",
	"Si",
];

const CHORD_RE = /^(Do|Re|Mi|Fa|Sol|La|Si)([#b]?)(.*)$/;

export function transposeChord(chord: string, semitones: number): string {
	if (semitones === 0) return chord;

	const m = chord.match(CHORD_RE);
	if (!m) return chord;

	const [, root, accidental, suffix] = m;
	const base = ROOT_SEMITONE[root];
	const delta = accidental === "#" ? 1 : accidental === "b" ? -1 : 0;
	const current = (base + delta + 12) % 12;
	const next = ((current + semitones) % 12 + 12) % 12;

	const names = accidental === "b" ? FLAT_NAMES : SHARP_NAMES;
	return names[next] + suffix;
}

const SEMITONE_LABEL: Record<number, string> = {
	[-2]: "−1 tono",
	[-1]: "−½ tono",
	[1]: "+½ tono",
	[2]: "+1 tono",
};

export function transpositionLabel(semitones: number): string {
	if (semitones === 0) return "tono original";
	if (semitones in SEMITONE_LABEL) return SEMITONE_LABEL[semitones];
	const sign = semitones > 0 ? "+" : "−";
	return `${sign}${Math.abs(semitones)} semitonos`;
}
