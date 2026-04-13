import { createFileRoute, notFound } from "@tanstack/react-router";
import { allCantos } from "content-collections";
import { ChordDiagrams } from "../../components/ChordDiagram";
import { Player } from "../../components/Player";
import { SongSheet } from "../../components/SongSheet";
import { useChordsVisible } from "../../hooks/useChordsVisible";
import type { CantoEntry } from "../../hooks/useSearch";

export const Route = createFileRoute("/cantos/$slug")({
	staticData: {
		prerender: true,
	},
	loader: ({ params }) => {
		const canto = (allCantos as CantoEntry[]).find(
			(c) => c.slug === params.slug,
		);
		if (!canto) {
			throw notFound();
		}
		return canto;
	},
	head: ({ loaderData }) => ({
		meta: [{ title: `${loaderData.title} — Resucitó` }],
	}),
	component: CantoPage,
});

const CATEGORY_BG: Record<string, string> = {
	precatecumenado: "bg-white",
	catecumenado: "bg-[#cdedf5]",
	"elección": "bg-[#d5f0d5]",
	"litúrgico": "bg-[#fef9c3]",
};

function CantoPage() {
	const canto = Route.useLoaderData();
	const { chordsVisible } = useChordsVisible();
	const bg = CATEGORY_BG[canto.category?.toLowerCase() ?? ""] ?? "bg-white";

	return (
		<main className={`min-h-screen pb-24 ${bg}`}>
			<SongSheet
				title={canto.title}
				subtitle={canto.subtitle}
				ast={canto.ast}
				category={canto.category}
			/>
			{chordsVisible && <ChordDiagrams chords={canto.ast.chords} />}
			{canto.audioSrc && <Player src={canto.audioSrc} />}
		</main>
	);
}
