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

function CantoPage() {
	const canto = Route.useLoaderData();
	const { chordsVisible } = useChordsVisible();

	return (
		<main
			className={`pb-24 ${canto.category?.toLowerCase() === "catecumenado" ? "bg-[#cdedf5]" : ""}`}
		>
			<SongSheet
				title={canto.title}
				subtitle={canto.subtitle}
				ast={canto.ast}
			/>
			{chordsVisible && <ChordDiagrams chords={canto.ast.chords} />}
			{canto.audioSrc && <Player src={canto.audioSrc} />}
		</main>
	);
}
