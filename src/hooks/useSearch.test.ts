import { describe, expect, it } from "vitest";
import { filterCantos } from "./useSearch";

const mockCantos = [
	{
		slug: "a-la-victima-pascual",
		title: "A la víctima pascual",
		subtitle: "Secuencia de Pascua",
		category: "Precatecumenado",
		tags: ["Pascua"],
		audioSrc: null,
		ast: {
			capo: null,
			sections: [
				{
					type: "verse" as const,
					lines: [
						{
							timecode: null,
							segments: [{ chord: null, text: "A la víctima pascual" }],
						},
					],
				},
			],
			chords: [],
		},
	},
	{
		slug: "balaam",
		title: "Balaam",
		subtitle: "Números 23, 7-24",
		category: "Precatecumenado",
		tags: [],
		audioSrc: null,
		ast: {
			capo: null,
			sections: [
				{
					type: "verse" as const,
					lines: [
						{
							timecode: null,
							segments: [{ chord: null, text: "De Aram me ha hecho venir" }],
						},
					],
				},
			],
			chords: [],
		},
	},
];

describe("filterCantos", () => {
	it("returns empty array for empty query", () => {
		expect(filterCantos(mockCantos, "")).toEqual([]);
	});

	it("matches by title", () => {
		const results = filterCantos(mockCantos, "víctima");
		expect(results.length).toBeGreaterThanOrEqual(1);
		expect(results[0].slug).toBe("a-la-victima-pascual");
	});

	it("matches by subtitle", () => {
		const results = filterCantos(mockCantos, "Números");
		expect(results.length).toBeGreaterThanOrEqual(1);
		expect(results[0].slug).toBe("balaam");
	});

	it("matches case-insensitively", () => {
		const results = filterCantos(mockCantos, "BALAAM");
		expect(results.length).toBeGreaterThanOrEqual(1);
	});

	it("matches by lyrics content", () => {
		const results = filterCantos(mockCantos, "Aram");
		expect(results.length).toBeGreaterThanOrEqual(1);
		expect(results[0].slug).toBe("balaam");
	});

	it("matches without accents (accent-insensitive)", () => {
		const results = filterCantos(mockCantos, "victima");
		expect(results.length).toBeGreaterThanOrEqual(1);
		expect(results[0].slug).toBe("a-la-victima-pascual");
	});

	it("fuzzy matches similar words", () => {
		const results = filterCantos(mockCantos, "balam");
		expect(results.length).toBeGreaterThanOrEqual(1);
		expect(results[0].slug).toBe("balaam");
	});

	it("ranks title matches higher than lyrics", () => {
		const results = filterCantos(mockCantos, "pascual");
		expect(results.length).toBeGreaterThanOrEqual(1);
		// Title contains "pascual" should rank higher
		expect(results[0].slug).toBe("a-la-victima-pascual");
	});

	it("limits results", () => {
		const results = filterCantos(mockCantos, "a");
		expect(results.length).toBeLessThanOrEqual(20);
	});
});
