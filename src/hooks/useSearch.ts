import { useMemo, useState } from "react";
import type { CantoAST } from "../lib/chordpro";
import { normalize } from "../lib/normalize";

export type CantoEntry = {
	slug: string;
	title: string;
	subtitle: string | null;
	category: string | null;
	tags: string[];
	audioSrc: string | null;
	ast: CantoAST;
};

/**
 * Extract plain lyrics text from AST
 */
function extractLyrics(ast: CantoAST): string {
	return ast.sections
		.flatMap((s) =>
			s.lines.map((l) => l.segments.map((seg) => seg.text).join("")),
		)
		.join(" ");
}

/**
 * Bigram similarity (Dice coefficient) — returns 0..1
 * Good for fuzzy matching short strings like titles
 */
function bigrams(str: string): Set<string> {
	const s = new Set<string>();
	for (let i = 0; i < str.length - 1; i++) {
		s.add(str.slice(i, i + 2));
	}
	return s;
}

function bigramSimilarity(a: string, b: string): number {
	const bg1 = bigrams(a);
	const bg2 = bigrams(b);
	if (bg1.size === 0 && bg2.size === 0) return 1;
	if (bg1.size === 0 || bg2.size === 0) return 0;
	let intersection = 0;
	for (const bg of bg1) {
		if (bg2.has(bg)) intersection++;
	}
	return (2 * intersection) / (bg1.size + bg2.size);
}

type ScoredEntry = CantoEntry & { score: number };

/**
 * Score a canto against a search query.
 * Returns 0 if no match, higher = better match.
 *
 * Scoring:
 *   - Exact title match: 100
 *   - Title starts with query: 80
 *   - Title contains query: 60
 *   - Subtitle contains query: 40
 *   - Lyrics contain query: 20
 *   - Fuzzy title match (bigram > 0.4): 10..50 scaled by similarity
 *   - All words in query found in searchable text: 30
 */
function scoreCanto(canto: CantoEntry, query: string): number {
	const q = normalize(query);
	if (q.length === 0) return 0;

	const title = normalize(canto.title);
	const subtitle = normalize(canto.subtitle ?? "");
	const lyrics = normalize(extractLyrics(canto.ast));
	const all = `${title} ${subtitle} ${lyrics}`;

	// Exact title match
	if (title === q) return 100;

	// Title starts with query
	if (title.startsWith(q)) return 80;

	// Title contains query
	if (title.includes(q)) return 60;

	// Subtitle contains query
	if (subtitle.includes(q)) return 40;

	// All query words found in combined text
	const words = q.split(/\s+/).filter((w) => w.length > 1);
	if (words.length > 1) {
		const allFound = words.every((w) => all.includes(w));
		if (allFound) return 30;
	}

	// Lyrics contain query
	if (lyrics.includes(q)) return 20;

	// Fuzzy match on title (bigram similarity)
	const similarity = bigramSimilarity(q, title);
	if (similarity > 0.4) return 10 + similarity * 40;

	// Fuzzy match on individual words against title words
	if (words.length >= 1) {
		const titleWords = title.split(/\s+/);
		let maxWordSim = 0;
		for (const qw of words) {
			for (const tw of titleWords) {
				const sim = bigramSimilarity(qw, tw);
				if (sim > maxWordSim) maxWordSim = sim;
			}
		}
		if (maxWordSim > 0.5) return 5 + maxWordSim * 20;
	}

	return 0;
}

const MIN_SCORE = 5;
const MAX_RESULTS = 20;

export function filterCantos(
	cantos: CantoEntry[],
	query: string,
): ScoredEntry[] {
	const q = query.trim();
	if (q === "") return [];

	const scored: ScoredEntry[] = [];
	for (const canto of cantos) {
		const score = scoreCanto(canto, q);
		if (score >= MIN_SCORE) {
			scored.push({ ...canto, score });
		}
	}

	scored.sort((a, b) => b.score - a.score);
	return scored.slice(0, MAX_RESULTS);
}

export function useSearch(cantos: CantoEntry[]) {
	const [query, setQuery] = useState("");

	const results = useMemo(() => filterCantos(cantos, query), [cantos, query]);

	return { query, setQuery, results };
}
