import { describe, expect, it } from "vitest";
import { renderApiagexTypes } from "../src/typegen.js";

describe("Apiagex typegen", () => {
  it("renders specific types for option, number, and string-like fields", () => {
    const output = renderApiagexTypes([
      {
        description: "",
        fields: [
          field("status", "enum", { options: ["draft", "published"], required: true }),
          field("tags", "multiSelect", { options: ["new", "sale"] }),
          field("count", "integer"),
          field("price", "decimal"),
          field("starts", "datetime"),
          field("hero", "image"),
        ],
        id: "schema_1",
        name: "Product",
        slug: "product",
      },
    ]);

    expect(output).toContain('status: "draft" | "published";');
    expect(output).toContain('tags?: Array<"new" | "sale"> | null;');
    expect(output).toContain("count?: number | null;");
    expect(output).toContain("price?: number | null;");
    expect(output).toContain("starts?: string | null;");
    expect(output).toContain("hero?: string | null;");
  });
});

function field(
  slug: string,
  type: Parameters<typeof renderApiagexTypes>[0][number]["fields"][number]["type"],
  patch: Partial<Parameters<typeof renderApiagexTypes>[0][number]["fields"][number]> = {},
) {
  return {
    id: `field_${slug}`,
    name: slug,
    options: [],
    position: 0,
    required: false,
    schemaId: "schema_1",
    slug,
    type,
    ...patch,
  };
}
