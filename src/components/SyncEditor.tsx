import { Link } from "@tanstack/react-router";
import { Pause, Play, RotateCcw, RotateCw, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ServerLine = {
	idx: number;
	raw: string;
	time: number | null;
	isLyric: boolean;
};

type SongData = {
	slug: string;
	title: string;
	audioUrl: string | null;
	lines: ServerLine[];
};

const TIME_RE = /^\[(\d{1,2}):(\d{2})\.(\d{1,3})\]\s*/;

function formatTime(seconds: number | null): string {
	if (seconds == null) return "--:--.---";
	const total = Math.max(0, Math.round(seconds * 1000));
	const m = Math.floor(total / 60000);
	const s = Math.floor((total % 60000) / 1000);
	const ms = total % 1000;
	const pad = (n: number, w: number) => String(n).padStart(w, "0");
	return `${pad(m, 2)}:${pad(s, 2)}.${pad(ms, 3)}`;
}

function lineWithoutPrefix(raw: string): string {
	const m = raw.match(TIME_RE);
	return m ? raw.slice(m[0].length) : raw;
}

type State = {
	original: SongData;
	times: Map<number, number>; // idx → seconds (only for lyric lines; absent = unchanged)
};

export default function SyncEditor({ slug }: { slug: string }) {
	const [state, setState] = useState<State | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [saving, setSaving] = useState(false);
	const [saveMsg, setSaveMsg] = useState<string | null>(null);
	const [history, setHistory] = useState<State[]>([]);

	const audioRef = useRef<HTMLAudioElement>(null);

	// Load song data
	useEffect(() => {
		let cancelled = false;
		fetch(`/api/sync/${slug}`)
			.then(async (r) => {
				if (!r.ok) throw new Error(`load failed: ${r.status}`);
				return r.json() as Promise<SongData>;
			})
			.then((data) => {
				if (cancelled) return;
				setState({ original: data, times: new Map() });
				setHistory([]);
			})
			.catch((e: Error) => setError(e.message));
		return () => {
			cancelled = true;
		};
	}, [slug]);

	const lyricIdxToOrdinal = useMemo(() => {
		const map = new Map<number, number>();
		if (!state) return map;
		let n = 0;
		for (const l of state.original.lines) {
			if (l.isLyric) {
				map.set(l.idx, n);
				n++;
			}
		}
		return map;
	}, [state]);

	// Effective time for a line (override → original)
	const effectiveTime = useCallback(
		(line: ServerLine): number | null => {
			if (!state) return null;
			if (!line.isLyric) return null;
			const override = state.times.get(line.idx);
			return override ?? line.time ?? null;
		},
		[state],
	);

	// Snapshot state into history before mutation
	const pushHistory = useCallback(() => {
		setHistory((h) => {
			if (!state) return h;
			return [
				...h,
				{ original: state.original, times: new Map(state.times) },
			].slice(-50);
		});
	}, [state]);

	const setTime = useCallback(
		(idx: number, time: number) => {
			pushHistory();
			setState((s) =>
				s ? { ...s, times: new Map(s.times).set(idx, time) } : s,
			);
		},
		[pushHistory],
	);

	const undo = useCallback(() => {
		setHistory((h) => {
			if (h.length === 0) return h;
			const prev = h[h.length - 1];
			setState(prev);
			return h.slice(0, -1);
		});
	}, []);

	// audio handlers
	const togglePlay = useCallback(() => {
		const a = audioRef.current;
		if (!a) return;
		if (a.paused) {
			a.play();
			setIsPlaying(true);
		} else {
			a.pause();
			setIsPlaying(false);
		}
	}, []);

	const seekBy = useCallback((delta: number) => {
		const a = audioRef.current;
		if (!a) return;
		a.currentTime = Math.max(0, Math.min(a.duration || 0, a.currentTime + delta));
	}, []);

	const seekTo = useCallback((seconds: number) => {
		const a = audioRef.current;
		if (!a) return;
		a.currentTime = seconds;
	}, []);

	useEffect(() => {
		const a = audioRef.current;
		if (!a) return;
		const onTime = () => setCurrentTime(a.currentTime);
		const onEnd = () => setIsPlaying(false);
		a.addEventListener("timeupdate", onTime);
		a.addEventListener("ended", onEnd);
		return () => {
			a.removeEventListener("timeupdate", onTime);
			a.removeEventListener("ended", onEnd);
		};
	}, [state]);

	// Save
	const save = useCallback(async () => {
		if (!state || state.times.size === 0) return;
		setSaving(true);
		setSaveMsg(null);
		try {
			const lines = Array.from(state.times.entries()).map(([idx, time]) => ({
				idx,
				time,
			}));
			const res = await fetch(`/api/sync/${slug}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ lines }),
			});
			if (!res.ok) throw new Error(`save failed: ${res.status}`);
			// Reload to flush server-side state into the baseline
			const reload = await fetch(`/api/sync/${slug}`).then(
				(r) => r.json() as Promise<SongData>,
			);
			setState({ original: reload, times: new Map() });
			setHistory([]);
			setSaveMsg("Saved");
			setTimeout(() => setSaveMsg(null), 2000);
		} catch (e) {
			setSaveMsg(`Error: ${(e as Error).message}`);
		} finally {
			setSaving(false);
		}
	}, [slug, state]);

	// Keyboard shortcuts
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
				return;
			}
			const cmd = e.metaKey || e.ctrlKey;
			if (cmd && e.key === "s") {
				e.preventDefault();
				save();
				return;
			}
			if (cmd && e.key === "z") {
				e.preventDefault();
				undo();
				return;
			}
			switch (e.code) {
				case "Space":
					e.preventDefault();
					togglePlay();
					break;
				case "ArrowLeft":
					e.preventDefault();
					seekBy(e.shiftKey ? -10 : -2);
					break;
				case "ArrowRight":
					e.preventDefault();
					seekBy(e.shiftKey ? 10 : 2);
					break;
			}
		}
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [save, undo, togglePlay, seekBy]);

	// Current active line (the latest line whose time ≤ currentTime)
	const activeIdx = useMemo(() => {
		if (!state) return -1;
		let active = -1;
		for (const line of state.original.lines) {
			if (!line.isLyric) continue;
			const t = effectiveTime(line);
			if (t == null) continue;
			if (t <= currentTime) active = line.idx;
		}
		return active;
	}, [state, currentTime, effectiveTime]);

	if (error) {
		return (
			<main className="mx-auto max-w-3xl px-6 py-10">
				<p className="text-red-600">Error: {error}</p>
				<Link to="/sync" className="text-blue-600 underline">
					← back to list
				</Link>
			</main>
		);
	}

	if (!state) {
		return (
			<main className="mx-auto max-w-3xl px-6 py-10 text-gray-500">
				Loading…
			</main>
		);
	}

	const dirty = state.times.size;

	return (
		<main className="mx-auto max-w-3xl px-6 pt-6 pb-40">
			<header className="mb-6 flex items-baseline justify-between">
				<div>
					<Link
						to="/sync"
						className="text-xs uppercase tracking-wider text-gray-400 no-underline hover:text-gray-600"
					>
						← all songs
					</Link>
					<h1 className="mt-1 text-2xl font-bold text-gray-900">
						{state.original.title}
					</h1>
				</div>
				<div className="flex items-center gap-3">
					{saveMsg && (
						<span
							className={`text-sm ${
								saveMsg.startsWith("Error") ? "text-red-600" : "text-green-600"
							}`}
						>
							{saveMsg}
						</span>
					)}
					<button
						type="button"
						onClick={save}
						disabled={dirty === 0 || saving}
						className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
					>
						<Save size={14} />
						{saving ? "Saving…" : `Save${dirty ? ` (${dirty})` : ""}`}
					</button>
				</div>
			</header>

			<pre className="space-y-0.5 font-mono text-[13px] leading-relaxed">
				{state.original.lines.map((line) => {
					if (!line.isLyric) {
						return (
							<div
								key={line.idx}
								className="px-2 py-0.5 text-gray-400"
							>
								{line.raw || " "}
							</div>
						);
					}
					const t = effectiveTime(line);
					const isActive = line.idx === activeIdx;
					const isDirty = state.times.has(line.idx);
					const ord = lyricIdxToOrdinal.get(line.idx) ?? 0;
					return (
						<div
							key={line.idx}
							className={`group flex items-start gap-3 rounded px-2 py-1 transition ${
								isActive ? "bg-yellow-100" : "hover:bg-gray-50"
							}`}
						>
							<span className="w-7 select-none pt-0.5 text-right text-xs text-gray-300">
								{ord + 1}
							</span>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									if (t != null) seekTo(t);
								}}
								disabled={t == null}
								className={`w-24 flex-none rounded px-1.5 py-0.5 text-left font-mono text-xs ${
									isDirty
										? "bg-green-100 text-green-700"
										: t != null && t > 0
											? "bg-gray-100 text-gray-600"
											: "text-gray-300"
								}`}
								title="Seek to this timestamp"
							>
								{formatTime(t)}
							</button>
							<button
								type="button"
								onClick={() => setTime(line.idx, audioRef.current?.currentTime ?? 0)}
								className="flex-1 cursor-pointer rounded px-1 py-0.5 text-left text-gray-800 hover:bg-blue-50 hover:text-blue-700"
								title="Set this line's timestamp to current play position"
							>
								{lineWithoutPrefix(line.raw) || " "}
							</button>
						</div>
					);
				})}
			</pre>

			{/* Fixed audio bar */}
			<div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-3 shadow-lg">
				<div className="mx-auto flex max-w-3xl items-center gap-3">
					<button
						type="button"
						onClick={() => seekBy(-2)}
						className="flex size-8 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
						title="-2s (←)"
					>
						<RotateCcw size={14} />
					</button>
					<button
						type="button"
						onClick={togglePlay}
						className="flex size-10 items-center justify-center rounded-lg bg-gray-900 text-white"
						title="Play/Pause (Space)"
					>
						{isPlaying ? <Pause size={18} /> : <Play size={18} />}
					</button>
					<button
						type="button"
						onClick={() => seekBy(2)}
						className="flex size-8 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
						title="+2s (→)"
					>
						<RotateCw size={14} />
					</button>
					<span className="font-mono text-sm tabular-nums text-gray-700">
						{formatTime(currentTime)}
					</span>
					{state.original.audioUrl ? (
						<audio
							ref={audioRef}
							src={state.original.audioUrl}
							preload="metadata"
							controls
							className="flex-1"
						/>
					) : (
						<span className="flex-1 text-sm text-gray-500">no audio</span>
					)}
				</div>
			</div>
		</main>
	);
}
