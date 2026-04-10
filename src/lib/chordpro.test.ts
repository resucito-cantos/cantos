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
