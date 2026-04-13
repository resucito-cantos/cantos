# Song-by-Song Review Notes

Comparing rendered pages against PDF (Resucitó XX Edición 2014) and scrapper images.

**Legend:**
- ✅ = matches PDF, no issues
- ⚠️ = minor issues remaining
- ❌ = major issues (missing content, wrong layout)
- ~~strikethrough~~ = fixed

## Systemic Issues (affect multiple songs)

### ~~Trailing chord rendering bug~~ ✅ FIXED
~~When a chord appears at end of line with no text after it, the chord name renders inline.~~
Fixed: empty chord segments now render with non-breaking space.

### ~~Missing accents (widespread)~~ ✅ MOSTLY FIXED
Bulk accent fix applied: AMÉN, SEÑOR, MARÍA, JESÚS, CORAZÓN, ORACIÓN, ángeles, ejércitos, Jerusalén, Belén, Alegría, pañales, and many verb forms. Some songs may still have individual accent issues.

### ~~Chord name inconsistency~~ ✅ FIXED
Converted "Lam"→"La-", "Rem"→"Re-", etc. across 11 files.

### ~~Missing ¡¿ openers~~ ✅ MOSTLY FIXED
Programmatic fix applied for common patterns. Some edge cases may remain.

### Missing BIS markers — STILL OPEN
Several songs in the PDF have "BIS" or "BIS Asamblea" labels not in the markdown.

### Missing voice labels — STILL OPEN (feature needed)
PDF uses "Mujeres:", "Hombres:", "Niños:" labels. Not supported in parser/renderer.

### Compound chord notation — STILL OPEN
"Do|Mi|Fa" pipe notation in ave-maria-ii-1984 renders as merged text.

---

## Reviewed Songs

### 1. A la víctima pascual (p.21) ✅
No issues.

### 2. A nadie demos ocasión de tropiezo (p.22) ✅
No issues.

### 3. A ti levanto mis ojos (p.23) ⚠️
- [ ] Missing "BIS Asamblea" on opening chorus
- [ ] Missing "Mujeres:" / "Hombres:" voice labels
- [ ] Lyrics difference: PDF "están fijos en" vs markdown "miran a" — needs human verification

### 4. A ti, Señor, en mi clamor imploro (p.24) ❌
- [ ] **EMPTY** — no chordpro content. Entire song needs transcription from PDF p.24

### 5. A ti, Señor, levanto mi alma (p.25) ✅
- [x] ~~Chord names "Lam"→"La-"~~ FIXED

### 6. A ti, Señor, se debe la alabanza en Sión (p.26) ✅
No issues.

### 7. Abraham (p.27) ⚠️
- [ ] Verify guillemets «» around quoted speech match PDF

### 8. Aclamad al Señor (p.28) ⚠️
- [ ] Missing "BIS Asamblea" on opening chorus
- [ ] Check accent on "él"

### 9. Al despertar (p.29) ✅
No issues.

### 10. Alabad al Señor en el cielo (p.30) ⚠️
- [ ] Unique call-and-response layout in PDF not reproducible with current structure
- [x] ~~Missing accents~~ MOSTLY FIXED

### 11. Alegría, ha nacido el salvador (p.31) ⚠️
- [x] ~~Missing accents: Alegría, Belén, pañales~~ FIXED
- [ ] Missing BIS on chorus
- [x] ~~Title accent~~ FIXED

### 12. Aleluya, alabad al Señor (p.32) ✅
- [x] ~~Trailing chord bug~~ FIXED (renderer)

### 13. Aleluya, bendecid al Señor (p.33) ⚠️
- [x] ~~Trailing chord bug~~ FIXED
- [ ] Missing "Niños:" voice label
- [x] ~~Missing accent "Él"~~ FIXED

### 14. Aleluya, ya llegó el reino (p.34) ✅
- [x] ~~Trailing chord bug~~ FIXED
- [x] ~~Title accent "llegó"~~ FIXED

### 15. Alzaos puertas (p.35) ⚠️
- [x] ~~Most accents~~ FIXED
- [x] ~~Trailing chord bug~~ FIXED
- [x] ~~Missing ¡¿~~ FIXED
- [ ] Some individual accents may remain

### 16. Amén, amén, amén (p.36) ✅
- [x] ~~All accents~~ FIXED
- [x] ~~Title~~ FIXED

### 17. Amo al Señor (p.37) ⚠️
- [x] ~~Most accents (MÍA, Tenía, aún)~~ FIXED
- [ ] Missing "BIS A." on opening verse
- [ ] Some individual accents may remain

### 18. Aquedah (p.38) ⚠️
- [x] ~~Some accents~~ FIXED by bulk pass
- [ ] Missing BIS on choruses
- [ ] Verify «» guillemet quotes

### 19. Ave María I (p.39) ✅
- [x] ~~Trailing chord bug~~ FIXED
- [x] ~~Accents (María, Jesús, Amén)~~ FIXED

### 20. Ave María II (1984) (p.40) ⚠️
- [x] ~~Trailing chord bug~~ FIXED
- [x] ~~Accents~~ FIXED
- [ ] Compound chords "Do|Mi|Fa" still render merged

### 21. Babilonia criminal (p.41) ⚠️
- [x] ~~¡ openers~~ FIXED
- [ ] Some individual accents may remain (ACORDÁNDONOS, cántico, DIVIRTIÉRAMOS)

### 22. Balaam (p.42) ⚠️
- [x] ~~Números subtitle, ¡QUE BELLAS~~ FIXED
- [ ] Some accents may remain (león, hará, estás)

### 23. Bendeciré al Señor en todo tiempo (p.43) ✅
- [x] ~~ángel, ¡LO ESCUCHEN~~ FIXED

---

## Not Yet Reviewed

~190 songs remaining from Bendice, alma mía (p.44) onwards.

## Remaining Priority Fixes

1. **Empty songs** — a-ti-senor-en-mi-clamor-imploro needs full transcription
2. **Missing BIS markers** — a-ti-levanto-mis-ojos, aclamad-al-senor, amo-al-senor, aquedah, alegria-ha-nacido-el-salvador
3. **Voice labels** — feature needed for Mujeres/Hombres/Niños
4. **Compound chord notation** — Do|Mi|Fa pipe handling
5. **Individual accent review** — some songs still have scattered missing accents
6. **Guillemets «»** — verify quoted speech in Abraham and others
