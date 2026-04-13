import { readdirSync } from "node:fs";
import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import contentCollections from "@content-collections/vite";

const cantoSlugs = readdirSync("content/cantos");
const cantoPages = cantoSlugs.map((slug) => ({
	path: `/cantos/${slug}`,
}));

const config = defineConfig({
	test: {
		environment: "jsdom",
	},
	plugins: [
		contentCollections(),
		devtools(),
		tsconfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
		tanstackStart({
			pages: [{ path: "/" }, ...cantoPages],
			prerender: {
				enabled: true,
			},
		}),
		viteReact({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
	],
});

export default config;
