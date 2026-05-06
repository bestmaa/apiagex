import { describe, expect, it } from "vitest";
import {
  relationErrors,
  relationTargetEntryInvalid,
  relationValueShapeInvalid,
} from "../src/index.js";

describe("relation error codes", () => {
  it("exports stable relation error strings", () => {
    expect(relationErrors).toEqual({
      metadataForNonRelationField: "RELATION_METADATA_FOR_NON_RELATION_FIELD",
      targetEntryInvalid: "RELATION_TARGET_ENTRY_INVALID",
      targetMissing: "RELATION_TARGET_MISSING",
      targetRequired: "RELATION_TARGET_REQUIRED",
      typeInvalid: "RELATION_TYPE_INVALID",
      valueShapeInvalid: "RELATION_VALUE_SHAPE_INVALID",
    });
  });

  it("formats field-specific relation errors", () => {
    expect(relationTargetEntryInvalid("author")).toBe("RELATION_TARGET_ENTRY_INVALID:author");
    expect(relationValueShapeInvalid("tags")).toBe("RELATION_VALUE_SHAPE_INVALID:tags");
  });
});
