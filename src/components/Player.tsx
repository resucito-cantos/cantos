import { Pause, Play, Repeat, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type PlayerProps = {
	src: string;
};

export function Player({ src }: PlayerProps) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isLooping, setIsLooping] = useState(false);
	const [seekValue, setSeekValue] = useState(0);
	const [volume, setVolume] = useState(0.8);

	const togglePlay = useCallback(() => {
		const audio = audioRef.current;
		if (!audio) return;
		if (isPlaying) {
			audio.pause();
		} else {
			audio.play();
		}
		setIsPlaying(!isPlaying);
	}, [isPlaying]);

	const toggleLoop = useCallback(() => {
		const audio = audioRef.current;
		if (!audio) return;
		audio.loop = !isLooping;
		setIsLooping(!isLooping);
	}, [isLooping]);

	const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const audio = audioRef.current;
		if (!audio) return;
		const val = Number(e.target.value);
		audio.currentTime = audio.duration * (val / 100);
		setSeekValue(val);
	}, []);

	const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const audio = audioRef.current;
		if (!audio) return;
		const val = Number(e.target.value);
		audio.volume = val;
		setVolume(val);
	}, []);

	// Seek to a specific timecode (called from SongSheet lyric clicks)
	useEffect(() => {
		function handleSyncClick(e: MouseEvent) {
			const target = e.target as HTMLElement;
			const voiceLine = target.closest("[data-sync-from]") as HTMLElement;
			if (!voiceLine) return;
			const timeStr = voiceLine.dataset.syncFrom;
			if (!timeStr) return;

			const audio = audioRef.current;
			if (!audio) return;

			const ms = toMs(timeStr);
			audio.currentTime = ms / 1000;
			audio.play();
			setIsPlaying(true);
		}

		document.addEventListener("click", handleSyncClick);
		return () => document.removeEventListener("click", handleSyncClick);
	}, []);

	// Update seek slider as audio plays
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		function onTimeUpdate() {
			if (!audio) return;
			setSeekValue((audio.currentTime / audio.duration) * 100 || 0);
		}

		function onEnded() {
			setIsPlaying(false);
		}

		audio.addEventListener("timeupdate", onTimeUpdate);
		audio.addEventListener("ended", onEnded);
		return () => {
			audio.removeEventListener("timeupdate", onTimeUpdate);
			audio.removeEventListener("ended", onEnded);
		};
	}, []);

	// Keyboard shortcuts
	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			// Don't capture when typing in an input
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			const audio = audioRef.current;
			if (!audio) return;

			switch (e.code) {
				case "Space":
					e.preventDefault();
					togglePlay();
					break;
				case "KeyL":
					toggleLoop();
					break;
				case "ArrowLeft":
					e.preventDefault();
					audio.currentTime = Math.max(0, audio.currentTime - 5);
					break;
				case "ArrowRight":
					e.preventDefault();
					audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
					break;
				case "ArrowUp":
					e.preventDefault();
					audio.volume = Math.min(1, audio.volume + 0.1);
					setVolume(audio.volume);
					break;
				case "ArrowDown":
					e.preventDefault();
					audio.volume = Math.max(0, audio.volume - 0.1);
					setVolume(audio.volume);
					break;
			}
		}

		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [togglePlay, toggleLoop]);

	return (
		<>
			<audio ref={audioRef} src={src} preload="metadata" />
			<div className="player-bar">
				<button
					type="button"
					className="player-btn"
					onClick={togglePlay}
					aria-label={isPlaying ? "Pause" : "Play"}
				>
					{isPlaying ? <Pause size={18} /> : <Play size={18} />}
				</button>

				<button
					type="button"
					className={`player-btn ${isLooping ? "active" : ""}`}
					onClick={toggleLoop}
					aria-label="Toggle loop"
				>
					<Repeat size={16} />
				</button>

				<input
					type="range"
					min="0"
					max="100"
					step="0.1"
					value={seekValue}
					onChange={handleSeek}
					className="flex-1"
					aria-label="Seek"
				/>

				<Volume2 size={16} className="text-gray-400 ml-2" />
				<input
					type="range"
					min="0"
					max="1"
					step="0.01"
					value={volume}
					onChange={handleVolume}
					className="w-20"
					aria-label="Volume"
				/>
			</div>
		</>
	);
}

function toMs(str: string): number {
	if (!str.includes(":")) return Number.parseFloat(str);
	const [mins, secMs] = str.split(":");
	const [sec, ms] = secMs.split(".");
	return (+mins * 60 + +sec) * 1000 + +ms;
}
