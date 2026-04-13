import { useEffect, useMemo, useRef, useState } from "react";
import type { CantoAST } from "../lib/chordpro";
import {
	initSearchIndex,
	type SearchEngine,
	type SearchResult,
} from "../lib/search-index";

export type { SearchResult };

export type CantoEntry = {
	slug: string;
	title: string;
	subtitle: string | null;
	category: string | null;
	tags: string[];
	audioSrc: string | null;
	ast: CantoAST;
};

export function useSearch() {
	const [query, setQuery] = useState("");
	const [isReady, setIsReady] = useState(false);
	const engineRef = useRef<SearchEngine | null>(null);

	useEffect(() => {
		let cancelled = false;
		initSearchIndex()
			.then((engine) => {
				if (!cancelled) {
					engineRef.current = engine;
					setIsReady(true);
				}
			})
			.catch(() => {
				// Search won't work but app still functions
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const results = useMemo(() => {
		if (!engineRef.current || !isReady) return [];
		return engineRef.current.search(query);
	}, [query, isReady]);

	return { query, setQuery, results, isReady };
}
