import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SongSheet } from "./SongSheet";
import type { CantoAST } from "../lib/chordpro";

const sampleAST: CantoAST = {
	capo: 5,
	sections: [
		{
			type: "verse",
			lines: [
				{
					timecode: "00:00.00",
					segments: [
						{ chord: "La-", text: "A la víctima pascu" },
						{ chord: "La7", text: "al" },
					],
				},
			],
		},
		{
			type: "chorus",
			columnBreak: true,
			lines: [
				{
					timecode: "01:45.00",
					segments: [
						{ chord: null, text: "PORQUE CR" },
						{ chord: "Fa", text: "ISTO" },
					],
				},
			],
		},
	],
	chords: ["La-", "La7", "Fa"],
};

describe("SongSheet", () => {
	afterEach(() => {
		cleanup();
	});

	it("renders title and subtitle", () => {
		render(
			<SongSheet
				title="A la víctima pascual"
				subtitle="Secuencia de Pascua"
				ast={sampleAST}
			/>,
		);

		expect(screen.getByText("A la víctima pascual")).toBeDefined();
		expect(screen.getByText("Secuencia de Pascua")).toBeDefined();
	});

	it("renders capo indicator", () => {
		render(
			<SongSheet
				title="Test"
				ast={sampleAST}
			/>,
		);

		expect(screen.getByText("Cejilla 5º traste")).toBeDefined();
	});

	it("renders chord names above lyrics", () => {
		render(
			<SongSheet
				title="Test"
				ast={sampleAST}
			/>,
		);

		expect(screen.getByText("La-")).toBeDefined();
		expect(screen.getByText("La7")).toBeDefined();
		expect(screen.getByText("Fa")).toBeDefined();
	});

	it("renders two columns split at columnBreak", () => {
		const { container } = render(
			<SongSheet
				title="Test"
				ast={sampleAST}
			/>,
		);

		const columns = container.querySelectorAll(".column");
		expect(columns.length).toBe(2);
	});

	it("renders timecode as data attribute on voice paragraphs", () => {
		const { container } = render(
			<SongSheet
				title="Test"
				ast={sampleAST}
			/>,
		);

		const voices = container.querySelectorAll("[data-sync-from]");
		expect(voices.length).toBe(2);
		expect(voices[0].getAttribute("data-sync-from")).toBe("00:00.00");
	});
});
