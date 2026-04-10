import { describe, expect, it } from "vitest";
import { parseChordPro } from "./chordpro";

describe("parseChordPro", () => {
	it("parses a simple verse with one chord per line", () => {
		const input = `{start_of_verse}
[Mi-]A la víctima pascual
{end_of_verse}`;

		const result = parseChordPro(input);

		expect(result.sections).toHaveLength(1);
		expect(result.sections[0].type).toBe("verse");
		expect(result.sections[0].lines).toHaveLength(1);
		expect(result.sections[0].lines[0].segments).toEqual([
			{ chord: "Mi-", text: "A la víctima pascual" },
		]);
	});

	it("parses multiple chords on the same line", () => {
		const input = `{start_of_verse}
[Mi-]A la víctima pascu[La7]al
{end_of_verse}`;

		const result = parseChordPro(input);
		const segments = result.sections[0].lines[0].segments;

		expect(segments).toEqual([
			{ chord: "Mi-", text: "A la víctima pascu" },
			{ chord: "La7", text: "al" },
		]);
	});

	it("fixes double-chord bug: adjacent chords on same word", () => {
		const input = `{start_of_verse}
[Mi]foo[La]bar
{end_of_verse}`;

		const result = parseChordPro(input);
		const segments = result.sections[0].lines[0].segments;

		expect(segments).toEqual([
			{ chord: "Mi", text: "foo" },
			{ chord: "La", text: "bar" },
		]);
	});

	it("handles text before first chord", () => {
		const input = `{start_of_verse}
ofrecemos hoy
{end_of_verse}`;

		const result = parseChordPro(input);
		const segments = result.sections[0].lines[0].segments;

		expect(segments).toEqual([{ chord: null, text: "ofrecemos hoy" }]);
	});

	it("parses chorus sections", () => {
		const input = `{start_of_chorus}
PORQUE CR[Fa]ISTO
{end_of_chorus}`;

		const result = parseChordPro(input);

		expect(result.sections[0].type).toBe("chorus");
		expect(result.sections[0].lines[0].segments).toEqual([
			{ chord: null, text: "PORQUE CR" },
			{ chord: "Fa", text: "ISTO" },
		]);
	});
});

describe("parseChordPro — timecodes", () => {
	it("extracts timecode from start of line", () => {
		const input = `{start_of_verse}
[00:15.00] el sacrificio de ala[Re-9]banza.
{end_of_verse}`;

		const result = parseChordPro(input);
		const line = result.sections[0].lines[0];

		expect(line.timecode).toBe("00:15.00");
		expect(line.segments).toEqual([
			{ chord: null, text: "el sacrificio de ala" },
			{ chord: "Re-9", text: "banza." },
		]);
	});

	it("extracts timecode with chords on the same line", () => {
		const input = `{start_of_verse}
[00:22.00] [Fa7aum]El cordero ha redimido el reb[Mi]año,
{end_of_verse}`;

		const result = parseChordPro(input);
		const line = result.sections[0].lines[0];

		expect(line.timecode).toBe("00:22.00");
		expect(line.segments).toEqual([
			{ chord: "Fa7aum", text: "El cordero ha redimido el reb" },
			{ chord: "Mi", text: "año," },
		]);
	});
});

describe("parseChordPro — capo", () => {
	it("extracts capo number", () => {
		const input = `{capo: 5}
{start_of_verse}
[Mi]test
{end_of_verse}`;

		const result = parseChordPro(input);
		expect(result.capo).toBe(5);
	});

	it("returns null capo when not present", () => {
		const input = `{start_of_verse}
[Mi]test
{end_of_verse}`;

		const result = parseChordPro(input);
		expect(result.capo).toBeNull();
	});
});

describe("parseChordPro — column breaks", () => {
	it("marks section after column_break with columnBreak: true", () => {
		const input = `{start_of_verse}
[Mi]verse one
{end_of_verse}
{column_break}
{start_of_chorus}
CHORUS
{end_of_chorus}`;

		const result = parseChordPro(input);

		expect(result.sections).toHaveLength(2);
		expect(result.sections[0].columnBreak).toBeUndefined();
		expect(result.sections[1].columnBreak).toBe(true);
		expect(result.sections[1].type).toBe("chorus");
	});
});

describe("parseChordPro — chords collection", () => {
	it("collects all unique chords", () => {
		const input = `{start_of_verse}
[Mi-]A la víctima pascu[La7]al
[Mi-]ofrecemos hoy
{end_of_verse}`;

		const result = parseChordPro(input);
		expect(result.chords).toContain("Mi-");
		expect(result.chords).toContain("La7");
		expect(result.chords).toHaveLength(2);
	});
});
