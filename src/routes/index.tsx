import { createFileRoute } from "@tanstack/react-router";
import { allCantos } from "content-collections";
import { CommandPaletteInline } from "../components/CommandPalette";
import type { CantoEntry } from "../hooks/useSearch";

export const Route = createFileRoute("/")({
	staticData: {
		prerender: true,
	},
	component: HomePage,
});

function HomePage() {
	const cantos = allCantos as CantoEntry[];

	return (
		<main className="flex min-h-screen flex-col items-center justify-center px-4">
			<h1 className="mb-8 text-4xl font-bold text-red-600">Resucitó</h1>
			<CommandPaletteInline cantos={cantos} />
		</main>
	);
}
