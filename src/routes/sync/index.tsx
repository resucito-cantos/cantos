import { createFileRoute, Link } from "@tanstack/react-router";
import { allCantos } from "content-collections";
import { useMemo, useState } from "react";
import { NotFound } from "../../components/NotFound";
import type { CantoEntry } from "../../hooks/useSearch";
import { normalize } from "../../lib/normalize";

export const Route = createFileRoute("/sync/")({
	staticData: {
		prerender: false,
	},
	component: import.meta.env.DEV ? SyncList : NotFound,
	notFoundComponent: NotFound,
});

type Row = {
	slug: string;
	title: string;
	hasAudio: boolean;
	total: number;
	synced: number;
	normalizedTitle: string;
};

function countSync(canto: CantoEntry): { total: number; synced: number } {
	let total = 0;
	let synced = 0;
	for (const s of canto.ast.sections) {
		for (const l of s.lines) {
			if (l.timecode == null) continue;
			total++;
			if (l.timecode !== "00:00.00" && l.timecode !== "00:00.000") synced++;
		}
	}
	return { total, synced };
}

function SyncList() {
	const [query, setQuery] = useState("");

	const rows: Row[] = useMemo(
		() =>
			(allCantos as CantoEntry[])
				.map((c) => {
					const { total, synced } = countSync(c);
					return {
						slug: c.slug,
						title: c.title,
						hasAudio: !!c.audioSrc,
						total,
						synced,
						normalizedTitle: normalize(c.title),
					};
				})
				.sort((a, b) => a.title.localeCompare(b.title, "es")),
		[],
	);

	const filtered = useMemo(() => {
		const q = normalize(query.trim());
		if (!q) return rows;
		return rows.filter((r) => r.normalizedTitle.includes(q));
	}, [rows, query]);

	return (
		<main className="mx-auto max-w-3xl px-6 py-10">
			<header className="mb-6">
				<p className="text-xs uppercase tracking-wider text-gray-400">
					dev tool
				</p>
				<h1 className="text-3xl font-bold text-gray-900">Lyric sync</h1>
				<p className="mt-2 text-gray-600">
					Pick a song, play the audio, click each lyric line at the moment it
					starts. Cmd/Ctrl+S to save.
				</p>
			</header>

			<input
				type="search"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder="Search…"
				autoFocus
				className="mb-4 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-gray-400"
			/>

			{filtered.length === 0 ? (
				<p className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
					No songs match "{query}".
				</p>
			) : (
				<ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
					{filtered.map((row) => {
						const disabled = !row.hasAudio;
						const pct = row.total
							? Math.round((row.synced / row.total) * 100)
							: 0;
						const content = (
							<div className="flex items-center justify-between gap-4 px-4 py-3">
								<div className="min-w-0">
									<p className="truncate text-sm font-medium text-gray-900">
										{row.title}
									</p>
									<p className="text-xs text-gray-500">
										{disabled ? "no audio" : `${row.synced}/${row.total} synced`}
									</p>
								</div>
								<div className="flex items-center gap-3">
									{!disabled && (
										<div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
											<div
												className="h-full bg-green-500 transition-all"
												style={{ width: `${pct}%` }}
											/>
										</div>
									)}
								</div>
							</div>
						);
						return (
							<li key={row.slug}>
								{disabled ? (
									<div className="cursor-not-allowed opacity-50">{content}</div>
								) : (
									<Link
										to="/sync/$slug"
										params={{ slug: row.slug }}
										className="block no-underline hover:bg-gray-50"
									>
										{content}
									</Link>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</main>
	);
}
