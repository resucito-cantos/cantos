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
		resources: z
			.array(
				z.object({
					name: z.string(),
					src: z.string(),
				}),
			)
			.optional(),
	}),
});

export default defineConfig({
	collections: [cantos],
});
