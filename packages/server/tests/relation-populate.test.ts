import { describe, expect, it } from "vitest";
import { shouldPopulateRelations } from "../src/relation-populate.js";

describe("relation populate query parsing", () => {
  it("accepts relation populate aliases", () => {
    expect(shouldPopulateRelations("relations")).toBe(true);
    expect(shouldPopulateRelations("all")).toBe(true);
    expect(shouldPopulateRelations("*")).toBe(true);
  });

  it("ignores unknown populate values without throwing", () => {
    expect(shouldPopulateRelations("media")).toBe(false);
    expect(shouldPopulateRelations("deep")).toBe(false);
    expect(shouldPopulateRelations(undefined)).toBe(false);
  });
});
