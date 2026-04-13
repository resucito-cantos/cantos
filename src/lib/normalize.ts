/**
 * Strip diacritical marks and lowercase for search matching.
 * "víctima" → "victima", "Señor" → "senor"
 *
 * Used by both the build-time index generator and runtime search.
 */
export function normalize(str: string): string {
	return str
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");
}
