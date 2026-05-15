// Listen on the mic for `durationMs` and return the dominant sung pitch
// (MIDI number) plus the full distribution of detected pitches. Used by the
// calibration flow to capture the user's lowest and highest comfortable notes.

import { detectPitch, freqToMidi } from "./pitch-detect";

export type CaptureResult = {
	dominant: number | null; // most-frequent detected MIDI pitch
	lowest: number | null;
	highest: number | null;
	samples: number[];
};

export type CaptureHandle = {
	stop: () => void;
	promise: Promise<CaptureResult>;
};

export function captureSungPitch(durationMs: number): CaptureHandle {
	let stopFn = () => {};

	const promise = (async (): Promise<CaptureResult> => {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		const ctx = new AudioContext();
		const source = ctx.createMediaStreamSource(stream);
		const analyser = ctx.createAnalyser();
		analyser.fftSize = 2048;
		source.connect(analyser);
		const buf = new Float32Array(analyser.fftSize);

		const samples: number[] = [];
		let cancelled = false;
		let raf = 0;
		const start = performance.now();

		const cleanup = () => {
			cancelled = true;
			cancelAnimationFrame(raf);
			for (const track of stream.getTracks()) track.stop();
			ctx.close().catch(() => {});
		};

		stopFn = cleanup;

		await new Promise<void>((resolve) => {
			function loop() {
				if (cancelled) return resolve();
				analyser.getFloatTimeDomainData(buf);
				const freq = detectPitch(buf, ctx.sampleRate);
				if (freq !== null) samples.push(freqToMidi(freq));
				if (performance.now() - start >= durationMs) {
					cleanup();
					resolve();
				} else {
					raf = requestAnimationFrame(loop);
				}
			}
			loop();
		});

		if (samples.length === 0) {
			return { dominant: null, lowest: null, highest: null, samples };
		}

		// Dominant pitch = most common detected MIDI number.
		const counts = new Map<number, number>();
		for (const m of samples) counts.set(m, (counts.get(m) ?? 0) + 1);
		let dominant: number | null = null;
		let max = 0;
		for (const [m, c] of counts) {
			if (c > max) {
				max = c;
				dominant = m;
			}
		}

		return {
			dominant,
			lowest: Math.min(...samples),
			highest: Math.max(...samples),
			samples,
		};
	})();

	return {
		stop: () => stopFn(),
		promise,
	};
}
