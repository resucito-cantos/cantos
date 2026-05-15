import { useEffect, useRef } from "react";
import { ChordStyle, SVGuitarChord } from "svguitar";
import { transposeChord } from "../lib/transpose";

// Chord database: maps chord names to svguitar chord data
// Frets are [string, fret, optionalText], strings numbered 1-6 from high E to low E
// Use "x" for silent strings (muted), 0 for open strings
const CHORD_DB: Record<
	string,
	{
		fingers: [number, number | 0 | "x", (string | undefined)?][];
		barres?: {
			fromString: number;
			toString: number;
			fret: number;
		}[];
		position?: number;
	}
> = {
	Mi: {
		fingers: [
			[1, 0],
			[2, 0],
			[3, 1],
			[4, 2],
			[5, 2],
			[6, 0],
		],
	},
	"Mi-": {
		fingers: [
			[1, 0],
			[2, 0],
			[3, 0],
			[4, 2],
			[5, 2],
			[6, 0],
		],
	},
	La: {
		fingers: [
			[1, 0],
			[2, 2],
			[3, 2],
			[4, 2],
			[5, 0],
			[6, "x"],
		],
	},
	"La-": {
		fingers: [
			[1, 0],
			[2, 1],
			[3, 2],
			[4, 2],
			[5, 0],
			[6, "x"],
		],
	},
	La7: {
		fingers: [
			[1, 0],
			[2, 2],
			[3, 0],
			[4, 2],
			[5, 0],
			[6, "x"],
		],
	},
	Re: {
		fingers: [
			[1, 2],
			[2, 3],
			[3, 2],
			[4, 0],
			[5, "x"],
			[6, "x"],
		],
	},
	"Re-": {
		fingers: [
			[1, 1],
			[2, 3],
			[3, 2],
			[4, 0],
			[5, "x"],
			[6, "x"],
		],
	},
	"Re-9": {
		fingers: [
			[1, 1],
			[2, 3],
			[3, 2],
			[4, 0],
			[5, 0],
			[6, "x"],
		],
	},
	Fa: {
		fingers: [
			[3, 2],
			[4, 3],
			[5, 3],
			[6, 1],
		],
		barres: [{ fromString: 1, toString: 6, fret: 1 }],
	},
	Fa7aum: {
		fingers: [
			[1, 1],
			[2, 0],
			[3, 2],
			[4, 3],
			[5, "x"],
			[6, "x"],
		],
	},
	Sol: {
		fingers: [
			[1, 3],
			[2, 0],
			[3, 0],
			[4, 0],
			[5, 2],
			[6, 3],
		],
	},
	"Si-": {
		fingers: [
			[3, 3],
			[4, 4],
			[5, 4],
			[6, 2],
		],
		barres: [{ fromString: 1, toString: 5, fret: 2 }],
	},
};

type ChordDiagramProps = {
	name: string;
	width?: number;
};

export function ChordDiagram({ name, width = 80 }: ChordDiagramProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!containerRef.current) return;
		containerRef.current.innerHTML = "";

		const chordData = CHORD_DB[name];
		if (!chordData) {
			// Unknown chord -- render just the name
			containerRef.current.textContent = name;
			return;
		}

		const chart = new SVGuitarChord(containerRef.current);
		chart
			.chord({
				fingers: chordData.fingers,
				barres: chordData.barres ?? [],
			})
			.configure({
				title: name,
				strings: 6,
				frets: 4,
				position: chordData.position ?? 1,
				tuning: [],
				fixedDiagramPosition: false,
				style: ChordStyle.normal,
				titleColor: "#dc2626",
				fretColor: "#374151",
				stringColor: "#374151",
				fingerColor: "#374151",
				barreChordRadius: 0.3,
			})
			.draw();
	}, [name]);

	return <div ref={containerRef} style={{ width }} />;
}

type ChordDiagramsProps = {
	chords: string[];
	transposition?: number;
};

export function ChordDiagrams({ chords, transposition = 0 }: ChordDiagramsProps) {
	if (chords.length === 0) return null;

	const displayed =
		transposition === 0
			? chords
			: // Transpose and de-dupe (different originals may collapse onto the same chord).
				Array.from(
					new Set(chords.map((c) => transposeChord(c, transposition))),
				);

	return (
		<div className="mt-8 flex flex-wrap gap-4 justify-center px-8">
			{displayed.map((chord) => (
				<ChordDiagram key={chord} name={chord} />
			))}
		</div>
	);
}
