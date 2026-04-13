import { createFileRoute } from "@tanstack/react-router";
import { allCantos } from "content-collections";
import { CommandPaletteInline } from "../components/CommandPalette";
import type { CantoEntry } from "../hooks/useSearch";

const siteJsonLd = {
	"@context": "https://schema.org",
	"@type": "WebSite",
	name: "Resucitó",
	description:
		"Cantos para las comunidades neocatecumenales. Letras y acordes.",
	url: "https://resucito.co",
	inLanguage: "es",
	potentialAction: {
		"@type": "SearchAction",
		target: {
			"@type": "EntryPoint",
			urlTemplate: "https://resucito.co/?q={search_term_string}",
		},
		"query-input": "required name=search_term_string",
	},
};

export const Route = createFileRoute("/")({
	staticData: {
		prerender: true,
	},
	head: () => ({
		meta: [
			{ title: "Resucitó — Cantos del Camino Neocatecumenal" },
			{
				name: "description",
				content:
					"Cantos para las comunidades neocatecumenales. Letras, acordes y audio. Resucitó XX Edición.",
			},
			{
				property: "og:title",
				content: "Resucitó — Cantos del Camino Neocatecumenal",
			},
			{
				property: "og:description",
				content:
					"Cantos para las comunidades neocatecumenales. Letras, acordes y audio.",
			},
			{ property: "og:type", content: "website" },
		],
	}),
	component: HomePage,
});

function HomePage() {
	const cantos = allCantos as CantoEntry[];

	return (
		<main className="flex min-h-screen flex-col items-center justify-center px-4">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
			/>
			<h1 className="mb-2 text-5xl font-bold uppercase tracking-tight text-red-600">
				Resucitó
			</h1>
			<img
				src="/resucito.png"
				alt="Cantos del camino neocatecumenal"
				className="mb-8 h-10 w-auto"
			/>
			<CommandPaletteInline cantos={cantos} />
		</main>
	);
}
