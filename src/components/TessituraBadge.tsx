import { CheckCircleIcon, MusicalNoteIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import {
	analyzeFit,
	formatPitch,
	getSongChordRange,
	pitchClassName,
} from "../lib/voice-range";
import { useTransposition } from "../hooks/useTransposition";
import { useVoiceRange } from "../hooks/useVoiceRange";
import { VoiceRangePicker } from "./VoiceRangePicker";

type Props = {
	slug: string;
	chords: string[];
};

export function TessituraBadge({ slug, chords }: Props) {
	const { range } = useVoiceRange();
	const transposition = useTransposition(slug);
	const [pickerOpen, setPickerOpen] = useState(false);

	const songRange = getSongChordRange(
		// Apply current transposition before analyzing so the suggestion accounts
		// for anything the user has already shifted by hand.
		chords.map((c) => c),
	);

	if (!songRange) return null;

	if (!range) {
		return (
			<>
				<button
					type="button"
					onClick={() => setPickerOpen(true)}
					className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs text-gray-600 shadow outline-1 outline-black/5 hover:bg-gray-50"
					title="Configurar mi tesitura"
				>
					<MusicalNoteIcon className="size-3.5" />
					<span>Configurar mi tesitura</span>
				</button>
				<VoiceRangePicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
			</>
		);
	}

	// We pass the user's range shifted DOWN by the current transposition so the
	// analysis describes the song in its original key — the suggestion already
	// accounts for whatever the user has set.
	const fit = analyzeFit(
		songRange,
		range.low - transposition.semitones,
		range.high - transposition.semitones,
	);

	const songKey = pitchClassName(songRange.lowestPc);
	const tone = fit.status === "fits" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700";

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
		<>
			<div
				className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium shadow outline-1 outline-black/5 ${tone}`}
				title={`Acordes del canto: ${songKey} (${formatPitch(fit.songLow)}–${formatPitch(fit.songHigh)}). Tu rango: ${formatPitch(range.low)}–${formatPitch(range.high)}.`}
			>
				{fit.status === "fits" && <CheckCircleIcon className="size-3.5" />}
				<button
					type="button"
					onClick={() => setPickerOpen(true)}
					className="hover:underline"
				>
					{label}
				</button>
				{fit.status !== "fits" && fit.suggestedSemitones !== 0 && (
					<button
						type="button"
						onClick={() => transposition.adjust(fit.suggestedSemitones)}
						className="ml-1 rounded bg-white/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide hover:bg-white"
					>
						Aplicar
					</button>
				)}
			</div>
			<VoiceRangePicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
		</>
	);
}
