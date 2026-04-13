import type { CantoAST, Line, Section, Segment } from "../lib/chordpro";

type SongSheetProps = {
	title: string;
	subtitle?: string | null;
	category?: string | null;
	ast: CantoAST;
	onLineClick?: (timecode: string) => void;
};

function ChordSegment({ segment }: { segment: Segment }) {
	if (segment.chord) {
		return (
			<span className="chord-a">
				<span className="chord">{segment.chord}</span>
				{segment.text}
			</span>
		);
	}
	return <>{segment.text}</>;
}

function VoiceLine({
	line,
	onLineClick,
}: {
	line: Line;
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
				<ChordSegment key={i} segment={seg} />
			))}
		</p>
	);
}

function SongSection({
	section,
	onLineClick,
}: {
	section: Section;
	onLineClick?: (timecode: string) => void;
}) {
	return (
		<div className={`${section.type} ${section.bis ? "has-bis" : ""}`}>
			{section.lines.map((line, i) => (
				<VoiceLine key={i} line={line} onLineClick={onLineClick} />
			))}
			{section.bis && <span className="bis-label">BIS</span>}
		</div>
	);
}

export function SongSheet({
	title,
	subtitle,
	category,
	ast,
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
								onLineClick={onLineClick}
							/>
						))}
					</div>
				))}
			</div>
		</div>
	);
}
