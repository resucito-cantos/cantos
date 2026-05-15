import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { MicrophoneIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import { detectPitch, freqToMidi } from "../lib/pitch-detect";
import { formatPitch, midiOf, pickerOptions } from "../lib/voice-range";
import { useVoiceRange, type VoiceRange } from "../hooks/useVoiceRange";

type Props = {
	open: boolean;
	onClose: () => void;
};

const OPTIONS = pickerOptions();

export function VoiceRangePicker({ open, onClose }: Props) {
	const { range, setRange } = useVoiceRange();
	const [low, setLow] = useState<number>(range?.low ?? midiOf(0, 3));
	const [high, setHigh] = useState<number>(range?.high ?? midiOf(7, 4));
	const [recording, setRecording] = useState(false);
	const [detected, setDetected] = useState<{ low: number; high: number } | null>(null);
	const [error, setError] = useState<string | null>(null);
	const stopRef = useRef<(() => void) | null>(null);

	useEffect(() => {
		if (range) {
			setLow(range.low);
			setHigh(range.high);
		}
	}, [range, open]);

	useEffect(() => {
		// Stop any active recording when the dialog closes.
		if (!open && stopRef.current) {
			stopRef.current();
			stopRef.current = null;
			setRecording(false);
		}
	}, [open]);

	const startMic = useCallback(async () => {
		setError(null);
		setDetected(null);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const ctx = new AudioContext();
			const source = ctx.createMediaStreamSource(stream);
			const analyser = ctx.createAnalyser();
			analyser.fftSize = 2048;
			source.connect(analyser);
			const buf = new Float32Array(analyser.fftSize);
			let lowest = Number.POSITIVE_INFINITY;
			let highest = Number.NEGATIVE_INFINITY;
			let raf = 0;

			function loop() {
				analyser.getFloatTimeDomainData(buf);
				const freq = detectPitch(buf, ctx.sampleRate);
				if (freq !== null) {
					const m = freqToMidi(freq);
					if (m < lowest) lowest = m;
					if (m > highest) highest = m;
					setDetected({
						low: Number.isFinite(lowest) ? lowest : 0,
						high: Number.isFinite(highest) ? highest : 0,
					});
				}
				raf = requestAnimationFrame(loop);
			}
			loop();
			setRecording(true);

			const stop = () => {
				cancelAnimationFrame(raf);
				for (const track of stream.getTracks()) track.stop();
				ctx.close();
				setRecording(false);
				if (Number.isFinite(lowest) && Number.isFinite(highest) && highest > lowest) {
					setLow(lowest);
					setHigh(highest);
				}
			};
			stopRef.current = stop;
		} catch (e) {
			setError((e as Error).message || "Mic permission denied");
		}
	}, []);

	const stopMic = useCallback(() => {
		stopRef.current?.();
		stopRef.current = null;
	}, []);

	const handleSave = () => {
		if (low >= high) {
			setError("La nota más alta debe ser mayor que la más baja.");
			return;
		}
		setRange({ low, high } as VoiceRange);
		onClose();
	};

	const handleClear = () => {
		setRange(null);
		onClose();
	};

	return (
		<Dialog className="relative z-50" open={open} onClose={onClose}>
			<DialogBackdrop className="fixed inset-0 bg-gray-500/40" />
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
					<h2 className="text-lg font-semibold text-gray-900">Mi tesitura</h2>
					<p className="mt-1 text-sm text-gray-500">
						Escoge tu nota más baja y más alta cómodas para cantar.
					</p>

					<div className="mt-5 grid grid-cols-2 gap-3">
						<label className="flex flex-col gap-1 text-sm">
							<span className="text-gray-600">Nota más baja</span>
							<select
								value={low}
								onChange={(e) => setLow(Number(e.target.value))}
								className="rounded-lg border border-gray-200 px-3 py-2 text-base outline-none focus:border-gray-400"
							>
								{OPTIONS.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
						</label>
						<label className="flex flex-col gap-1 text-sm">
							<span className="text-gray-600">Nota más alta</span>
							<select
								value={high}
								onChange={(e) => setHigh(Number(e.target.value))}
								className="rounded-lg border border-gray-200 px-3 py-2 text-base outline-none focus:border-gray-400"
							>
								{OPTIONS.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
						</label>
					</div>

					<div className="mt-5 rounded-lg border border-dashed border-gray-200 p-3">
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2 text-sm text-gray-600">
								<MicrophoneIcon className="size-5" />
								<span>Detectar con micrófono</span>
							</div>
							{!recording ? (
								<button
									type="button"
									onClick={startMic}
									className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
								>
									Iniciar
								</button>
							) : (
								<button
									type="button"
									onClick={stopMic}
									className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
								>
									Detener
								</button>
							)}
						</div>
						{recording && (
							<p className="mt-2 text-xs text-gray-500">
								Canta tu nota más baja, luego tu más alta. Detén cuando termines.
							</p>
						)}
						{detected && (
							<p className="mt-2 text-xs text-gray-700">
								Detectado: {formatPitch(detected.low)} – {formatPitch(detected.high)}
							</p>
						)}
					</div>

					{error && <p className="mt-3 text-sm text-red-600">{error}</p>}

					<div className="mt-6 flex justify-between gap-2">
						<button
							type="button"
							onClick={handleClear}
							className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
						>
							Olvidar
						</button>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={onClose}
								className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleSave}
								className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
							>
								Guardar
							</button>
						</div>
					</div>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
