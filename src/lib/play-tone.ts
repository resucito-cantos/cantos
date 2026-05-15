// Synthesize a clean reference tone at the given MIDI pitch. Used by the
// /tesitura calibration flow as a sing-along guide.

const FREQ_A4 = 440;

export function midiToFreq(midi: number): number {
	return FREQ_A4 * Math.pow(2, (midi - 69) / 12);
}

export type ToneHandle = {
	stop: () => void;
};

export function playTone(midi: number, durationSec = 2): ToneHandle {
	const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();

	osc.type = "sine";
	osc.frequency.value = midiToFreq(midi);

	const t0 = ctx.currentTime;
	const peak = 0.18;
	gain.gain.setValueAtTime(0, t0);
	gain.gain.linearRampToValueAtTime(peak, t0 + 0.04);
	gain.gain.setValueAtTime(peak, t0 + durationSec - 0.1);
	gain.gain.linearRampToValueAtTime(0, t0 + durationSec);

	osc.connect(gain);
	gain.connect(ctx.destination);
	osc.start();
	osc.stop(t0 + durationSec);

	let stopped = false;
	osc.onended = () => {
		if (!stopped) {
			stopped = true;
			ctx.close().catch(() => {});
		}
	};

	return {
		stop() {
			if (stopped) return;
			stopped = true;
			try {
				gain.gain.cancelScheduledValues(ctx.currentTime);
				gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
				osc.stop(ctx.currentTime + 0.06);
			} catch {
				/* already stopping */
			}
			ctx.close().catch(() => {});
		},
	};
}
