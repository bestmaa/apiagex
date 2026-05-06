export const relationErrors = {
  metadataForNonRelationField: "RELATION_METADATA_FOR_NON_RELATION_FIELD",
  entryReferenced: "RELATION_ENTRY_REFERENCED",
  oneToOneConflict: "RELATION_ONE_TO_ONE_CONFLICT",
  targetEntryInvalid: "RELATION_TARGET_ENTRY_INVALID",
  targetMissing: "RELATION_TARGET_MISSING",
  targetRequired: "RELATION_TARGET_REQUIRED",
  typeInvalid: "RELATION_TYPE_INVALID",
  valueShapeInvalid: "RELATION_VALUE_SHAPE_INVALID",
} as const;

export type RelationErrorCode = (typeof relationErrors)[keyof typeof relationErrors];

export function relationEntryReferenced(entryId: string): string {
  return `${relationErrors.entryReferenced}:${entryId}`;
}

export function relationTargetEntryInvalid(fieldSlug: string): string {
  return `${relationErrors.targetEntryInvalid}:${fieldSlug}`;
}

export function relationOneToOneConflict(fieldSlug: string): string {
  return `${relationErrors.oneToOneConflict}:${fieldSlug}`;
}

export function relationValueShapeInvalid(fieldSlug: string): string {
  return `${relationErrors.valueShapeInvalid}:${fieldSlug}`;
}
