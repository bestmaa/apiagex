import { describe, expect, it } from "vitest";
import {
  relationErrors,
  relationEntryReferenced,
  relationOneToOneConflict,
  relationTargetEntryInvalid,
  relationValueShapeInvalid,
} from "../src/index.js";

describe("relation error codes", () => {
  it("exports stable relation error strings", () => {
    expect(relationErrors).toEqual({
      metadataForNonRelationField: "RELATION_METADATA_FOR_NON_RELATION_FIELD",
      entryReferenced: "RELATION_ENTRY_REFERENCED",
      oneToOneConflict: "RELATION_ONE_TO_ONE_CONFLICT",
      targetEntryInvalid: "RELATION_TARGET_ENTRY_INVALID",
      targetMissing: "RELATION_TARGET_MISSING",
      targetRequired: "RELATION_TARGET_REQUIRED",
      typeInvalid: "RELATION_TYPE_INVALID",
      valueShapeInvalid: "RELATION_VALUE_SHAPE_INVALID",
    });
  });

  it("formats field-specific relation errors", () => {
    expect(relationEntryReferenced("entry-1")).toBe("RELATION_ENTRY_REFERENCED:entry-1");
    expect(relationOneToOneConflict("author")).toBe("RELATION_ONE_TO_ONE_CONFLICT:author");
    expect(relationTargetEntryInvalid("author")).toBe("RELATION_TARGET_ENTRY_INVALID:author");
    expect(relationValueShapeInvalid("tags")).toBe("RELATION_VALUE_SHAPE_INVALID:tags");
  });
});
