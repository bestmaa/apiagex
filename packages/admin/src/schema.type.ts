export type FieldType =
  | "text"
  | "longText"
  | "number"
  | "boolean"
  | "date"
  | "json"
  | "media"
  | "relation";

export type RelationType =
  | "oneToOne"
  | "oneToMany"
  | "manyToOne"
  | "manyToMany";

export type SingleRelationValue = string | null;

export type MultiRelationValue = string[];

export type RelationValue = SingleRelationValue | MultiRelationValue;

export type RelationFieldContract = {
  relationSchemaId: string;
  relationType: RelationType;
  required: boolean;
  valueShape: "single" | "multi";
};

export type RelationTargetSummary = {
  id: string;
  name: string;
  slug: string;
};

export type SchemaFieldDraft = {
  name: string;
  slug: string;
  type: FieldType;
  required: boolean;
  relationSchemaId?: string;
  relationType?: RelationType;
  relationTarget?: RelationTargetSummary;
};

export type SchemaDraft = {
  name: string;
  slug: string;
  description: string;
  fields: SchemaFieldDraft[];
};

export type SchemaRecord = SchemaDraft & {
  id: string;
};

export type SchemaListResponse = {
  ok: boolean;
  schemas?: SchemaRecord[];
  error?: string;
};

export type SchemaMutationResponse = {
  ok: boolean;
  schema?: SchemaRecord;
  error?: string;
};
