export type FieldType =
  | "text"
  | "longText"
  | "number"
  | "boolean"
  | "date"
  | "json"
  | "media"
  | "relation";

export type SchemaFieldDraft = {
  name: string;
  slug: string;
  type: FieldType;
  required: boolean;
  relationSchemaId?: string;
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
