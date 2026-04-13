# Song-by-Song Review Notes

Comparing rendered pages against PDF (Resucitó XX Edición 2014) and scrapper images.

**Legend:**
- ✅ = matches PDF, no issues
- ⚠️ = minor issues
- ❌ = major issues (missing content, wrong layout)

## Systemic Issues (affect multiple songs)

### Trailing chord rendering bug
When a chord appears at end of line with no text after it (e.g., `templo, [Re] [La]`), the chord name renders inline as plaintext instead of above. Affects: aleluya-alabad-al-senor, aleluya-bendecid-al-senor, aleluya-ya-llego-el-reino, alzaos-puertas, and likely many more. **Needs parser/renderer fix.**

### Missing accents (widespread)
Many songs from the scrapper are missing Spanish diacritical marks. Common patterns:
- "SENOR" → "SEÑOR", "CORAZON" → "CORAZÓN"  
- "Quien" → "Quién", "SUBIRA" → "SUBIRÁ"
- "ejercitos" → "ejércitos", "El" → "Él" (pronoun)
- "Alegria" → "Alegría", "Belen" → "Belén"

### Chord name inconsistency
Some songs use "Lam", "Rem", "Mim" (e.g., a-ti-senor-levanto-mi-alma) while most use "La-", "Re-", "Mi-". Should standardize.

### Missing BIS markers
Several songs in the PDF have "BIS" or "BIS Asamblea" labels that aren't in the markdown content.

### Missing voice labels
PDF uses "Mujeres:", "Hombres:", "Niños:" labels on some songs. Not supported in the ChordPro parser or renderer.

---

## Reviewed Songs

### 1. A la víctima pascual (p.21) ✅
No issues found.

### 2. A nadie demos ocasión de tropiezo (p.22) ✅
No issues found.

### 3. A ti levanto mis ojos (p.23) ⚠️
- [ ] Missing "BIS Asamblea" on opening chorus
- [ ] Missing "Mujeres:" / "Hombres:" voice labels
- [ ] Lyrics difference: PDF "están fijos en" vs markdown "miran a" — needs human verification

### 4. A ti, Señor, en mi clamor imploro (p.24) ❌
- [ ] **EMPTY** — no chordpro content. Entire song needs transcription from PDF p.24
- PDF: two-column, Cejilla 2º traste, chorus "A TI, SEÑOR, EN MI CLAMOR IMPLORO" / "A TI, YO CLAMO SEÑOR"

### 5. A ti, Señor, levanto mi alma (p.25) ⚠️
- [ ] Chord names use "Lam", "Rem" instead of "La-", "Re-" (inconsistent)
- Layout and lyrics correct ✓

### 6. A ti, Señor, se debe la alabanza en Sión (p.26) ✅
No issues found.

### 7. Abraham (p.27) ⚠️
- [ ] Verify guillemets «» around quoted speech match PDF

### 8. Aclamad al Señor (p.28) ⚠️
- [ ] Missing "BIS Asamblea" on opening chorus
- [ ] Check accent: "¡Acercaos a él" (accent on él)

### 9. Al despertar (p.29) ✅
Looks correct. Two-column layout matches PDF.

### 10. Alabad al Señor en el cielo (p.30) ⚠️
- [ ] Unique responsive layout in PDF: "¡ALABADLO!" appears to the RIGHT of each verse line (call-and-response). Current rendering stacks them vertically.
- [ ] Missing accents: "Él", "mandó"

### 11. Alegría, ha nacido el salvador (p.31) ⚠️
- [ ] Missing accents: "Alegria" → "Alegría", "Belen" → "Belén", "panales" → "pañales"
- [ ] Missing BIS on "¡ALEGRÍA, ALEGRÍA, ALEGRÍA..." chorus
- [ ] Title missing accent: "ALEGRIA" → "ALEGRÍA"

### 12. Aleluya, alabad al Señor (p.32) ⚠️
- [ ] **Trailing chord bug**: chords at end of lines render inline (e.g., "templo, ReLa")
- Layout otherwise matches PDF ✓

### 13. Aleluya, bendecid al Señor (p.33) ⚠️
- [ ] **Trailing chord bug**: "YA,La" inline
- [ ] Missing "Niños:" voice label on opening section
- [ ] Missing accent: "Alzad a El" → "Alzad a Él"
- [ ] Verify Cejilla 2º traste present

### 14. Aleluya, ya llegó el reino (p.34) ⚠️
- [ ] **Trailing chord bug** on multiple lines
- [ ] Title missing accent: "LLEGO" → "LLEGÓ"

### 15. Alzaos puertas (p.35) ⚠️
- [ ] Missing accents: "SENOR", "CORAZON", "ejercitos", "SUBIRA", "Quien" → "Quién"
- [ ] **Trailing chord bug**: "gloria?Mi-"
- [ ] Missing opening "¿" on questions

---

## Not Yet Reviewed

Continue from:
- Amén, amén, amén (p.36)
- Amo al Señor (p.37)
- Aquedah (p.38)
- Ave María I (p.39)
- Ave María II (1984) (p.40)
- Babilonia criminal (p.41)
- Balaam (p.42)
- ... (continue through all remaining songs)

## Priority Fixes

1. **Trailing chord rendering bug** — parser/renderer issue, affects many songs
2. **Bulk accent fix** — programmatic pass for common missing accents
3. **Empty songs** — transcribe from PDF (a-ti-senor-en-mi-clamor-imploro)
4. **BIS markers** — add missing BIS to songs that have it in PDF
5. **Chord name standardization** — convert "Lam"→"La-" etc.
