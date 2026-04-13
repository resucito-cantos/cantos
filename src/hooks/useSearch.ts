import { useMemo, useState } from "react";
import type { CantoAST } from "../lib/chordpro";

export type CantoEntry = {
	slug: string;
	title: string;
	subtitle: string | null;
	category: string | null;
	tags: string[];
	audioSrc: string | null;
	ast: CantoAST;
};

function extractLyrics(ast: CantoAST): string {
	return ast.sections
		.flatMap((s) =>
			s.lines.map((l) => l.segments.map((seg) => seg.text).join("")),
		)
		.join(" ");
}

export function filterCantos(
	cantos: CantoEntry[],
	query: string,
): CantoEntry[] {
	const q = query.trim().toLowerCase();
	if (q === "") return [];

	return cantos.filter((c) => {
		const searchable = [
			c.title,
			c.subtitle ?? "",
			c.category ?? "",
			extractLyrics(c.ast),
		]
			.join(" ")
			.toLowerCase();

		return searchable.includes(q);
	});
}

export function useSearch(cantos: CantoEntry[]) {
	const [query, setQuery] = useState("");

	const results = useMemo(() => filterCantos(cantos, query), [cantos, query]);

	return { query, setQuery, results };
}
