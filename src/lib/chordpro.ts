export type Segment = {
	chord: string | null;
	text: string;
};

export type Line = {
	timecode: string | null;
	segments: Segment[];
};

export type Section = {
	type: "verse" | "chorus";
	columnBreak?: boolean;
	bis?: boolean;
	lines: Line[];
};

export type CantoAST = {
	capo: number | null;
	sections: Section[];
	chords: string[];
};

const TIMECODE_RE = /^\[(\d{2}:\d{2}\.\d{2,3})\]\s*/;
const CHORD_TOKEN_RE = /\[([^\]]+)\]/g;

function parseLine(raw: string): Line {
	let text = raw;
	let timecode: string | null = null;

	const tcMatch = text.match(TIMECODE_RE);
	if (tcMatch) {
		timecode = tcMatch[1];
		text = text.slice(tcMatch[0].length);
	}

	const segments: Segment[] = [];
	let lastIndex = 0;

	for (const match of text.matchAll(CHORD_TOKEN_RE)) {
		const before = text.slice(lastIndex, match.index);
		if (before) {
			segments.push({ chord: null, text: before });
		}
		const chord = match[1];
		const afterChordStart = match.index! + match[0].length;
		// Find text after this chord until next chord or end of line
		const nextMatch = text.slice(afterChordStart).match(/\[([^\]]+)\]/);
		const textEnd = nextMatch
			? afterChordStart + nextMatch.index!
			: text.length;
		segments.push({ chord, text: text.slice(afterChordStart, textEnd) });
		lastIndex = textEnd;
	}

	if (lastIndex === 0 && text.length > 0) {
		segments.push({ chord: null, text });
	}

	return { timecode, segments };
}

export function parseChordPro(input: string): CantoAST {
	const lines = input.split("\n");
	const sections: Section[] = [];
	const chordSet = new Set<string>();
	let capo: number | null = null;
	let currentSection: Section | null = null;
	let pendingColumnBreak = false;

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (line === "") continue;

		// Directives: {command} or {command: arg}
		const directiveMatch = line.match(
			/^\{([a-z_]+):?\s*(.*?)?\s*\}$/,
		);
		if (directiveMatch) {
			const cmd = directiveMatch[1];
			const arg = (directiveMatch[2] ?? "").trim();

			switch (cmd) {
				case "capo":
					capo = Number.parseInt(arg, 10);
					break;
				case "start_of_verse":
					currentSection = {
						type: "verse",
						lines: [],
						...(pendingColumnBreak && { columnBreak: true }),
					};
					pendingColumnBreak = false;
					sections.push(currentSection);
					break;
				case "start_of_chorus": {
					const hasBis = /BIS/i.test(arg);
					currentSection = {
						type: "chorus",
						lines: [],
						...(pendingColumnBreak && { columnBreak: true }),
						...(hasBis && { bis: true }),
					};
					pendingColumnBreak = false;
					sections.push(currentSection);
					break;
				}
				case "end_of_verse":
					currentSection = null;
					break;
				case "end_of_chorus": {
					// Check for BIS in end directive arg
					if (currentSection && /BIS/i.test(arg)) {
						currentSection.bis = true;
					}
					currentSection = null;
					break;
				}
				case "column_break":
					pendingColumnBreak = true;
					break;
				case "comment": {
					// {comment: BIS A.} or {comment: BIS Asamblea}
					if (/BIS/i.test(arg)) {
						const target =
							currentSection ?? sections[sections.length - 1];
						if (target) target.bis = true;
					}
					break;
				}
			}
			continue;
		}

		// Inline {BIS} or {BIS A.} markers (not a standard directive)
		if (/\{BIS[^}]*\}/i.test(line)) {
			const target = currentSection ?? sections[sections.length - 1];
			if (target) target.bis = true;
		}

		// Content line — strip inline BIS markers and {BIS} from lyrics
		if (currentSection) {
			let cleanLine = line
				.replace(/\{BIS[^}]*\}/gi, "")
				.replace(/\s+BIS\s*(A\.?|Asamblea)?\s*$/i, "")
				.trim();

			if (cleanLine === "") continue;

			const parsed = parseLine(cleanLine);
			currentSection.lines.push(parsed);

			// Collect chords
			for (const seg of parsed.segments) {
				if (seg.chord) chordSet.add(seg.chord);
			}
		}
	}

	return {
		capo,
		sections,
		chords: [...chordSet],
	};
}
