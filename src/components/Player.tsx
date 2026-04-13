import {
	CheckCircle,
	Download,
	Loader2,
	Pause,
	Play,
	Repeat,
	RotateCcw,
	RotateCw,
	Volume2,
	VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { OfflineStatus } from "../hooks/useOfflineAudio";

type PlayerProps = {
	src: string;
	title?: string;
	cacheStatus?: OfflineStatus;
	onDownload?: () => void;
};

export function Player({ src, title, cacheStatus, onDownload }: PlayerProps) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isLooping, setIsLooping] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [seekValue, setSeekValue] = useState(0);
	const [volume, setVolume] = useState(0.8);
	const isVisibleRef = useRef(true);

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

	const toggleMute = useCallback(() => {
		const audio = audioRef.current;
		if (!audio) return;
		audio.muted = !isMuted;
		setIsMuted(!isMuted);
	}, [isMuted]);

	const seekBy = useCallback((seconds: number) => {
		const audio = audioRef.current;
		if (!audio) return;
		audio.currentTime = Math.max(
			0,
			Math.min(audio.duration, audio.currentTime + seconds),
		);
	}, []);

	const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const audio = audioRef.current;
		if (!audio) return;
		const val = Number(e.target.value);
		audio.currentTime = audio.duration * (val / 100);
		setSeekValue(val);
	}, []);

	const handleVolume = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const audio = audioRef.current;
			if (!audio) return;
			const val = Number(e.target.value);
			audio.volume = val;
			setVolume(val);
			if (val > 0 && isMuted) {
				audio.muted = false;
				setIsMuted(false);
			}
		},
		[isMuted],
	);

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
			if (isVisibleRef.current) {
				setSeekValue((audio.currentTime / audio.duration) * 100 || 0);
			}
			if ("mediaSession" in navigator && audio.duration) {
				navigator.mediaSession.setPositionState({
					duration: audio.duration,
					playbackRate: audio.playbackRate,
					position: audio.currentTime,
				});
			}
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
				case "KeyM":
					toggleMute();
					break;
				case "ArrowLeft":
					e.preventDefault();
					seekBy(e.shiftKey ? -5 : -10);
					break;
				case "ArrowRight":
					e.preventDefault();
					seekBy(e.shiftKey ? 5 : 10);
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
	}, [togglePlay, toggleLoop, toggleMute, seekBy]);

	// Media Session API
	useEffect(() => {
		if (!("mediaSession" in navigator)) return;

		navigator.mediaSession.metadata = new MediaMetadata({
			title: title ?? "Resucitó",
			artist: "Resucitó",
			album: "Cantos para las Comunidades Neocatecumenales",
			artwork: [96, 128, 192, 256, 512].map((size) => ({
				src: "/resucito-cover.png",
				sizes: `${size}x${size}`,
				type: "image/png",
			})),
		});

		const actions: [MediaSessionAction, MediaSessionActionHandler][] = [
			["play", () => { audioRef.current?.play(); setIsPlaying(true); }],
			["pause", () => { audioRef.current?.pause(); setIsPlaying(false); }],
			["seekto", (d) => { if (audioRef.current && d.seekTime != null) audioRef.current.currentTime = d.seekTime; }],
			["seekbackward", () => seekBy(-10)],
			["seekforward", () => seekBy(10)],
		];

		for (const [action, handler] of actions) {
			try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* unsupported */ }
		}

		return () => {
			navigator.mediaSession.metadata = null;
			for (const [action] of actions) {
				try { navigator.mediaSession.setActionHandler(action, null); } catch { /* */ }
			}
		};
	}, [title, seekBy]);

	// Page Visibility
	useEffect(() => {
		function onVisibilityChange() {
			isVisibleRef.current = document.visibilityState === "visible";
		}
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () =>
			document.removeEventListener("visibilitychange", onVisibilityChange);
	}, []);

	return (
		<>
			<audio ref={audioRef} src={src} preload="metadata" />
			<div className="player-bar">
				{/* Progress bar as top border */}
				<div className="player-progress">
					<div
						className="player-progress-fill"
						style={{ width: `${seekValue}%` }}
					/>
					<input
						type="range"
						min="0"
						max="100"
						step="0.1"
						value={seekValue}
						onChange={handleSeek}
						className="player-progress-input"
						aria-label="Seek"
					/>
				</div>

				{/* Controls */}
				<div className="player-controls">
					{/* Left: loop */}
					<div className="player-left">
						<button
							type="button"
							className={`player-btn ${isLooping ? "active" : ""}`}
							onClick={toggleLoop}
							aria-label="Toggle loop"
							title="Loop (L)"
						>
							<Repeat size={16} />
						</button>
					</div>

					{/* Center: -10s, play/pause, +10s */}
					<div className="player-center">
						<button
							type="button"
							className="player-btn"
							onClick={() => seekBy(-10)}
							aria-label="Rewind 10 seconds"
							title="-10s (←)"
						>
							<RotateCcw size={16} />
						</button>

						<button
							type="button"
							className="player-btn player-btn-play"
							onClick={togglePlay}
							aria-label={isPlaying ? "Pause" : "Play"}
							title="Play/Pause (Space)"
						>
							{isPlaying ? <Pause size={20} /> : <Play size={20} />}
						</button>

						<button
							type="button"
							className="player-btn"
							onClick={() => seekBy(10)}
							aria-label="Forward 10 seconds"
							title="+10s (→)"
						>
							<RotateCw size={16} />
						</button>
					</div>

					{/* Right: cache + volume + mute */}
					<div className="player-right">
						{cacheStatus && cacheStatus !== "unknown" && (
							<button
								type="button"
								className={`player-btn ${cacheStatus === "cached" ? "text-green-600" : ""}`}
								onClick={cacheStatus === "not-cached" || cacheStatus === "error" ? onDownload : undefined}
								disabled={cacheStatus === "downloading" || cacheStatus === "cached"}
								aria-label={
									cacheStatus === "cached"
										? "Disponible sin conexión"
										: cacheStatus === "downloading"
											? "Descargando..."
											: "Descargar para escuchar sin conexión"
								}
								title={
									cacheStatus === "cached"
										? "Disponible sin conexión"
										: "Descargar offline"
								}
							>
								{cacheStatus === "cached" && <CheckCircle size={16} />}
								{cacheStatus === "downloading" && <Loader2 size={16} className="animate-spin" />}
								{(cacheStatus === "not-cached" || cacheStatus === "error") && <Download size={16} />}
							</button>
						)}
						<button
							type="button"
							className={`player-btn ${isMuted ? "active" : ""}`}
							onClick={toggleMute}
							aria-label={isMuted ? "Unmute" : "Mute"}
							title="Mute (M)"
						>
							{isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
						</button>
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={isMuted ? 0 : volume}
							onChange={handleVolume}
							className="player-volume"
							aria-label="Volume"
						/>
					</div>
				</div>
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
