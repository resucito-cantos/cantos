import { createFileRoute, Link } from "@tanstack/react-router";
import { allCantos } from "content-collections";
import { MicrophoneIcon, PlayIcon, StopIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CantoEntry } from "../hooks/useSearch";
import { useVoiceRange } from "../hooks/useVoiceRange";
import {
	analyzeFit,
	formatPitch,
	getSongChordRange,
	midiOf,
	pickerOptions,
} from "../lib/voice-range";
import { captureSungPitch } from "../lib/mic-capture";
import { playTone, type ToneHandle } from "../lib/play-tone";

const OPTIONS = pickerOptions();

export const Route = createFileRoute("/tesitura")({
	staticData: { prerender: true },
	head: () => ({
		meta: [{ title: "Mi tesitura — Resucitó" }],
	}),
	component: TesituraPage,
});

type Stage = "idle" | "low-listening" | "low-done" | "high-listening" | "done";

function TesituraPage() {
	const { range, setRange } = useVoiceRange();

	// Manual editing state — only used when not calibrating.
	const [low, setLow] = useState<number>(range?.low ?? midiOf(0, 3));
	const [high, setHigh] = useState<number>(range?.high ?? midiOf(7, 4));

	useEffect(() => {
		if (range) {
			setLow(range.low);
			setHigh(range.high);
		}
	}, [range]);

	// Calibration state
	const [stage, setStage] = useState<Stage>("idle");
	const [capturedLow, setCapturedLow] = useState<number | null>(null);
	const [capturedHigh, setCapturedHigh] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);
	const captureRef = useRef<{ stop: () => void } | null>(null);
	const toneRef = useRef<ToneHandle | null>(null);

	const stopAll = useCallback(() => {
		captureRef.current?.stop();
		captureRef.current = null;
		toneRef.current?.stop();
		toneRef.current = null;
	}, []);

	useEffect(() => () => stopAll(), [stopAll]);

	async function runStage(target: "low" | "high") {
		setError(null);
		stopAll();
		setStage(target === "low" ? "low-listening" : "high-listening");

		// Play a guide tone for context (low Do3 for the low stage, high Sol4
		// for the high stage). The user is meant to extend BEYOND it.
		const guide = target === "low" ? midiOf(0, 3) : midiOf(7, 4);
		toneRef.current = playTone(guide, 1.2);

		// Listen for 5 seconds — the user sings their most comfortable extreme.
		try {
			const handle = captureSungPitch(5000);
			captureRef.current = handle;
			const result = await handle.promise;

			if (!result.dominant) {
				setError("No detectamos voz. Inténtalo de nuevo en un sitio más silencioso.");
				setStage(target === "low" ? "idle" : "low-done");
				return;
			}

			if (target === "low") {
				setCapturedLow(result.lowest);
				setStage("low-done");
			} else {
				setCapturedHigh(result.highest);
				setStage("done");
			}
		} catch (e) {
			setError((e as Error).message || "Error al acceder al micrófono.");
			setStage("idle");
		}
	}

	function previewTone(midi: number) {
		toneRef.current?.stop();
		toneRef.current = playTone(midi, 1.5);
	}

	function saveCalibrated() {
		if (capturedLow == null || capturedHigh == null) return;
		const low = Math.min(capturedLow, capturedHigh);
		const high = Math.max(capturedLow, capturedHigh);
		setRange({ low, high });
		setStage("idle");
		setCapturedLow(null);
		setCapturedHigh(null);
	}

	function saveManual() {
		if (low >= high) {
			setError("La nota alta debe ser mayor que la baja.");
			return;
		}
		setError(null);
		setRange({ low, high });
	}

	const listening = stage === "low-listening" || stage === "high-listening";

	return (
		<main className="mx-auto max-w-2xl px-6 py-10">
			<header className="mb-6">
				<Link
					to="/"
					className="text-xs uppercase tracking-wider text-gray-400 no-underline hover:text-gray-600"
				>
					← inicio
				</Link>
				<h1 className="mt-2 text-3xl font-bold text-gray-900">Mi tesitura</h1>
				<p className="mt-2 text-gray-600">
					Calibra tu rango vocal para que los cantos te sugieran el tono ideal
					para ti.
				</p>
			</header>

			{/* Current saved range */}
			<section className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
				<h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
					Mi rango guardado
				</h2>
				{range ? (
					<div className="mt-3 flex items-baseline gap-3">
						<p className="font-mono text-3xl font-bold text-gray-900">
							{formatPitch(range.low)} – {formatPitch(range.high)}
						</p>
						<button
							type="button"
							onClick={() => setRange(null)}
							className="text-xs text-gray-400 hover:text-red-600"
						>
							Olvidar
						</button>
					</div>
				) : (
					<p className="mt-3 text-gray-500">Aún no has calibrado tu voz.</p>
				)}
			</section>

			{/* Calibration */}
			<section className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
				<h2 className="text-base font-semibold text-gray-900">
					Calibrar con micrófono
				</h2>
				<p className="mt-1 text-sm text-gray-500">
					Te tocaremos una nota de referencia. Canta la nota más baja que
					puedas cómodamente y luego la más alta.
				</p>

				<div className="mt-5 grid grid-cols-2 gap-4">
					{/* Low */}
					<div className="rounded-lg border border-gray-100 p-4">
						<p className="text-xs uppercase tracking-wider text-gray-400">
							Nota más baja
						</p>
						{capturedLow !== null ? (
							<p className="mt-1 font-mono text-2xl font-bold text-green-700">
								{formatPitch(capturedLow)}
							</p>
						) : (
							<p className="mt-1 font-mono text-2xl text-gray-300">--</p>
						)}
						<button
							type="button"
							disabled={listening}
							onClick={() => runStage("low")}
							className="mt-3 flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
						>
							<MicrophoneIcon className="size-4" />
							{stage === "low-listening" ? "Escuchando…" : "Cantar"}
						</button>
					</div>

					{/* High */}
					<div className="rounded-lg border border-gray-100 p-4">
						<p className="text-xs uppercase tracking-wider text-gray-400">
							Nota más alta
						</p>
						{capturedHigh !== null ? (
							<p className="mt-1 font-mono text-2xl font-bold text-green-700">
								{formatPitch(capturedHigh)}
							</p>
						) : (
							<p className="mt-1 font-mono text-2xl text-gray-300">--</p>
						)}
						<button
							type="button"
							disabled={listening || capturedLow === null}
							onClick={() => runStage("high")}
							className="mt-3 flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
						>
							<MicrophoneIcon className="size-4" />
							{stage === "high-listening" ? "Escuchando…" : "Cantar"}
						</button>
					</div>
				</div>

				{error && <p className="mt-3 text-sm text-red-600">{error}</p>}

				{listening && (
					<button
						type="button"
						onClick={() => {
							stopAll();
							setStage("idle");
						}}
						className="mt-3 flex items-center gap-2 text-xs text-gray-500 hover:text-red-600"
					>
						<StopIcon className="size-4" />
						Detener
					</button>
				)}

				{stage === "done" && capturedLow !== null && capturedHigh !== null && (
					<button
						type="button"
						onClick={saveCalibrated}
						className="mt-5 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-500"
					>
						Guardar como mi rango ({formatPitch(Math.min(capturedLow, capturedHigh))}{" "}
						– {formatPitch(Math.max(capturedLow, capturedHigh))})
					</button>
				)}
			</section>

			{/* Manual fallback */}
			<section className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
				<h2 className="text-base font-semibold text-gray-900">
					Ajustar manualmente
				</h2>
				<div className="mt-4 grid grid-cols-[1fr_1fr_auto] items-end gap-3">
					<label className="flex flex-col gap-1 text-xs text-gray-600">
						Nota más baja
						<div className="flex items-center gap-1">
							<select
								value={low}
								onChange={(e) => setLow(Number(e.target.value))}
								className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-base outline-none focus:border-gray-400"
							>
								{OPTIONS.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
							<button
								type="button"
								onClick={() => previewTone(low)}
								className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
								title="Escuchar nota"
							>
								<PlayIcon className="size-4" />
							</button>
						</div>
					</label>
					<label className="flex flex-col gap-1 text-xs text-gray-600">
						Nota más alta
						<div className="flex items-center gap-1">
							<select
								value={high}
								onChange={(e) => setHigh(Number(e.target.value))}
								className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-base outline-none focus:border-gray-400"
							>
								{OPTIONS.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
							<button
								type="button"
								onClick={() => previewTone(high)}
								className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
								title="Escuchar nota"
							>
								<PlayIcon className="size-4" />
							</button>
						</div>
					</label>
					<button
						type="button"
						onClick={saveManual}
						className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
					>
						Guardar
					</button>
				</div>
			</section>

			{/* Songs that fit */}
			{range && <SongFitList range={range} />}
		</main>
	);
}

function SongFitList({ range }: { range: { low: number; high: number } }) {
	const rows = (allCantos as CantoEntry[])
		.map((c) => {
			const songRange = getSongChordRange(c.ast.chords);
			if (!songRange) return null;
			const fit = analyzeFit(songRange, range.low, range.high);
			return {
				slug: c.slug,
				title: c.title,
				fit,
			};
		})
		.filter((r): r is { slug: string; title: string; fit: ReturnType<typeof analyzeFit> } => r !== null)
		.sort((a, b) => {
			const aBad = a.fit.status === "fits" ? 0 : 1;
			const bBad = b.fit.status === "fits" ? 0 : 1;
			if (aBad !== bBad) return aBad - bBad;
			return Math.abs(a.fit.suggestedSemitones) - Math.abs(b.fit.suggestedSemitones);
		});

	const fitting = rows.filter((r) => r.fit.status === "fits");

	return (
		<section className="rounded-xl border border-gray-200 bg-white p-5">
			<h2 className="text-base font-semibold text-gray-900">
				Cómo encajan los cantos
			</h2>
			<p className="mt-1 text-sm text-gray-500">
				{fitting.length} de {rows.length} cantos quedan en tu rango.
			</p>
			<ul className="mt-4 max-h-96 divide-y divide-gray-100 overflow-y-auto">
				{rows.map((r) => (
					<li key={r.slug} className="flex items-center justify-between gap-3 py-2">
						<Link
							to="/cantos/$slug"
							params={{ slug: r.slug }}
							className="truncate text-sm text-gray-800 no-underline hover:text-blue-600"
						>
							{r.title}
						</Link>
						<span
							className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
								r.fit.status === "fits"
									? "bg-green-100 text-green-700"
									: "bg-amber-100 text-amber-700"
							}`}
						>
							{r.fit.status === "fits"
								? "Encaja"
								: r.fit.suggestedSemitones > 0
									? `+${r.fit.suggestedSemitones} st`
									: `${r.fit.suggestedSemitones} st`}
						</span>
					</li>
				))}
			</ul>
		</section>
	);
}
