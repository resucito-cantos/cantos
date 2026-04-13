import { createFileRoute, notFound } from "@tanstack/react-router";
import { allCantos } from "content-collections";
import { CheckCircle, Download, Loader2 } from "lucide-react";
import { ChordDiagrams } from "../../components/ChordDiagram";
import { Player } from "../../components/Player";
import { SongSheet } from "../../components/SongSheet";
import { useChordsVisible } from "../../hooks/useChordsVisible";
import { useOfflineAudio } from "../../hooks/useOfflineAudio";
import type { CantoEntry } from "../../hooks/useSearch";
import type { CantoAST } from "../../lib/chordpro";

function extractLyrics(ast: CantoAST): string {
	return ast.sections
		.map((s) =>
			s.lines.map((l) => l.segments.map((seg) => seg.text).join("")).join("\n"),
		)
		.join("\n\n");
}

function buildJsonLd(canto: CantoEntry) {
	const lyrics = extractLyrics(canto.ast);
	const baseUrl = "https://resucito.co";

	return {
		"@context": "https://schema.org",
		"@type": "MusicComposition",
		name: canto.title,
		description: canto.subtitle ?? `Canto del Camino Neocatecumenal`,
		inLanguage: "es",
		genre: "Liturgical music",
		musicalKey: canto.ast.chords[0] ?? undefined,
		lyrics: {
			"@type": "CreativeWork",
			text: lyrics,
			inLanguage: "es",
		},
		...(canto.category && {
			keywords: [
				canto.category,
				...canto.tags,
			].join(", "),
		}),
		...(canto.audioSrc && {
			audio: {
				"@type": "AudioObject",
				contentUrl: `${baseUrl}${canto.audioSrc}`,
				encodingFormat: "audio/mpeg",
			},
		}),
		isPartOf: {
			"@type": "MusicAlbum",
			name: "Resucitó",
			description:
				"Cantos para las comunidades neocatecumenales",
		},
		url: `${baseUrl}/cantos/${canto.slug}`,
	};
}

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
		meta: [
			{ title: `${loaderData.title} — Resucitó` },
			{
				name: "description",
				content: loaderData.subtitle
					? `${loaderData.title} — ${loaderData.subtitle}. Canto del Camino Neocatecumenal.`
					: `${loaderData.title}. Canto del Camino Neocatecumenal con acordes y letra.`,
			},
			{ property: "og:title", content: `${loaderData.title} — Resucitó` },
			{
				property: "og:description",
				content: loaderData.subtitle
					? `${loaderData.title} — ${loaderData.subtitle}`
					: loaderData.title,
			},
			{ property: "og:type", content: "music.song" },
		],
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
	const jsonLd = buildJsonLd(canto);
	const { status, download } = useOfflineAudio(canto.audioSrc);

	return (
		<main className={`min-h-screen pb-24 ${bg}`}>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<SongSheet
				title={canto.title}
				subtitle={canto.subtitle}
				ast={canto.ast}
				category={canto.category}
			/>
			{chordsVisible && <ChordDiagrams chords={canto.ast.chords} />}
			<footer className="song-footer">
				SOLO para uso interno del Camino Neocatecumenal
			</footer>
			{canto.audioSrc && (
				<>
					<Player src={canto.audioSrc} title={canto.title} />
					<DownloadButton status={status} onDownload={download} />
				</>
			)}
		</main>
	);
}

function DownloadButton({
	status,
	onDownload,
}: { status: ReturnType<typeof useOfflineAudio>["status"]; onDownload: () => void }) {
	if (status === "unknown") return null;

	return (
		<button
			type="button"
			onClick={status === "not-cached" || status === "error" ? onDownload : undefined}
			disabled={status === "downloading" || status === "cached"}
			className="fixed bottom-20 right-4 z-50 flex size-10 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-gray-50 disabled:opacity-60"
			aria-label={
				status === "cached"
					? "Disponible sin conexión"
					: status === "downloading"
						? "Descargando..."
						: "Descargar para escuchar sin conexión"
			}
		>
			{status === "cached" && <CheckCircle size={20} className="text-green-600" />}
			{status === "downloading" && <Loader2 size={20} className="animate-spin text-gray-500" />}
			{(status === "not-cached" || status === "error") && (
				<Download size={20} className="text-gray-600" />
			)}
		</button>
	);
}
