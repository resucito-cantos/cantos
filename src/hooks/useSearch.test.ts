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
		subtitle: "Numeros 23, 7-24",
		category: "TODO",
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
		expect(results).toHaveLength(1);
		expect(results[0].slug).toBe("a-la-victima-pascual");
	});

	it("matches by subtitle", () => {
		const results = filterCantos(mockCantos, "Numeros");
		expect(results).toHaveLength(1);
		expect(results[0].slug).toBe("balaam");
	});

	it("matches case-insensitively", () => {
		const results = filterCantos(mockCantos, "BALAAM");
		expect(results).toHaveLength(1);
	});

	it("matches by lyrics content", () => {
		const results = filterCantos(mockCantos, "Aram");
		expect(results).toHaveLength(1);
		expect(results[0].slug).toBe("balaam");
	});
});
