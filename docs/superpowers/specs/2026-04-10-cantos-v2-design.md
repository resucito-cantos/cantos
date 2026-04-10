# Cantos V2 — Design Spec

## Overview

Rebuild the Resucito cantos Hugo site as a TanStack Start application with full static pre-rendering. Uses content-collections to process ChordPro markdown files at build time into a typed AST. Fixes the double-chord rendering bug, improves player styling, and adds a Google-style search homepage.

## Content Source

- Copy existing Hugo `content/cantos/` markdown files into `content/cantos/` within cantos-v2
- Each canto is a directory: `content/cantos/{slug}/index.md` with optional `*.mp3` audio file
- Frontmatter schema:
  ```yaml
  title: string (required)
  subtitle: string (optional)
  category: string (optional, e.g., "Precatecumenado", "Catecumenado", "TODO")
  tags: string[] (optional)
  resources:
    - name: audio
      src: filename.mp3
  ```

## Content-Collections Setup

- Install `@content-collections/core`, `@content-collections/vite`, `zod`
- Add `contentCollections()` plugin to `vite.config.ts`
- Add path alias `"content-collections": ["./.content-collections/generated"]` to `tsconfig.json`
- Add `.content-collections` to `.gitignore`
- Define `cantos` collection in `content-collections.ts`:
  - `directory`: `content/cantos`
  - `include`: `**/index.md`
  - `schema`: validates frontmatter fields (title, subtitle, category, tags, resources)
  - `transform`: extracts ChordPro code blocks from markdown content, parses them using the ChordPro parser, returns typed `Canto` AST alongside frontmatter fields and slug from `_meta.path`

## ChordPro Parser

**File**: `src/lib/chordpro.ts`

**Input**: Raw ChordPro text (content inside triple-backtick chordpro blocks)

**Output**: Typed AST:

```ts
type Canto = {
  capo: number | null
  sections: Section[]
  chords: string[] // unique chord names for diagram rendering
}

type Section = {
  type: "verse" | "chorus"
  columnBreak?: boolean // marks that a column break comes before this section
  lines: Line[]
}

type Line = {
  timecode: string | null // "MM:SS.ms" format or null
  segments: Segment[]
}

type Segment = {
  chord: string | null // chord name like "La m", "Mi", "Re m9"
  text: string // lyrics text following the chord
}
```

**Parsing rules**:

1. Process line by line
2. Directives:
   - `{start_of_verse}` / `{end_of_verse}` — open/close verse section
   - `{start_of_chorus}` / `{end_of_chorus}` — open/close chorus section
   - `{column_break}` — set `columnBreak: true` on the next section
   - `{capo:N}` — extract to top-level `capo` field
3. Timecodes: `[MM:SS.ms]` at start of line — extract as `timecode`, not as a chord
4. Chords: Split line by `[...]` tokens into segments. Each `[ChordName]` starts a new segment with that chord. Text before the first chord is a segment with `chord: null`.
   - Example: `[Mi]foo[La]bar` → `[{chord:"Mi", text:"foo"}, {chord:"La", text:"bar"}]`
   - This fixes the double-chord bug where adjacent chords on the same word dropped one
5. Collect all unique chord names into the top-level `chords` array

## Routes

### `/` — Search Homepage

- Centered layout, vertically and horizontally
- Site title "Resucito" at top
- Large search input below
- Client-side search over `allCantos`:
  - Searches: title, subtitle, category, lyrics content
  - Debounced ~150ms
  - Results appear below search bar as user types
  - Each result: title, subtitle, category badge
  - Click navigates to `/cantos/$slug`
- Search logic in a `useSearch` hook (isolated for future database swap)

### `/cantos/$slug` — Canto Detail Page

- Loads canto from `allCantos` by slug
- Renders `SongSheet` component with the parsed AST
- Renders `Player` component if audio resource exists
- Static pre-rendered at build time

## Components

### `SongSheet.tsx`

Renders the Canto AST matching the original Resucito design:

- **Header**: Title in red bold (top-right area), subtitle below in smaller text, capo indicator top-left ("Cejilla Nº traste")
- **Two-column grid**: Split at `columnBreak` marker. Left = verses, right = chorus (typically). Single column on mobile.
- **Verses**: Prefixed with "S." label in red
- **Choruses**: Prefixed with "A." label in red, text uppercase and bold
- **Chord positioning**: Each `Segment` is an inline-block span. Chord name in small red text positioned above the lyrics using absolute positioning. Every segment gets its own container — no overlap.
- **Chord diagrams**: Rendered at bottom of page. Horizontal row of SVG diagrams for each unique chord in `chords[]`.

### `ChordDiagram.tsx`

Renders SVG guitar chord fingering diagrams from chord names. Uses a chord library (e.g., `@tombatossals/react-chords` or custom SVG rendering with a chord database).

### `Player.tsx`

Fixed bottom bar, only on canto pages with audio.

**Controls**:
- Play/pause toggle (icon)
- Loop toggle (visual indicator when active)
- Seek slider (syncs with audio currentTime)
- Volume slider

**Keyboard shortcuts**:
- `Space` — play/pause
- `L` — toggle loop
- `ArrowLeft` / `ArrowRight` — seek ±5s
- `ArrowUp` / `ArrowDown` — volume ±10%

**Styling**: White background, subtle top shadow, red accent for sliders/active states, custom range input styling, responsive.

**Sync**: Clicking a lyric line with timecode seeks audio to that position and starts playback.

**Audio source**: MP3 files from `content/cantos/{slug}/`. Exposed via frontmatter `resources` field. Copied to `public/` for static serving at build time.

## Styling

- Tailwind CSS v4 (already configured)
- Match original Resucito design: white background, red (`text-red-600`) for chords, titles, and labels
- Replace existing ocean/nature palette with original design colors
- No dark mode initially
- Responsive: single column on mobile, two columns on desktop (md+ breakpoint)
- Typography: clean sans-serif body, nothing fancy

## Static Pre-rendering

- TanStack Start configured for full static site generation
- All canto pages pre-rendered at build time
- Search page pre-rendered with all cantos data embedded (client-side filtering)

## File Structure

```
cantos-v2/
├── content/
│   └── cantos/
│       ├── a-la-victima-pascual/
│       │   ├── index.md
│       │   └── a-la-victima-pascual.mp3
│       └── .../
├── content-collections.ts
├── src/
│   ├── lib/
│   │   └── chordpro.ts          # ChordPro parser
│   ├── components/
│   │   ├── SongSheet.tsx         # Song renderer
│   │   ├── ChordDiagram.tsx      # SVG chord diagrams
│   │   ├── Player.tsx            # Audio player
│   │   └── SearchBar.tsx         # Search input + results
│   ├── hooks/
│   │   └── useSearch.ts          # Search logic hook
│   ├── routes/
│   │   ├── __root.tsx            # Root layout
│   │   ├── index.tsx             # Search homepage
│   │   └── cantos/
│   │       └── $slug.tsx         # Canto detail page
│   └── styles.css                # Global styles (Tailwind)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Out of Scope (Future)

- Database-backed search
- Auto-scroll/active line highlighting during playback
- Dark mode
- Transpose functionality
- User accounts or favorites
