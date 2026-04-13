import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";

const cantos = defineCollection({
	name: "cantos",
	directory: "content/cantos",
	include: "**/index.md",
	schema: z.object({
		title: z.string(),
		subtitle: z.string().optional(),
		category: z.string().optional(),
		tags: z.array(z.string()).optional(),
		content: z.string(),
		resources: z
			.array(
				z.object({
					name: z.string(),
					src: z.string(),
				}),
			)
			.optional(),
	}),
	transform: async (doc) => {
		const { parseChordPro } = await import("./src/lib/chordpro");

		// Extract ChordPro content from markdown fenced code block
		const chordproMatch = doc.content.match(
			/```chordpro\n([\s\S]*?)```/,
		);
		const chordproRaw = chordproMatch ? chordproMatch[1] : "";
		const ast = parseChordPro(chordproRaw);

		// Find audio resource
		const audioResource = doc.resources?.find((r) => r.name === "audio");
		const audioSrc = audioResource
			? `/audio/${doc._meta.path}/${audioResource.src}`
			: null;

		return {
			slug: doc._meta.path,
			title: doc.title,
			subtitle: doc.subtitle ?? null,
			category: doc.category ?? null,
			tags: doc.tags ?? [],
			audioSrc,
			ast,
		};
	},
});

export default defineConfig({
	content: [cantos],
});
