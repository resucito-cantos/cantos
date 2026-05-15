import type { CantoAST, Line, Section, Segment } from "../lib/chordpro";
import { transposeChord } from "../lib/transpose";

type SongSheetProps = {
	title: string;
	subtitle?: string | null;
	category?: string | null;
	ast: CantoAST;
	transposition?: number;
	onLineClick?: (timecode: string) => void;
};

function ChordSegment({
	segment,
	transposition,
}: {
	segment: Segment;
	transposition: number;
}) {
	if (segment.chord) {
		const chord =
			transposition === 0 ? segment.chord : transposeChord(segment.chord, transposition);
		// Wrap the text in a span so chord segments with empty/whitespace text
		// (trailing transition chords like `[Fa7+5dim] [Mi]`) keep the full
		// lyric-line height and the chord stays in the chord row.
		return (
			<span className="chord-a">
				<span className="chord">{chord}</span>
				<span className="chord-text">{segment.text || "\u00A0"}</span>
			</span>
		);
	}
	return <>{segment.text}</>;
}

function VoiceLine({
	line,
	transposition,
	onLineClick,
}: {
	line: Line;
	transposition: number;
	onLineClick?: (timecode: string) => void;
}) {
	return (
		<p
			className="voice"
			{...(line.timecode ? { "data-sync-from": line.timecode } : {})}
			onClick={
				line.timecode && onLineClick
					? () => onLineClick(line.timecode!)
					: undefined
			}
			style={line.timecode && onLineClick ? { cursor: "pointer" } : undefined}
		>
			{line.segments.map((seg, i) => (
				<ChordSegment key={i} segment={seg} transposition={transposition} />
			))}
		</p>
	);
}

function SongSection({
	section,
	transposition,
	onLineClick,
}: {
	section: Section;
	transposition: number;
	onLineClick?: (timecode: string) => void;
}) {
	const lines = section.lines.map((line, i) => (
		<VoiceLine
			key={i}
			line={line}
			transposition={transposition}
			onLineClick={onLineClick}
		/>
	));

	if (section.bis) {
		return (
			<div className={`${section.type} has-bis`}>
				<div className="bis-content">{lines}</div>
				<span className="bis-label">BIS</span>
			</div>
		);
	}

	return <div className={section.type}>{lines}</div>;
}

export function SongSheet({
	title,
	subtitle,
	category,
	ast,
	transposition = 0,
	onLineClick,
}: SongSheetProps) {
	// Split sections into columns at columnBreak markers
	const columns: Section[][] = [[]];
	for (const section of ast.sections) {
		if (section.columnBreak) {
			columns.push([]);
		}
		columns[columns.length - 1].push(section);
	}

	return (
		<div className="song">
			<header className="song-header">
				{ast.capo !== null && (
					<span className="song-capo">Cejilla {ast.capo}º traste</span>
				)}
				{category && (
					<p className="song-category">{category.toUpperCase()}</p>
				)}
				<h1 className="song-title">{title}</h1>
				{subtitle && <p className="song-subtitle">{subtitle}</p>}
			</header>

			<div className="song-chords">
				{columns.map((sections, colIdx) => (
					<div key={colIdx} className="column">
						{sections.map((section, secIdx) => (
							<SongSection
								key={secIdx}
								section={section}
								transposition={transposition}
								onLineClick={onLineClick}
							/>
						))}
					</div>
				))}
			</div>
		</div>
	);
}
