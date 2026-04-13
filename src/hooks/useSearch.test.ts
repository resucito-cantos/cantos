import { describe, expect, it } from "vitest";

describe("useSearch", () => {
	it("exports useSearch hook", async () => {
		const mod = await import("./useSearch");
		expect(mod.useSearch).toBeDefined();
		expect(typeof mod.useSearch).toBe("function");
	});
});
