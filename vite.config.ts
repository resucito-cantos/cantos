import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import contentCollections from "@content-collections/vite";
import { lyricSyncPlugin } from "./scripts/vite-plugin-lyric-sync";

const cantoSlugs = readdirSync("content/cantos");
const cantoPages = cantoSlugs.map((slug) => ({
	path: `/cantos/${slug}`,
}));

const config = defineConfig({
	test: {
		environment: "jsdom",
	},
	plugins: [
		{
			name: "build-search-index",
			apply: "build",
			closeBundle: {
				sequential: true,
				order: "post",
				async handler() {
					const { execSync } = await import("node:child_process");
					execSync("npx tsx scripts/build-search-index.ts", {
						stdio: "inherit",
						cwd: import.meta.dirname,
					});
				},
			},
		},
		{
			name: "build-sw",
			apply: "build",
			closeBundle: {
				sequential: true,
				order: "post",
				async handler() {
					const { build } = await import("vite");
					await build({
						configFile: false,
						build: {
							lib: {
								entry: resolve(import.meta.dirname, "src/sw.ts"),
								formats: ["es"],
								fileName: () => "sw.js",
							},
							outDir: "dist/client",
							emptyOutDir: false,
						},
					});
				},
			},
		},
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
		lyricSyncPlugin(),
	],
});

export default config;
