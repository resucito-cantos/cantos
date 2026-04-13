# Lyrics Review TODO

Issues found during comparison of markdown content files against the Resucitó XX Edición 2014 PDF and scrapper images.

## Fixed (Automated)

- **36 files**: Fixed "Senor" → "Señor" (missing ñ in lyrics)
- **Common accents fixed**: ángeles, ejércitos, órdenes, árboles, pájaros, domésticos, jóvenes, único, cetáceos, pasará
- **196 files**: Updated categories from "TODO" to proper values (Precatecumenado, Catecumenado, Elección, Litúrgico)
- **194 files**: Added liturgical tags (Cuaresma, Pascua, Navidad, etc.) from PDF indices
- **a-la-victima-pascual**: subtitle fixed "Canto de entrada" → "Secuencia de Pascua"
- **a-nadie-demos-ocasion-de-tropiezo**: subtitle fixed "2a Corintios" → "2ª Corintios"
- **a-ti-senor-en-mi-clamor-imploro**: subtitle fixed "Canto" → "Salmo 142 (141)", title fixed missing comma
- **a-ti-senor-se-debe-la-alabanza-en-sion**: lyrics typo "se debe a alabanza" → "se debe la alabanza"
- **abraham**: 15+ missing accents fixed (día, miró, inclinó, traeré, lavaré, etc.)
- **al-despertar**: 30+ missing accents fixed throughout

## Needs Human Review

### Timecodes (HIGH PRIORITY)

Only **6 songs** have real audio sync timecodes. The remaining **207 songs** all use placeholder `[00:00.00]` on every line. Real timecodes need to be synced by listening to the audio.

**Songs with real timecodes:**
- a-la-victima-pascual
- a-nadie-demos-ocasion-de-tropiezo
- aclamad-al-senor
- himno-a-la-cruz-gloriosa
- si-hoy-escuchais-su-voz
- tu-que-eres-fiel

### Missing Accents (MEDIUM PRIORITY)

Many songs from the scrapper are missing Spanish diacritical marks throughout their lyrics. The automated fix covered common words (Señor, ángeles, etc.) but a full accent review is needed for:

- [ ] alabad-al-senor-en-el-cielo — extensive missing accents throughout (Señor fixed, but many others remain: "Él", "mandó", etc.)
- [ ] cantico-de-los-tres-jovenes — likely similar accent issues
- [ ] dayenu — check Hebrew/Spanish transliteration
- [ ] canto-de-moises — check accent consistency
- [ ] benedictus — check accent consistency
- [ ] All songs starting with lowercase titles in frontmatter

### Subtitle Verification (LOW PRIORITY)

Some subtitles may not match the PDF. Spot-check these:

- [x] a-ti-senor-se-debe-la-alabanza-en-sion — "Salmo 65 (64)" ✓ matches
- [x] abraham — subtitle has accents, needs dash style check (PDF: "–", md: "-")
- [x] aclamad-al-senor — "Salmo 100 (99)" ✓ matches
- [ ] All remaining songs need subtitle verification against PDF

### Lyrics Text Accuracy (MEDIUM PRIORITY)

Songs that need line-by-line verification against the PDF:

- [ ] a-ti-levanto-mis-ojos — PDF says "los ojos de los siervos **están fijos en** las manos" but markdown says "**miran a** las manos". May be a translation variant — needs human verification
- [ ] a-ti-senor-en-mi-clamor-imploro — verify lyrics content is complete (was originally a draft)
- [ ] a-ti-senor-levanto-mi-alma — was marked `draft: true`, verify content completeness
- [ ] al-despertar — line with standalone `[Mi-]` chord and no lyrics text, verify against PDF
- [ ] All songs from the scrapper need lyrics verification — the scrapper may have introduced OCR-style errors

### Chord Name Consistency (LOW PRIORITY)

The PDF uses spaced chord names like "Re– 9", "Fa7 aum", "La–" while the markdown uses compact forms like "Re-9", "Fa7aum", "La-". This is a stylistic choice but should be consistent:

- [ ] Decide on chord naming convention (compact vs spaced)
- [ ] Verify chord names match between PDF and markdown for each song

### Structural Differences (MEDIUM PRIORITY)

Some songs may have structural differences between the markdown and PDF (missing verses, different verse/chorus ordering, missing BIS/repeat markers):

- [ ] Songs with "BIS" or "BIS Asamblea" markers in PDF — verify these are represented in markdown
- [ ] Songs with "Mujeres:" / "Hombres:" / "Niños:" voice labels — a-ti-levanto-mis-ojos has these in PDF but may not in markdown
- [ ] alabad-al-senor-en-el-cielo — complex responsive format with side-by-side "¡ALABADLO!" responses

### Songs Not in PDF (LOW PRIORITY)

These songs exist in the content but are not in the Resucitó XX Edición 2014 PDF. They may be newer additions or from a different source:

- [ ] el-mesias-leon
- [ ] es-paciente-himno-al-espiritu-santo
- [ ] como-oveja-que-ve-como-se-llevan-su-corderito-al-matadero
- [ ] la-espada
- [ ] a-tu-luz-senor-vemos-la-luz
- [ ] carmen-63-estan-rotas-mis-ataduras
- [ ] aleluya-pascual
- [ ] cordero-de-dios
- [ ] bendicion-del-agua

### Audio Files (LOW PRIORITY)

- [ ] 12 songs have no audio file (no MP3 in their directory)
- [ ] Verify all audio files play correctly
- [ ] Audio quality varies — some may need re-recording
