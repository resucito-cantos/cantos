// Browser-side pitch detection via autocorrelation. Used by the voice-range
// "detect with microphone" flow. Designed for simple monophonic singing, not
// polyphony — good enough to estimate a singer's lowest and highest comfy
// pitches over a few seconds.

const MIN_FREQ = 65; // Do2 ≈ 65.4 Hz
const MAX_FREQ = 1100; // Do6 ≈ 1046.5 Hz
const MIN_RMS = 0.01;
const GOOD_CORRELATION = 0.9;

export function freqToMidi(freq: number): number {
	return Math.round(69 + 12 * Math.log2(freq / 440));
}

// Auto-correlation-based pitch detection (ACF2+, simple but effective for
// voice). Returns the dominant frequency in Hz, or null if there's no clear
// pitch (silence, noise).
export function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
	const SIZE = buffer.length;

	// Reject quiet/noisy signal
	let rms = 0;
	for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
	rms = Math.sqrt(rms / SIZE);
	if (rms < MIN_RMS) return null;

	// Trim silence at start/end
	let r1 = 0;
	let r2 = SIZE - 1;
	const threshold = 0.2;
	for (let i = 0; i < SIZE / 2; i++) {
		if (Math.abs(buffer[i]) < threshold) {
			r1 = i;
			break;
		}
	}
	for (let i = 1; i < SIZE / 2; i++) {
		if (Math.abs(buffer[SIZE - i]) < threshold) {
			r2 = SIZE - i;
			break;
		}
	}
	const trimmed = buffer.slice(r1, r2);
	const n = trimmed.length;
	if (n < 256) return null;

	const minLag = Math.floor(sampleRate / MAX_FREQ);
	const maxLag = Math.floor(sampleRate / MIN_FREQ);
	if (maxLag >= n) return null;

	// Compute autocorrelation
	const c = new Float32Array(maxLag + 1);
	for (let lag = minLag; lag <= maxLag; lag++) {
		let sum = 0;
		for (let i = 0; i < n - lag; i++) sum += trimmed[i] * trimmed[i + lag];
		c[lag] = sum;
	}

	// Find peak after the first zero-crossing
	let d = minLag;
	while (d < maxLag && c[d] > c[d + 1]) d++;

	let maxVal = -Infinity;
	let maxLagIdx = d;
	for (let i = d; i <= maxLag; i++) {
		if (c[i] > maxVal) {
			maxVal = c[i];
			maxLagIdx = i;
		}
	}

	// Reject low-confidence peaks
	if (maxVal / c[0] < GOOD_CORRELATION * 0.5) return null;

	// Parabolic interpolation around the peak for sub-sample accuracy
	let lag = maxLagIdx;
	if (maxLagIdx > minLag && maxLagIdx < maxLag) {
		const x1 = c[maxLagIdx - 1];
		const x2 = c[maxLagIdx];
		const x3 = c[maxLagIdx + 1];
		const a = (x1 + x3 - 2 * x2) / 2;
		const b = (x3 - x1) / 2;
		if (a < 0) lag = maxLagIdx - b / (2 * a);
	}

	return sampleRate / lag;
}
