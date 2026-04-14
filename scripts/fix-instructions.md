# Song Fix Instructions

You are fixing song content files by comparing with PDF reference data.
Work from: /Users/me/Code/resucito/cantos-v2

The PDF is at: public/RESUCITO XX EDICION 2014.pdf
Content files: content/cantos/{slug}/index.md

## What to fix

1. **Accents** — Fix missing Spanish diacritical marks:
   - Common: Señor, María, Jesús, Él (pronoun), más, día, aquí, allí, así
   - Verbs: -ó (pasó, salió, cubrió), -é (pagaré, alzaré), -ía (tenía, podría)
   - Words: corazón, oración, bendición, salvación, perdón, Sión, Jerusalén, Aarón
   - Capitals: SEÑOR, MARÍA, ORACIÓN, BENDICIÓN, etc.

2. **Stray ¿ characters** — Our bulk fix incorrectly added ¿ before some words. Remove ¿ when:
   - The word "Que" is a conjunction, not a question (e.g., "¿QUE SE REFUGIA" → "QUE SE REFUGIA")
   - The word "Donde" is not a question (e.g., "¿Donde él" → "Donde él")
   - Keep ¿ only before actual questions ending with ?

3. **Subtitles** — Update to match PDF (e.g., "Salmo 42-43 (41-42)", "Lucas 1,42-45")

4. **BIS markers** — Add where PDF shows "BIS" or "BIS Asamblea":
   - Use `{end_of_chorus: BIS}` or `{end_of_chorus: BIS Asamblea}` or `{comment: BIS}`

5. **Structure** — Fix column breaks if they don't match PDF layout

6. **Separated chord/lyric lines** — If chords are on a separate line from lyrics (like `[La-]\n lyrics here`), merge them into one line: `[La-]lyrics here`

## What NOT to change
- Do not change chord names or positions
- Do not rewrite entire files — make targeted fixes
- Do not add timecodes
- Do not change the category

## How to find the song file
The slug is derived from the title. For example:
- "De Profundis" → content/cantos/de-profundis/index.md
- "Éste es el día" → content/cantos/este-es-el-dia-en-que-actuo-el-senor/index.md

## Commit
After fixing all songs in your batch, commit with:
```
git add content/
git commit -m "fix: correct accents and structure for songs p.XX-YY"
```
