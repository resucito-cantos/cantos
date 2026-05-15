// Dev-only plugin that serves /search-index.json by building the MiniSearch
// index in memory. In production builds the same index is emitted to
// dist/client/search-index.json by the `build-search-index` plugin instead.

// Dev-only plugin that serves /search-index.json by building the MiniSearch
// index in memory. In production builds the same index is emitted to
// dist/client/search-index.json by the `build-search-index` plugin instead.
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import MiniSearch from "minisearch";
import type { Plugin, ViteDevServer } from "vite";
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
		.flatMap((s) =>
			s.lines.map((l) => l.segments.map((seg) => seg.text).join("")),
		)
		.join(" ");
}

async function buildIndexJson(server: ViteDevServer): Promise<string> {
	const mod = (await server.ssrLoadModule(
		resolve(
			server.config.root,
			".content-collections/generated/allCantos.js",
		),
	)) as { default: CantoDoc[] };
	const allCantos = mod.default;

	const miniSearch = new MiniSearch({
		fields: ["title", "subtitle", "lyrics", "tags"],
		storeFields: [],
		processTerm: (term) => normalize(term),
	});

	miniSearch.addAll(
		allCantos.map((c) => ({
			id: c.slug,
			title: c.title,
			subtitle: c.subtitle ?? "",
			lyrics: extractLyrics(c.ast),
			tags: c.tags.join(" "),
		})),
	);

	const meta = allCantos.map((c) => ({
		id: c.slug,
		title: c.title,
		subtitle: c.subtitle,
		category: c.category,
		tags: c.tags,
		hasAudio: c.audioSrc !== null,
	}));

	const indexJson = JSON.stringify(miniSearch);
	const version = createHash("sha256")
		.update(indexJson)
		.digest("hex")
		.slice(0, 8);

	return JSON.stringify({ version, index: JSON.parse(indexJson), meta });
}

export function devSearchIndexPlugin(): Plugin {
	return {
		name: "dev-search-index",
		apply: "serve",
		configureServer(server) {
			server.middlewares.use("/search-index.json", async (_req, res) => {
				try {
					const body = await buildIndexJson(server);
					res.setHeader("Content-Type", "application/json");
					res.setHeader("Cache-Control", "no-store");
					res.end(body);
				} catch (err) {
					console.error("[dev-search-index]", err);
					res.statusCode = 500;
					res.end(String((err as Error).message || err));
				}
			});
		},
	};
}
