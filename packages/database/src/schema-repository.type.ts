export type FieldType =
  | "text"
  | "longText"
  | "number"
  | "boolean"
  | "date"
  | "json"
  | "media"
  | "relation";

export type CreateFieldInput = {
  name: string;
  slug: string;
  type: FieldType;
  required?: boolean;
  relationSchemaId?: string;
};

export type CreateSchemaInput = {
  name: string;
  slug: string;
  description?: string;
  fields: CreateFieldInput[];
};

export type FieldRecord = {
  id: string;
  schemaId: string;
  name: string;
  slug: string;
  type: FieldType;
  required: boolean;
  relationSchemaId?: string | null;
  position: number;
};

export type SchemaRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  fields: FieldRecord[];
};
