import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import MiniSearch from "minisearch";
import { normalize } from "../src/lib/normalize";

type CantoDoc = {
	slug: string;
	title: string;
	subtitle: string | null;
	category: string | null;
	tags: string[];
	audioSrc: string | null;
	ast: {
		sections: Array<{
			lines: Array<{
				segments: Array<{ text: string }>;
			}>;
		}>;
	};
};

function extractLyrics(ast: CantoDoc["ast"]): string {
	return ast.sections
		.flatMap((s) => s.lines.map((l) => l.segments.map((seg) => seg.text).join("")))
		.join(" ");
}

async function main() {
	// Import the generated content-collections data
	const { default: allCantos } = (await import(
		"../.content-collections/generated/allCantos.js"
	)) as { default: CantoDoc[] };

	console.log(`Building search index for ${allCantos.length} songs...`);

	const miniSearch = new MiniSearch({
		fields: ["title", "subtitle", "lyrics", "tags"],
		storeFields: [],
		processTerm: (term) => normalize(term),
	});

	const documents = allCantos.map((canto) => ({
		id: canto.slug,
		title: canto.title,
		subtitle: canto.subtitle ?? "",
		lyrics: extractLyrics(canto.ast),
		tags: canto.tags.join(" "),
	}));

	miniSearch.addAll(documents);

	const meta = allCantos.map((canto) => ({
		id: canto.slug,
		title: canto.title,
		subtitle: canto.subtitle,
		category: canto.category,
		tags: canto.tags,
		hasAudio: canto.audioSrc !== null,
	}));

	const indexJson = JSON.stringify(miniSearch);
	const version = createHash("sha256")
		.update(indexJson)
		.digest("hex")
		.slice(0, 8);

	const output = JSON.stringify({ version, index: JSON.parse(indexJson), meta });

	const outPath = resolve(import.meta.dirname, "../dist/client/search-index.json");
	writeFileSync(outPath, output);

	const sizeKB = (Buffer.byteLength(output) / 1024).toFixed(1);
	console.log(`Written search-index.json (${sizeKB} KB, version: ${version})`);
}

main().catch((err) => {
	console.error("Failed to build search index:", err);
	process.exit(1);
});
