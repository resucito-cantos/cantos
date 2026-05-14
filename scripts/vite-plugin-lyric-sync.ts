// Dev-only Vite plugin that backs the in-app lyric-sync tool.
//
// Endpoints (mounted under /api/sync):
//   GET  /api/sync/:slug   → { lines: [{ idx, raw, time }] } from the chordpro block
//   POST /api/sync/:slug   → body: { lines: [{ idx, time }] } → patches the markdown file
//
// Only loaded with `apply: "serve"` so it never touches the production build.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import type { Plugin } from "vite";

const CANTOS_DIR = resolve(process.cwd(), "content/cantos");
const TIME_RE = /^\[(\d{1,2}):(\d{2})\.(\d{1,3})\]\s*/;

function parseChordpro(slug: string) {
	const path = join(CANTOS_DIR, slug, "index.md");
	if (!existsSync(path)) return null;
	const raw = readFileSync(path, "utf8");
	const fm = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!fm) return null;
	const titleMatch = fm[1].match(/^title:\s*"?([^"\n]+?)"?\s*$/m);
	const audioMatch = fm[1].match(/src:\s*([^\s\n]+\.mp3)/);
	const body = fm[2];

	const start = body.indexOf("```chordpro");
	if (start === -1) return null;
	const afterFence = body.indexOf("\n", start) + 1;
	const end = body.indexOf("```", afterFence);
	const cp = body.slice(afterFence, end);

	const lines = cp.split("\n").map((raw, idx) => {
		const m = raw.match(TIME_RE);
		if (m) {
			const fracStr = m[3].padEnd(3, "0").slice(0, 3);
			return {
				idx,
				raw,
				time: +m[1] * 60 + +m[2] + +fracStr / 1000,
				isLyric: true,
			};
		}
		return { idx, raw, time: null, isLyric: false };
	});

	return {
		slug,
		title: titleMatch ? titleMatch[1].trim() : slug,
		audioUrl: audioMatch ? `/audio/${slug}/${audioMatch[1].trim()}` : null,
		lines,
	};
}

function formatTime(seconds: number): string {
	const total = Math.max(0, Math.round(seconds * 1000));
	const m = Math.floor(total / 60000);
	const s = Math.floor((total % 60000) / 1000);
	const ms = total % 1000;
	const pad = (n: number, w: number) => String(n).padStart(w, "0");
	return `${pad(m, 2)}:${pad(s, 2)}.${pad(ms, 3)}`;
}

function patchChordpro(slug: string, updates: { idx: number; time: number }[]) {
	const path = join(CANTOS_DIR, slug, "index.md");
	if (!existsSync(path)) throw new Error(`Unknown slug: ${slug}`);
	const raw = readFileSync(path, "utf8");
	const fm = raw.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
	if (!fm) throw new Error("No frontmatter");
	const body = fm[2];

	const start = body.indexOf("```chordpro");
	if (start === -1) throw new Error("No chordpro block");
	const afterFence = body.indexOf("\n", start) + 1;
	const end = body.indexOf("```", afterFence);

	const before = body.slice(0, afterFence);
	const cp = body.slice(afterFence, end);
	const after = body.slice(end);

	const lines = cp.split("\n");
	for (const { idx, time } of updates) {
		const orig = lines[idx];
		if (orig == null) continue;
		const m = orig.match(TIME_RE);
		if (!m) continue;
		lines[idx] = `[${formatTime(time)}] ${orig.slice(m[0].length)}`;
	}

	writeFileSync(path, fm[1] + before + lines.join("\n") + after);
}

async function readBody(req: import("http").IncomingMessage): Promise<string> {
	const chunks: Buffer[] = [];
	for await (const c of req) chunks.push(c as Buffer);
	return Buffer.concat(chunks).toString("utf8");
}

export function lyricSyncPlugin(): Plugin {
	return {
		name: "lyric-sync-api",
		apply: "serve",
		configureServer(server) {
			server.middlewares.use("/api/sync", async (req, res) => {
				try {
					const url = new URL(req.url ?? "/", "http://localhost");
					const slug = decodeURIComponent(url.pathname.replace(/^\//, ""));
					if (!slug) {
						res.statusCode = 400;
						return res.end("missing slug");
					}

					if (req.method === "GET") {
						const data = parseChordpro(slug);
						if (!data) {
							res.statusCode = 404;
							return res.end("not found");
						}
						res.setHeader("Content-Type", "application/json");
						return res.end(JSON.stringify(data));
					}

					if (req.method === "POST") {
						const body = JSON.parse(await readBody(req));
						patchChordpro(slug, body.lines || []);
						res.setHeader("Content-Type", "application/json");
						return res.end(JSON.stringify({ ok: true }));
					}

					res.statusCode = 405;
					res.end("method not allowed");
				} catch (err) {
					console.error("[lyric-sync]", err);
					res.statusCode = 500;
					res.end(String((err as Error).message || err));
				}
			});
		},
	};
}
