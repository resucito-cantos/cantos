import { createFileRoute } from "@tanstack/react-router";
import { allCantos } from "content-collections";
import { SearchBar } from "../components/SearchBar";
import { useSearch } from "../hooks/useSearch";
import type { CantoEntry } from "../hooks/useSearch";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
	const cantos = allCantos as CantoEntry[];
	const { query, setQuery, results } = useSearch(cantos);

	return (
		<main className="flex min-h-screen flex-col items-center justify-center px-4">
			<h1 className="mb-8 text-4xl font-bold text-red-600">Resucitó</h1>
			<SearchBar query={query} onQueryChange={setQuery} results={results} />
		</main>
	);
}
