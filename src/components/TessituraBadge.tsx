import { Link } from "@tanstack/react-router";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import {
	analyzeFit,
	formatPitch,
	getSongChordRange,
	pitchClassName,
} from "../lib/voice-range";
import { useTransposition } from "../hooks/useTransposition";
import { useVoiceRange } from "../hooks/useVoiceRange";

type Props = {
	slug: string;
	chords: string[];
};

export function TessituraBadge({ slug, chords }: Props) {
	const { range } = useVoiceRange();
	const transposition = useTransposition(slug);

	const songRange = getSongChordRange(chords);
	if (!songRange) return null;

	// Hidden until the user has calibrated their voice on /tesitura.
	if (!range) return null;

	// User's range, virtually shifted down by the current transposition so the
	// analysis still describes the song in its original key.
	const fit = analyzeFit(
		songRange,
		range.low - transposition.semitones,
		range.high - transposition.semitones,
	);

	const songKey = pitchClassName(songRange.lowestPc);
	const tone =
		fit.status === "fits"
			? "bg-green-100 text-green-700"
			: "bg-amber-100 text-amber-700";

	let label: string;
	if (fit.status === "fits") {
		label = "Tono cómodo";
	} else if (fit.suggestedSemitones === 0) {
		label = `Tu rango: ${formatPitch(range.low)}–${formatPitch(range.high)}`;
	} else {
		const sign = fit.suggestedSemitones > 0 ? "+" : "−";
		const abs = Math.abs(fit.suggestedSemitones);
		label = `Sugerencia ${sign}${abs} semitono${abs !== 1 ? "s" : ""}`;
	}

	return (
		<Link
			to="/tesitura"
			className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium no-underline shadow outline-1 outline-black/5 hover:underline ${tone}`}
			title={`Acordes del canto: ${songKey} (${formatPitch(fit.songLow)}–${formatPitch(fit.songHigh)}). Tu rango: ${formatPitch(range.low)}–${formatPitch(range.high)}.`}
		>
			{fit.status === "fits" && <CheckCircleIcon className="size-3.5" />}
			<span>{label}</span>
		</Link>
	);
}
