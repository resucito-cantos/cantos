/**
 * Script to update canto frontmatter with categories and tags from the PDF index.
 * Run with: npx tsx scripts/update-categories.ts
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CONTENT_DIR = join(import.meta.dirname, "../content/cantos");

// Song title -> category mapping from PDF pages 12-14
const PRECATECUMENADO: string[] = [
	"A la víctima pascual",
	"A nadie demos ocasión de tropiezo",
	"A ti levanto mis ojos",
	"A ti, Señor, en mi clamor imploro",
	"A ti, Señor, levanto mi alma",
	"A ti, Señor, se debe la alabanza en Sión",
	"Abraham",
	"Aclamad al Señor",
	"Al despertar",
	"Alabad al Señor en el cielo",
	"Alegría, ha nacido el salvador",
	"Aleluya, alabad al Señor",
	"Aleluya, bendecid al Señor",
	"Aleluya, ya llegó el reino",
	"Alzaos puertas",
	"Amén, amén, amén",
	"Amo al Señor",
	"Aquedah",
	"Ave María I",
	"Ave María II (1984)",
	"Babilonia criminal",
	"Balaam",
	"Bendeciré al Señor en todo tiempo",
	"Bendice, alma mía, a Yahveh",
	"Bendita eres tú, María",
	"Bendito eres, Señor",
	"Benedictus",
	"Cantad a Dios",
	"Cantad al Señor",
	"Cántico de los tres jóvenes",
	"Canto de Moisés",
	"Caritas Christi urget nos",
	"Cómo es maravilloso",
	"Como la cierva",
	"Cristo es la luz",
	"Cuando el Señor",
	"Cuando Israel salió de Egipto",
	"Dayenú",
	"De Profundis",
	"Decidle a los de corazón cansado",
	"Delante de los ángeles",
	"Día de reposo",
	"Dice el Señor a mi Señor",
	"Dichoso el hombre",
	"El necio piensa que Dios no existe",
	"El pueblo que caminaba en las tinieblas",
	"El Señor anuncia una noticia",
	"El Señor es mi pastor",
	"Elí, Elí, lamá sabactaní",
	"En medio de aquel gentío",
	"Eres hermoso",
	"Escóndeme en lo oculto de tu tienda",
	"Están rotas mis ataduras",
	"Éste es el día en que actuó el Señor",
	"Este es el mandamiento mío",
	"Evenu shalom alejem",
	"Exultad, justos, en el Señor",
	"Felicidad para el hombre",
	"Gracias a Yahveh",
	"Gritad jubilosos",
	"Hacia ti morada santa",
	"Hasta cuándo",
	"He aquí que vengo presto",
	"He esperado en el Señor",
	"Hijas de Jerusalén",
	"Himno a Cristo Luz",
	"Himno a la kenosis",
	"Himno de Adviento",
	"Himno de la Ascensión",
	"Himno de Pascua",
	"Id y anunciad a mis hermanos",
	"Improperios",
	"Jerusalén reconstruida",
	"La marcha es dura",
	"La Salve",
	"La siega de las naciones",
	"Levanto mis ojos a los montes",
	"Llegue hasta tu presencia mi clamor",
	"Llévame al cielo",
	"Magníficat",
	"María, casa de bendición",
	"María de Jasna Góra",
	"María, madre de la Iglesia",
	"María, madre del camino ardiente",
	"María, pequeña María",
	"Me enseñarás el camino de la vida",
	"Me has seducido, Señor",
	"Mirad qué estupendo",
	"Misericordia mía, misericordia",
	"Mucho me han perseguido",
	"No está aquí, resucitó",
	"Oh cielos, lloved de lo alto",
	"Oh Dios, por tu nombre sálvame",
	"Oh Dios, tú eres mi Dios",
	"Oh Jesús, amor mío",
	"Oh muerte, ¿dónde está tu victoria?",
	"Oh Señor, nuestro Dios",
	"Os tomaré de entre las naciones",
	"Paloma incorrupta",
	"Pentecostés",
	"Por el amor de mis amigos",
	"Por qué esta noche es diferente",
	"Por qué las gentes conjuran",
	"Porque mi yugo es suave",
	"Qué amables son tus moradas",
	"Qué estupendo, qué alegría",
	"Quién nos separará",
	"Quiero cantar",
	"Resucitó",
	"Resurrexit",
	"Salve, reina de los cielos",
	"Se encontraron dos ángeles",
	"Secuencia del Corpus Christi",
	"Señor, ayúdame a no dudar de ti",
	"Señor, no me corrijas en tu cólera",
	"Shlom-lej Mariam",
	"Si el Señor no construye la casa",
	"Si habéis resucitado con Cristo",
	"Si hoy escucháis su voz",
	"Si me he refugiado en el Señor",
	"Siéntate solitario y silencioso",
	"Sión, madre de todos los pueblos",
	"Sola a Solo",
	"Stabat mater dolorosa",
	"Sube Dios entre aclamaciones",
	"Te estoy llamando, Señor",
	"Te he manifestado mi pecado",
	"Tú eres mi esperanza, Señor",
	"Tú has cubierto de vergüenza la muerte",
	"Tú que eres fiel",
	"Un retoño brota del tronco de Jesé",
	"Una gran señal",
	"Uri, uri, uri, urá",
	"Vamos ya, pastores",
	"Ven, Espíritu Santo",
	"Ven, Hijo del Hombre",
	"Veni Creator",
	"Viene el Señor",
	"Virgen de la maravilla",
	"Vivid alegres",
	"Vosotros sois la luz del mundo",
	"Ya viene mi Dios",
	"Yahveh, tú eres mi Dios",
	"Yo te amo, Señor",
	"Yo vengo a reunir",
	"Zaqueo",
];

const CATECUMENADO: string[] = [
	"Así habla el amén",
	"Bendito sea Dios",
	"Como el impulso que siente la ira",
	"Consolad a mi pueblo",
	"Débora",
	"El combate escatológico",
	"El lagarero",
	"El mismo Dios",
	"El sembrador",
	"El Señor me ha dado",
	"Eres digno de tomar el libro",
	"Escuchad islas lejanas",
	"He aquí mi siervo",
	"He aquí que nuestro espejo es el Señor",
	"Himno a la cruz gloriosa",
	"Jacob",
	"Las armas de la luz",
	"Ninguno puede servir a dos señores",
	"No hay en él parecer",
	"No resistáis al mal",
	"No sufras por los malvados",
	"Oh Señor, mi corazón ya no es ambicioso",
	"Señor, tú me escrutas y conoces",
	"Shemá Israel",
	"Siéntate solitario y silencioso",
	"Tú has cubierto de vergüenza la muerte",
];

const ELECCION: string[] = [
	"A la cena del cordero",
	"Abbá Padre",
	"Adónde te escondiste amado",
	"Como condenados a muerte",
	"Como destila la miel",
	"Como lirio entre los cardos",
	"Cuando dormía",
	"El Espíritu del Señor está sobre mí",
	"El jacal de los pastores",
	"En una noche oscura",
	"Extiendo mis manos",
	"Hermosa eres, amiga mía",
	"Himno a la caridad",
	"Huye, amado mío",
	"Jesús recorría todas las ciudades",
	"La cordera de Dios",
	"La paloma voló",
	"La voz de mi amado",
	"Me robaste el corazón",
	"No resistáis al mal",
	"Noli me tangere",
	"Quién es ésta que sube del desierto",
	"Quiero andar",
	"Sermón de la montaña",
	"Suba el Esposo al leño de su tálamo",
	"Tú eres mi esperanza, Señor",
	"Ven del Líbano",
];

// Liturgical tags from PDF pages 15-18
const LITURGICAL_TAGS: Record<string, string[]> = {
	Cuaresma: [
		"A ti levanto mis ojos",
		"A ti, Señor, en mi clamor imploro",
		"A ti, Señor, levanto mi alma",
		"A ti, Señor, se debe la alabanza en Sión",
		"Al despertar",
		"Amo al Señor",
		"Así habla el amén",
		"Babilonia criminal",
		"Bendeciré al Señor en todo tiempo",
		"Bendice, alma mía, a Yahveh",
		"Cantad a Dios",
		"Como la cierva",
		"Cuando el Señor",
		"De Profundis",
		"Decidle a los de corazón cansado",
		"Elí, Elí, lamá sabactaní",
		"Extiendo mis manos",
		"Hasta cuándo",
		"He aquí que nuestro espejo es el Señor",
		"He esperado en el Señor",
		"Hijas de Jerusalén",
		"Himno a la kenosis",
		"Himno a la cruz gloriosa",
		"Improperios",
		"Jerusalén reconstruida",
		"La marcha es dura",
		"La siega de las naciones",
		"Las armas de la luz",
		"Levanto mis ojos a los montes",
		"Llegue hasta tu presencia mi clamor",
		"María, madre de la Iglesia",
		"Misericordia mía, misericordia",
		"No sufras por los malvados",
		"Oh Jesús, amor mío",
		"Porque mi yugo es suave",
		"Quiero cantar",
		"Señor, ayúdame a no dudar de ti",
		"Si me he refugiado en el Señor",
		"Siéntate solitario y silencioso",
		"Stabat mater dolorosa",
		"Te he manifestado mi pecado",
		"Tú eres mi esperanza, Señor",
		"Tú que eres fiel",
		"Yahveh, tú eres mi Dios",
		"Zaqueo",
	],
	Pascua: [
		"A la cena del cordero",
		"Adónde te escondiste amado",
		"A la víctima pascual",
		"Aleluya, alabad al Señor",
		"Aleluya, bendecid al Señor",
		"Aquedah",
		"Canto de Moisés",
		"Como destila la miel",
		"Como lirio entre los cardos",
		"Cuando dormía",
		"Cuando Israel salió de Egipto",
		"Dayenú",
		"El combate escatológico",
		"El jacal de los pastores",
		"En una noche oscura",
		"Gloria a Dios en lo alto del cielo",
		"Hermosa eres, amiga mía",
		"Himno a la caridad",
		"Himno de Pascua",
		"Huye, amado mío",
		"La cordera de Dios",
		"La paloma voló",
		"La voz de mi amado",
		"Me robaste el corazón",
		"Noli me tangere",
		"Quién es ésta que sube del desierto",
		"Quiero andar",
		"Sermón de la montaña",
		"Suba el Esposo al leño de su tálamo",
		"Tú eres mi esperanza, Señor",
		"Ven del Líbano",
	],
	Navidad: [
		"Alegría, ha nacido el salvador",
		"El pueblo que caminaba en las tinieblas",
		"La cordera de Dios",
		"Un retoño brota del tronco de Jesé",
		"Uri, uri, uri, urá",
		"Vamos ya, pastores",
		"Ya viene mi Dios",
	],
	Pentecostés: [
		"A la víctima pascual",
		"Himno a la caridad",
		"Llévame al cielo",
		"Pentecostés",
		"Secuencia del Corpus Christi",
		"Shemá Israel",
		"Sube Dios entre aclamaciones",
		"Un retoño brota del tronco de Jesé",
		"Una gran señal",
		"Ven, Espíritu Santo",
		"Veni Creator",
		"Viene el Señor",
	],
	"Virgen": [
		"Ave María I",
		"Ave María II (1984)",
		"Bendita eres tú, María",
		"Débora",
		"La cordera de Dios",
		"La Salve",
		"Magníficat",
		"María, casa de bendición",
		"María, madre de la Iglesia",
		"María, madre del camino ardiente",
		"María, pequeña María",
		"Paloma incorrupta",
		"Salve, reina de los cielos",
	],
	"Niños": [
		"Alegría, ha nacido el salvador",
		"Aleluya, bendecid al Señor",
		"Aquedah",
		"Por qué esta noche es diferente",
		"Se encontraron dos ángeles",
		"Uri, uri, uri, urá",
		"Vamos ya, pastores",
		"Vivid alegres",
		"Ya viene mi Dios",
	],
	"Entrada": [
		"A la cena del cordero",
		"A la víctima pascual",
		"Abraham",
		"Alzaos puertas",
		"Amén, amén, amén",
		"Bendita eres tú, María",
		"María, casa de bendición",
		"María, madre de la Iglesia",
		"María, madre del camino ardiente",
		"María, pequeña María",
	],
	"Paz": [
		"Aleluya, bendecid al Señor",
		"Balaam",
		"Cómo es maravilloso",
		"Consolad a mi pueblo",
		"Dayenú",
		"Evenu shalom alejem",
		"Gracias a Yahveh",
		"Jerusalén reconstruida",
		"Mirad qué estupendo",
		"Por el amor de mis amigos",
		"Por qué esta noche es diferente",
		"Qué estupendo, qué alegría",
		"Se encontraron dos ángeles",
		"Sube Dios entre aclamaciones",
	],
	"Comunión": [
		"A la víctima pascual",
		"Abbá Padre",
		"Aleluya, ya llegó el reino",
		"Balaam",
		"Como destila la miel",
		"Como el impulso que siente la ira",
		"Como lirio entre los cardos",
		"Cuando dormía",
		"El jacal de los pastores",
		"El mismo Dios",
		"El Señor es mi pastor",
		"En medio de aquel gentío",
		"Este es el mandamiento mío",
		"Gracias a Yahveh",
		"Hermosa eres, amiga mía",
		"Himno a la caridad",
		"Huye, amado mío",
		"La paloma voló",
		"Me robaste el corazón",
		"No está aquí, resucitó",
		"No resistáis al mal",
		"Oh muerte, ¿dónde está tu victoria?",
		"Oh Señor, nuestro Dios",
		"Pentecostés",
		"Quién es ésta que sube del desierto",
		"Quién nos separará",
	],
	"Final": [
		"Aclamad al Señor",
		"Aleluya, alabad al Señor",
		"Aleluya, bendecid al Señor",
		"Aleluya, ya llegó el reino",
		"Balaam",
		"Bendita eres tú, María",
		"Cantad a Dios",
		"Cantad al Señor",
		"Cántico de los tres jóvenes",
		"Como la cierva",
		"Cómo es maravilloso",
		"Cuando el Señor",
		"Cuando Israel salió de Egipto",
		"Delante de los ángeles",
		"El Espíritu del Señor está sobre mí",
		"Eres hermoso",
		"Escóndeme en lo oculto de tu tienda",
		"Están rotas mis ataduras",
		"Gritad jubilosos",
		"Himno a la cruz gloriosa",
		"Himno de la Ascensión",
		"Himno de Pascua",
		"La paloma voló",
		"Las armas de la luz",
		"Levanto mis ojos a los montes",
		"Llegue hasta tu presencia mi clamor",
		"María, casa de bendición",
		"Me enseñarás el camino de la vida",
		"Oh Señor, nuestro Dios",
		"Os tomaré de entre las naciones",
		"Qué amables son tus moradas",
		"Secuencia del Corpus Christi",
		"Si el Señor no construye la casa",
		"Tú que eres fiel",
		"Ven del Líbano",
		"Yo vengo a reunir",
		"Zaqueo",
	],
};

// Normalize title for matching against directory slugs
function slugify(title: string): string {
	return title
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // remove diacritics
		.replace(/[^a-z0-9\s-]/g, "") // remove special chars
		.replace(/\s+/g, "-") // spaces to hyphens
		.replace(/-+/g, "-") // collapse hyphens
		.replace(/^-|-$/g, ""); // trim hyphens
}

// Build title -> slug lookup from existing directories
function buildSlugMap(): Map<string, string> {
	const dirs = readdirSync(CONTENT_DIR, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name);

	const map = new Map<string, string>();
	for (const dir of dirs) {
		map.set(dir, dir);
	}
	return map;
}

// Build category map: slug -> category
function buildCategoryMap(slugMap: Map<string, string>): Map<string, string> {
	const catMap = new Map<string, string>();

	for (const title of PRECATECUMENADO) {
		const slug = slugify(title);
		const match = findBestMatch(slug, slugMap);
		if (match) catMap.set(match, "Precatecumenado");
	}
	for (const title of CATECUMENADO) {
		const slug = slugify(title);
		const match = findBestMatch(slug, slugMap);
		if (match) catMap.set(match, "Catecumenado");
	}
	for (const title of ELECCION) {
		const slug = slugify(title);
		const match = findBestMatch(slug, slugMap);
		if (match) catMap.set(match, "Elección");
	}

	return catMap;
}

// Build tags map: slug -> tags[]
function buildTagsMap(slugMap: Map<string, string>): Map<string, string[]> {
	const tagsMap = new Map<string, string[]>();

	for (const [tag, titles] of Object.entries(LITURGICAL_TAGS)) {
		for (const title of titles) {
			const slug = slugify(title);
			const match = findBestMatch(slug, slugMap);
			if (match) {
				const existing = tagsMap.get(match) ?? [];
				if (!existing.includes(tag)) {
					existing.push(tag);
				}
				tagsMap.set(match, existing);
			}
		}
	}

	return tagsMap;
}

// Find best matching directory for a slugified title
function findBestMatch(
	slug: string,
	slugMap: Map<string, string>,
): string | null {
	// Exact match
	if (slugMap.has(slug)) return slug;

	// Try prefix match
	for (const dir of slugMap.keys()) {
		if (dir.startsWith(slug) || slug.startsWith(dir)) return dir;
	}

	return null;
}

// Update frontmatter in a markdown file
function updateFrontmatter(
	filePath: string,
	category: string | null,
	tags: string[],
): void {
	const content = readFileSync(filePath, "utf-8");
	const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
	if (!fmMatch) return;

	let fm = fmMatch[1];

	// Update category
	if (category) {
		fm = fm.replace(/^category:\s*".*"$/m, `category: "${category}"`);
	}

	// Update tags
	if (tags.length > 0) {
		const tagsYaml = tags.map((t) => `- ${t}`).join("\n");
		// Replace existing tags block
		fm = fm.replace(/^tags:\s*\n(- .*\n?)*/m, `tags:\n${tagsYaml}\n`);
	}

	const updated = content.replace(/^---\n[\s\S]*?\n---/, `---\n${fm}\n---`);
	writeFileSync(filePath, updated);
}

// Main
const slugMap = buildSlugMap();
const categoryMap = buildCategoryMap(slugMap);
const tagsMap = buildTagsMap(slugMap);

let updatedCount = 0;
let skippedCount = 0;

for (const dir of slugMap.keys()) {
	const filePath = join(CONTENT_DIR, dir, "index.md");
	const category = categoryMap.get(dir) ?? null;
	const tags = tagsMap.get(dir) ?? [];

	if (category || tags.length > 0) {
		updateFrontmatter(filePath, category, tags);
		console.log(
			`✓ ${dir}: category=${category ?? "—"}, tags=[${tags.join(", ")}]`,
		);
		updatedCount++;
	} else {
		skippedCount++;
	}
}

console.log(`\nDone: ${updatedCount} updated, ${skippedCount} unchanged`);

// Report unmatched titles
const allTitles = [
	...PRECATECUMENADO,
	...CATECUMENADO,
	...ELECCION,
	...Object.values(LITURGICAL_TAGS).flat(),
];
const unmatched = new Set<string>();
for (const title of allTitles) {
	const slug = slugify(title);
	if (!findBestMatch(slug, slugMap)) {
		unmatched.add(title);
	}
}
if (unmatched.size > 0) {
	console.log(`\nUnmatched titles (${unmatched.size}):`);
	for (const t of unmatched) {
		console.log(`  - ${t} (slug: ${slugify(t)})`);
	}
}
